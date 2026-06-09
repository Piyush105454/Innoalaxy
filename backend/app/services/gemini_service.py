"""
GeminiService — wraps google-generativeai for audit and blueprint generation.

Key behaviours:
* Retries up to 3 times with exponential back-off.
* On 429 (quota exhausted) waits up to 60 s before giving up and using fallback.
* Strips markdown fences from model output before JSON-parsing.
* Falls back to a deterministic rule-based audit if the model is unavailable
  or every retry fails — so the product never shows a blank result.
"""

import json
import logging
import re
import time
from typing import Any

try:
    import google.generativeai as genai
    from google.api_core.exceptions import ResourceExhausted, ServiceUnavailable
except ImportError:
    genai = None
    ResourceExhausted = Exception
    ServiceUnavailable = Exception

from app.core.config import get_settings
from app.models.schemas import AuditResult, BlueprintResult
from app.prompts.audit_prompt import build_audit_prompt
from app.prompts.blueprint_prompt import build_blueprint_prompt

logger = logging.getLogger(__name__)

_RETRYABLE = (ResourceExhausted, ServiceUnavailable, ConnectionError, TimeoutError)


class GeminiService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.enabled = bool(self.settings.gemini_api_key and genai)
        if self.enabled:
            genai.configure(api_key=self.settings.gemini_api_key)
            self.model = genai.GenerativeModel(self.settings.gemini_model)
            logger.info("GeminiService ready — model=%s", self.settings.gemini_model)
        else:
            self.model = None
            logger.warning("GeminiService: no API key — running in demo/fallback mode")

    # ── internal helpers ────────────────────────────────────────────────────

    def _call_with_retry(self, prompt: str, max_attempts: int = 3) -> str:
        """
        Call the Gemini model with exponential back-off.
        On 429 (free-tier quota) we wait up to 30 s between retries instead
        of the default short delay.
        """
        last_exc: Exception | None = None
        delays = [2, 5, 10]  # seconds between each attempt

        for attempt in range(max_attempts):
            try:
                logger.info("Gemini call attempt %d/%d", attempt + 1, max_attempts)
                response = self.model.generate_content(prompt)
                return response.text
            except Exception as exc:
                last_exc = exc
                err_str = str(exc)
                is_quota = "ResourceExhausted" in type(exc).__name__ or "429" in err_str or "quota" in err_str.lower()
                wait = delays[attempt] if is_quota else (2 ** attempt)
                if attempt < max_attempts - 1:
                    logger.warning(
                        "Gemini attempt %d failed (%s). Retrying in %ds...",
                        attempt + 1,
                        "rate-limit" if is_quota else type(exc).__name__,
                        wait,
                    )
                    time.sleep(wait)
                else:
                    logger.error("All %d Gemini attempts failed: %s", max_attempts, exc)

        raise last_exc  # type: ignore[misc]

    def _generate_json(self, prompt: str) -> dict[str, Any]:
        """Call Gemini and parse its text output as JSON."""
        if not self.model:
            raise RuntimeError("Gemini model not configured")

        raw = self._call_with_retry(prompt)

        # Strip markdown fences (```json ... ``` or ``` ... ```)
        raw = raw.strip()
        raw = re.sub(r"^```[a-zA-Z]*\n?", "", raw)
        raw = re.sub(r"\n?```$", "", raw)
        raw = raw.strip()

        try:
            return json.loads(raw)
        except json.JSONDecodeError as exc:
            logger.error("Gemini returned invalid JSON: %s\nRaw: %.300s", exc, raw)
            raise

    # ── public API ───────────────────────────────────────────────────────────

    async def analyze_process(self, submission_data: dict[str, Any]) -> AuditResult:
        """
        Run an AI audit. Tries Gemini first; falls back to rule-based analysis
        if Gemini is unavailable or rate-limited.
        """
        prompt = build_audit_prompt(
            process_description=submission_data["process_description"],
            industry=submission_data["industry"],
            team_size=submission_data["team_size"],
            additional_context=submission_data.get("additional_context", ""),
        )

        if self.enabled:
            try:
                data = self._generate_json(prompt)
                result = AuditResult.model_validate(data)
                logger.info(
                    "Gemini audit complete — score=%d, pain_points=%d",
                    result.automation_score,
                    len(result.pain_points),
                )
                result.blueprint = await self.generate_blueprint(result)
                return result
            except Exception as exc:
                logger.exception("Gemini audit failed, using rule-based fallback: %s", exc)

        result = self._fallback_audit(submission_data)
        result.blueprint = await self.generate_blueprint(result)
        return result

    async def generate_blueprint(self, audit_result: AuditResult) -> BlueprintResult:
        """Generate a build blueprint from an audit result. Falls back if needed."""
        if self.enabled:
            try:
                payload = audit_result.model_dump_json(exclude={"blueprint", "submission_id"})
                data = self._generate_json(build_blueprint_prompt(payload))
                bp = BlueprintResult.model_validate(data)
                logger.info(
                    "Gemini blueprint complete — steps=%d, price=%s",
                    len(bp.steps),
                    bp.price_range,
                )
                return bp
            except Exception as exc:
                logger.exception("Gemini blueprint failed, using fallback: %s", exc)

        return self._fallback_blueprint(audit_result)

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
        """Rule-based audit used when Gemini is unavailable."""
        logger.info("Using rule-based fallback audit")
        text = data["process_description"].lower()
        industry = data.get("industry", "").lower()

        sales = any(w in text for w in ["lead", "sales", "whatsapp", "indiamart", "justdial", "follow-up", "follow up"])
        reporting = any(w in text for w in ["report", "excel", "sheet", "gst", "tally", "invoice"])
        hr = any(w in text for w in ["cv", "resume", "onboard", "attendance", "payroll", "hr"])

        pain_points = []
        if sales:
            pain_points.append({
                "title": "Manual lead capture and follow-up",
                "description": "The team is spending time copying leads and writing repetitive first-response messages.",
                "time_wasted_hours": 8.0,
                "automation_type": "communication",
                "priority": "high",
                "complexity": "medium",
            })
        if reporting:
            pain_points.append({
                "title": "Spreadsheet reporting loop",
                "description": "Reports can be generated from source data automatically instead of being rebuilt manually.",
                "time_wasted_hours": 5.0,
                "automation_type": "reporting",
                "priority": "medium",
                "complexity": "simple",
            })
        if hr:
            pain_points.append({
                "title": "Manual HR data processing",
                "description": "CV screening, onboarding documents, and attendance tracking can all be automated.",
                "time_wasted_hours": 4.0,
                "automation_type": "data_entry",
                "priority": "medium",
                "complexity": "medium",
            })
        if not pain_points:
            pain_points.append({
                "title": "Repeated manual coordination",
                "description": "The process has recurring handoffs that can likely be standardized and automated after a short discovery call.",
                "time_wasted_hours": 4.0,
                "automation_type": "monitoring",
                "priority": "medium",
                "complexity": "simple",
            })

        hours = sum(p["time_wasted_hours"] for p in pain_points)
        return AuditResult(
            automation_score=82 if sales else 68,
            hours_wasted_weekly=hours,
            automatable_percentage=72 if sales else 55,
            pain_points=pain_points,
            summary=(
                "This workflow has clear repeatable steps suitable for AI-assisted automation. "
                "The best first build is a focused agent that captures inputs, drafts actions, "
                "and keeps the team updated."
            ),
            industry_context=(
                f"For {data.get('industry', 'your sector')}, the fastest ROI usually comes from "
                "automating WhatsApp, Excel, lead, and reporting loops before replacing core systems."
            ),
        )

    def _fallback_blueprint(self, audit_result: AuditResult) -> BlueprintResult:
        """Deterministic blueprint used when Gemini is unavailable."""
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
