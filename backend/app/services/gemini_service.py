"""
GeminiService — wraps google-generativeai and groq for audit and blueprint generation.
Fully optimized with asyncio and a new Validation Agent.
"""

import json
import logging
import asyncio
from typing import Any

try:
    import google.generativeai as genai
    from google.api_core.exceptions import ResourceExhausted, ServiceUnavailable
except ImportError:
    genai = None

try:
    import groq
    from groq import AsyncGroq
except ImportError:
    groq = None
    AsyncGroq = None

from app.core.config import get_settings
from app.models.schemas import AuditResult, BlueprintResult
from app.prompts.audit_prompt import build_audit_prompt
from app.prompts.blueprint_prompt import build_blueprint_prompt

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self) -> None:
        self.settings = get_settings()
        
        # Setup Groq (Primary High-Speed Model)
        groq_key = self.settings.groq_api_key_3 or self.settings.groq_api_key
        self.groq_enabled = bool(groq_key and AsyncGroq)
        if self.groq_enabled:
            self.groq_client = AsyncGroq(api_key=groq_key.strip())
            self.groq_model = self.settings.groq_model
            logger.info("Groq service ready — model=%s", self.groq_model)
        else:
            self.groq_client = None
            
        # Setup Gemini (Fallback)
        gemini_key = self.settings.gemini_api_key.strip() if self.settings.gemini_api_key else None
        self.gemini_enabled = bool(gemini_key and genai)
        if self.gemini_enabled:
            genai.configure(api_key=gemini_key)
            self.model = genai.GenerativeModel(self.settings.gemini_model)
            logger.info("Gemini fallback ready")

    async def _generate_json_async(self, prompt: str) -> dict[str, Any]:
        """Call Groq (async) and parse output as JSON. Fallback to Gemini async."""
        raw = None
        last_exc = None
        
        if self.groq_enabled:
            try:
                response = await self.groq_client.chat.completions.create(
                    messages=[{"role": "user", "content": prompt}],
                    model=self.groq_model,
                    temperature=0.2,
                )
                raw = response.choices[0].message.content
            except Exception as exc:
                logger.error("Groq generation failed: %s", exc)
                last_exc = exc
                
        # If Groq fails or disabled, use Gemini async
        if not raw and self.gemini_enabled:
            try:
                logger.info("Falling back to Gemini async...")
                response = await self.model.generate_content_async(prompt)
                raw = response.text
            except Exception as exc:
                logger.error("Gemini fallback failed: %s", exc)
                last_exc = exc
                
        if not raw:
            raise last_exc or RuntimeError("No API configured or all failed.")

        raw = raw.strip()
        if "{" in raw and "}" in raw:
            start = raw.find("{")
            end = raw.rfind("}") + 1
            raw = raw[start:end]

        try:
            return json.loads(raw)
        except json.JSONDecodeError as exc:
            logger.error("Model returned invalid JSON: %s\nRaw: %.300s", exc, raw)
            raise

    async def analyze_process(self, submission_data: dict[str, Any]) -> AuditResult:
        """
        Run an AI audit using asyncio.
        Now includes Validation Agent to optimize blueprint.
        """
        prompt = build_audit_prompt(
            process_description=submission_data["process_description"],
            industry=submission_data["industry"],
            team_size=submission_data["team_size"],
            additional_context=submission_data.get("additional_context", ""),
        )

        try:
            # 1. Base Audit
            data = await self._generate_json_async(prompt)
            result = AuditResult.model_validate(data)
            logger.info("Audit complete — score=%d", result.automation_score)
            
            # 2. Base Blueprint
            result.blueprint = await self.generate_blueprint(result)
            
            # 3. Validation Agent (New Feature)
            result.blueprint = await self.validate_and_optimize_blueprint(submission_data, result.blueprint)
            
            return result
        except Exception as exc:
            logger.exception("Audit completely failed, using fallback: %s", exc)
            result = self._fallback_audit(submission_data)
            result.blueprint = self._fallback_blueprint(result)
            return result

    async def generate_blueprint(self, audit_result: AuditResult) -> BlueprintResult:
        payload = audit_result.model_dump_json(exclude={"blueprint", "submission_id"})
        data = await self._generate_json_async(build_blueprint_prompt(payload))
        return BlueprintResult.model_validate(data)

    async def validate_and_optimize_blueprint(self, submission_data: dict[str, Any], blueprint: BlueprintResult) -> BlueprintResult:
        """
        The Validation Agent: researches and swaps generic tools for specific ones based on industry.
        """
        logger.info("Running Validation Agent to optimize tools...")
        bp_json = blueprint.model_dump_json()
        prompt = f"""
You are an expert AI Architect and Data Validator.
Your job is to review the following automation blueprint for a business in the '{submission_data['industry']}' industry.
The process they described is: {submission_data['process_description']}

Current Blueprint:
{bp_json}

INSTRUCTIONS:
1. Review the 'tools' suggested in the 'steps' and the 'integrations' array. Generic tools like 'Zapier', 'Make', or 'Google ADK' might be too broad.
2. Replace or enhance these with highly specific, industry-best tools (e.g., instead of just CRM, specify Salesforce or HubSpot for tech, or specialized tools for healthcare/real estate/etc).
3. Validate that the flow makes logical sense for their process and provides the best outcome.
4. Output ONLY the updated blueprint in exactly the same JSON format. No markdown blocks, just pure JSON matching the original schema structure.
"""
        try:
            data = await self._generate_json_async(prompt)
            optimized_bp = BlueprintResult.model_validate(data)
            logger.info("Validation Agent successfully optimized the blueprint tools!")
            return optimized_bp
        except Exception as exc:
            logger.error("Validation Agent failed, using original blueprint: %s", exc)
            return blueprint

    async def generate_message(self, lead_data: dict[str, Any], context: str) -> str:
        name = lead_data.get("name", "there")
        company = lead_data.get("company", "your team")
        requirement = lead_data.get("requirement", "workflow automation")
        return (
            f"Hi {name}, this is Innoalaxy. We reviewed {company}'s requirement around "
            f"{requirement}. There looks to be a clear automation opportunity that can save "
            "weekly manual effort. Would you be open to a 15-minute call tomorrow?"
        )

    # ── fallbacks ────────────────────────────────────────────────────────────
    def _fallback_audit(self, data: dict[str, Any]) -> AuditResult:
        logger.info("Using rule-based fallback audit")
        text = data["process_description"].lower()
        industry = data.get("industry", "").lower()

        sales = any(w in text for w in ["lead", "sales", "whatsapp", "indiamart", "justdial", "follow-up", "follow up"])
        reporting = any(w in text for w in ["report", "excel", "sheet", "gst", "tally", "invoice"])
        hr = any(w in text for w in ["cv", "resume", "onboard", "attendance", "payroll", "hr"])

        pain_points = []
        if sales:
            pain_points.append({"title": "Manual lead capture and follow-up", "description": "The team is spending time copying leads and writing repetitive first-response messages.", "time_wasted_hours": 8.0, "automation_type": "communication", "priority": "high", "complexity": "medium"})
        if reporting:
            pain_points.append({"title": "Spreadsheet reporting loop", "description": "Reports can be generated from source data automatically instead of being rebuilt manually.", "time_wasted_hours": 5.0, "automation_type": "reporting", "priority": "medium", "complexity": "simple"})
        if hr:
            pain_points.append({"title": "Manual HR data processing", "description": "CV screening, onboarding documents, and attendance tracking can all be automated.", "time_wasted_hours": 4.0, "automation_type": "data_entry", "priority": "medium", "complexity": "medium"})
        if not pain_points:
            pain_points.append({"title": "Repeated manual coordination", "description": "The process has recurring handoffs that can likely be standardized and automated after a short discovery call.", "time_wasted_hours": 4.0, "automation_type": "monitoring", "priority": "medium", "complexity": "simple"})

        hours = sum(p["time_wasted_hours"] for p in pain_points)
        return AuditResult(
            automation_score=82 if sales else 68,
            hours_wasted_weekly=hours,
            automatable_percentage=72 if sales else 55,
            pain_points=pain_points,
            summary="This workflow has clear repeatable steps suitable for AI-assisted automation. The best first build is a focused agent that captures inputs, drafts actions, and keeps the team updated.",
            industry_context=f"For {data.get('industry', 'your sector')}, the fastest ROI usually comes from automating WhatsApp, Excel, lead, and reporting loops before replacing core systems."
        )

    def _fallback_blueprint(self, audit_result: AuditResult) -> BlueprintResult:
        hours_saved = round(max(4.0, audit_result.hours_wasted_weekly * 0.72), 1)
        return BlueprintResult(
            steps=[
                {"title": "Capture work inputs", "description": "Collect leads, files, forms, or messages from the current channels.", "tool": "API + file parser"},
                {"title": "Classify and prioritize", "description": "Use Gemini to identify intent, urgency, missing data, and next best action.", "tool": "Gemini"},
                {"title": "Execute follow-up", "description": "Run an ADK agent that drafts messages, updates records, and creates reports.", "tool": "Google ADK"},
                {"title": "Notify the team", "description": "Send WhatsApp updates and keep an audit trail for review.", "tool": "WhatsApp"},
            ],
            integrations=["Gemini", "Google ADK", "Neon Postgres", "WhatsApp", "Email"],
            build_time_weeks=3 if audit_result.automation_score > 75 else 2,
            hours_saved_weekly=hours_saved,
            price_range="₹45,000 - ₹1,20,000",
        )
