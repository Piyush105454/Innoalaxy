"""
GeminiService — wraps google-generativeai and groq for audit and blueprint generation.
Fully optimized with asyncio, Company Intelligence Layer, and a Validation Agent.
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
            return json.loads(raw, strict=False)
        except json.JSONDecodeError as exc:
            logger.error("Model returned invalid JSON: %s\nRaw: %.300s", exc, raw)
            raise

    async def run_company_intelligence_layer(self, business_name: str, industry: str, process_description: str, team_size: str) -> dict[str, Any]:
        """Runs the first-step Company Intelligence LLM call to classify, research, and format details."""
        logger.info("Running Company Intelligence Layer for %s", business_name)
        prompt = f"""
You are the Lead Company Intelligence Analyst for Innoalaxy.
Analyze the following business to detect its scale, industry context, operational maturity, and strategic automation requirements.

Company Name: {business_name}
Declared Industry: {industry}
Team Size Category: {team_size}
Process Description: {process_description}

INSTRUCTIONS:
1. Identify the true Scale/Stage of the company (Enterprise, Mid-Market, Startup/SME).
   - Enterprise: Well-known large companies, unicorns, or companies with huge operational scale (e.g. Rebel Foods, Uber, BYJU'S, Apollo Hospitals, Razorpay, Zepto, or any process indicating 200+ team size, or if team size is 50+ / 51-200 and description shows complex systems).
   - Mid-Market: Growth-stage companies (51-200 team size).
   - Startup/SME: Small businesses or early-stage startups (1-50 team size).
2. Industry & Sector Detection: Determine the specific operational domain (e.g. "FoodTech / Cloud Kitchen / Multi-brand Restaurant Operations", "FinTech / Digital Lending / Payment Operations", "Healthcare / Hospital Operations / Clinical Workflow Automation", "Logistics / Quick Commerce / Supply Chain Operations", "EdTech / Digital Learning Operations / Educational Support").
3. Operational & Tech Maturity Detection: Classify as Low, Medium, or High.
   - Large enterprise brands (like Rebel Foods, Zepto, Razorpay, BYJU'S, Uber, Apollo Hospitals) have HIGH tech maturity (they don't use simple spreadsheets and manual emails for core operations; they use ERPs, custom ML, advanced logistics APIs, etc.).
4. Pain Point Strategy:
   - Identify 2-4 highly specific operational pain points matching their scale and industry. For example, for an enterprise cloud kitchen (like Rebel Foods): multi-brand inventory sync, demand forecasting by city/time, delivery delay prediction, food wastage reduction, partner platform (Swiggy/Zomato) API reconciliation. DO NOT use generic pain points like "manual emails and spreadsheets" for enterprises.
5. Tool Recommendation Category:
   - Enterprise: Custom AI agents, ERP integrations, internal ML systems, custom Python orchestration. Avoid recommending basic startup tools like TradeGecko, Zoho, Make.com, or Zapier unless justified. Instead suggest SAP Supply Chain, Oracle Netsuite, Odoo Enterprise, delivery orchestration APIs, Swiggy/Zomato integration monitoring, Kitchen-to-rider SLA tracking, or custom AI models.
   - Mid-Market: HubSpot, Salesforce, Airbyte, custom API connectors, Flowise, Odoo.
   - Startup/SME: Make.com, Zapier, Zoho, Google Sheets, Tally.
6. Transparent Automation Score Breakdown:
   Calculate the sub-scores and Final Score:
   - Process Automation Potential (out of 40)
   - Operational Inefficiency (out of 30)
   - AI Readiness (out of 20)
   - Integration Feasibility (out of 10)
   - Final Score = sum of the above (0-100)
   Vary this score realistically based on the process complexity and scale.

Return ONLY a valid JSON object matching this schema:
{{
  "company_scale": "Enterprise" | "Mid-Market" | "Startup",
  "detected_industry": "string",
  "tech_maturity": "Low" | "Medium" | "High",
  "strategic_pain_points": [
    {{
      "title": "string",
      "focus_area": "string",
      "description": "string"
    }}
  ],
  "tool_class": "Enterprise" | "Mid-Market" | "Startup",
  "recommended_tools": ["string"],
  "score_breakdown": {{
    "potential": int,
    "inefficiency": int,
    "readiness": int,
    "feasibility": int,
    "final_score": int
  }}
}}
"""
        try:
            raw_data = await self._generate_json_async(prompt)
            keys = ["company_scale", "detected_industry", "tech_maturity", "strategic_pain_points", "recommended_tools", "score_breakdown"]
            if all(k in raw_data for k in keys):
                logger.info("Company Intelligence Layer successfully parsed data: scale=%s, industry=%s", raw_data["company_scale"], raw_data["detected_industry"])
                return raw_data
        except Exception as e:
            logger.error("LLM Company Intelligence failed, falling back to rule-based: %s", e)
        
        return self.get_fallback_intelligence(business_name, industry, process_description, team_size)

    def get_fallback_intelligence(self, business_name: str, industry: str, process_description: str, team_size: str) -> dict[str, Any]:
        """Rule-based company intelligence fallback engine. Ensures highly realistic predictions even if LLM fails."""
        biz = business_name.lower()
        desc = process_description.lower()
        ind = industry.lower()
        
        # 1. Detect Scale & Maturity
        is_enterprise = any(k in biz or k in desc or k in ind for k in ["rebel food", "zepto", "uber", "razorpay", "byju", "apollo hospital", "unicorn", "enterprise"]) or "200" in team_size or "500" in team_size or "50+" in team_size or "51-200" in team_size
        
        if "51-200" in team_size:
            scale = "Mid-Market"
            maturity = "Medium"
            tool_class = "Mid-Market"
        elif "200" in team_size or "500" in team_size or "50+" in team_size or is_enterprise:
            scale = "Enterprise"
            maturity = "High"
            tool_class = "Enterprise"
        else:
            scale = "Startup"
            maturity = "Low"
            tool_class = "Startup"

        if "rebel" in biz:
            scale = "Enterprise"
            maturity = "High"
            tool_class = "Enterprise"

        # 2. Domain & Industry Classification & Pain Points & Tools
        detected_industry = "Business Operations"
        strategic_pain_points = [
            {"title": "Manual Lead Entry & Follow-ups", "focus_area": "Sales Ops", "description": "Manually copy-pasting customer details and sending direct chat updates."},
            {"title": "Spreadsheet Reporting Delays", "focus_area": "Management", "description": "Compiling reports from multiple workbooks and sheets manually weekly."}
        ]
        recommended_tools = ["Make.com", "Zapier", "Zoho Books", "Google Sheets"]
        score_breakdown = {"potential": 30, "inefficiency": 20, "readiness": 15, "feasibility": 9, "final_score": 74}

        if any(w in biz or w in desc or w in ind for w in ["food", "kitchen", "restaurant", "swiggy", "zomato", "eat"]):
            detected_industry = "FoodTech / Cloud Kitchen / Multi-brand Restaurant Operations"
            if scale == "Enterprise":
                strategic_pain_points = [
                    {"title": "Multi-Brand Inventory Synchronization", "focus_area": "Inventory Ops", "description": "Managing stock updates and raw material allocations across dozens of virtual brands and hundreds of kitchen hubs in real-time."},
                    {"title": "Demand Forecasting & Wastage Prediction", "focus_area": "Production", "description": "Predicting hourly demand spikes and stock requirements using order history to minimize ingredient wastage."},
                    {"title": "Kitchen-to-Rider SLA Monitoring", "focus_area": "Logistics", "description": "Tracking food preparation benchmarks and handoffs to hyperlocal riders to minimize delay penalties."}
                ]
                recommended_tools = ["Custom AI forecasting engine", "SAP Supply Chain Management", "Oracle Netsuite ERP", "delivery orchestration APIs", "Swiggy/Zomato API feed integrations"]
                score_breakdown = {"potential": 34, "inefficiency": 22, "readiness": 18, "feasibility": 8, "final_score": 82}
            else:
                strategic_pain_points = [
                    {"title": "Manual Order Processing from Platforms", "focus_area": "Order Ops", "description": "Re-entering delivery platform orders manually into standard POS terminals."},
                    {"title": "Spreadsheet Inventory Reconciliation", "focus_area": "Kitchen Ops", "description": "Tracking stock usage and ingredients using manual daily sheets."}
                ]
                recommended_tools = ["Make.com", "Zoho Inventory", "Petpooja POS API", "Google Sheets"]
                score_breakdown = {"potential": 32, "inefficiency": 20, "readiness": 12, "feasibility": 9, "final_score": 73}

        elif any(w in biz or w in desc or w in ind for w in ["credit", "finance", "kyc", "bank", "pay", "lend"]):
            detected_industry = "FinTech / Digital Lending / Payment Operations"
            if scale == "Enterprise":
                strategic_pain_points = [
                    {"title": "Custom KYC OCR Document Processing", "focus_area": "Compliance", "description": "Processing high volumes of user documentation with automated fraud detection and verification checks."},
                    {"title": "Real-Time Transaction Risk Monitoring", "focus_area": "Risk Management", "description": "Identifying payment anomalies and failed transaction routing configurations dynamically."}
                ]
                recommended_tools = ["Custom KYC AI Agents", "Signzy API integrations", "Internal ML risk analysis systems"]
                score_breakdown = {"potential": 36, "inefficiency": 25, "readiness": 17, "feasibility": 7, "final_score": 85}
            else:
                strategic_pain_points = [
                    {"title": "Manual Applicant Document Collection", "focus_area": "Underwriting", "description": "Collecting applicant statements via email and manually checking criteria."},
                    {"title": "Manual Lead Status Updates", "focus_area": "Sales", "description": "Manually moving prospective borrowers across pipeline stages."}
                ]
                recommended_tools = ["Make.com", "Zapier", "Docsumo", "HubSpot CRM"]
                score_breakdown = {"potential": 30, "inefficiency": 21, "readiness": 14, "feasibility": 10, "final_score": 75}

        elif any(w in biz or w in desc or w in ind for w in ["health", "hospital", "clinic", "patient", "medical"]):
            detected_industry = "Healthcare / Hospital Operations / Clinical Workflow Automation"
            if scale == "Enterprise":
                strategic_pain_points = [
                    {"title": "Patient Flow & Consultation Allocation", "focus_area": "Clinic Ops", "description": "Real-time triage and department queue allocation of outpatient volumes to maximize room utility."},
                    {"title": "Automated EHR Parsing & Logging", "focus_area": "Data Entry", "description": "Translating physician verbal records or PDFs directly into Electronic Health Records systems."}
                ]
                recommended_tools = ["Custom EHR Agent Runtimes", "Enterprise HIS integration", "Advanced custom ML triage systems"]
                score_breakdown = {"potential": 33, "inefficiency": 24, "readiness": 16, "feasibility": 8, "final_score": 81}
            else:
                strategic_pain_points = [
                    {"title": "Manual Patient Scheduling", "focus_area": "Reception", "description": "Booking and coordinating follow-ups via direct phone calls and diaries."},
                    {"title": "Paper Prescription Transcription", "focus_area": "Pharmacy", "description": "Manually reading and entering prescription notes into billing systems."}
                ]
                recommended_tools = ["Make.com", "Google Calendar API", "WhatsApp Business API", "Zoho CRM"]
                score_breakdown = {"potential": 28, "inefficiency": 20, "readiness": 11, "feasibility": 10, "final_score": 69}

        elif any(w in biz or w in desc or w in ind for w in ["delivery", "grocery", "logistic", "transit", "route"]):
            detected_industry = "Logistics / Quick Commerce / Supply Chain Operations"
            if scale == "Enterprise":
                strategic_pain_points = [
                    {"title": "Real-Time Dispatch & Rider Allocation", "focus_area": "Dispatch", "description": "Sequencing order batches and routing riders dynamically under tight 10-minute thresholds."},
                    {"title": "Phantom Stock Dark Store Sync", "focus_area": "Inventory", "description": "Reconciling live warehouse stock listings to prevent virtual purchases of out-of-stock items."}
                ]
                recommended_tools = ["Custom Logistics ML Engine", "Enterprise WMS Integration", "Delivery SLA Orchestrator APIs"]
                score_breakdown = {"potential": 35, "inefficiency": 26, "readiness": 18, "feasibility": 7, "final_score": 86}
            else:
                strategic_pain_points = [
                    {"title": "Manual Courier Platform Updates", "focus_area": "Logistics", "description": "Entering shipping details across multiple logistics provider portals manually."},
                    {"title": "Excel Delivery Delay Tracking", "focus_area": "Operations", "description": "Manually copy-pasting delivery logs to find late dispatch patterns."}
                ]
                recommended_tools = ["Make.com", "Zapier", "Shiprocket API", "Google Sheets"]
                score_breakdown = {"potential": 31, "inefficiency": 22, "readiness": 13, "feasibility": 9, "final_score": 75}

        return {
            "company_scale": scale,
            "detected_industry": detected_industry,
            "tech_maturity": maturity,
            "strategic_pain_points": strategic_pain_points,
            "tool_class": tool_class,
            "recommended_tools": recommended_tools,
            "score_breakdown": score_breakdown
        }

    async def analyze_process(self, submission_data: dict[str, Any]) -> AuditResult:
        """
        Run an AI audit using asyncio.
        Now includes a Company Intelligence Layer pre-step and a Validation Agent post-step.
        """
        biz_name = submission_data.get("business_name", "your company")
        industry = submission_data.get("industry", "")
        desc = submission_data.get("process_description", "")
        team_size = submission_data.get("team_size", "")
        context = submission_data.get("additional_context", "")

        # 1. Run Company Intelligence Layer
        intel_context = await self.run_company_intelligence_layer(biz_name, industry, desc, team_size)
        
        # 2. Build the detailed audit prompt with the intelligence context
        prompt = build_audit_prompt(
            business_name=biz_name,
            process_description=desc,
            industry=industry,
            team_size=team_size,
            intelligence_context=intel_context,
            additional_context=context,
        )

        try:
            # 3. Base Audit
            data = await self._generate_json_async(prompt)
            result = AuditResult.model_validate(data)
            logger.info("Audit complete — score=%d", result.automation_score)
            
            # 4. Base Blueprint
            result.blueprint = await self.generate_blueprint(result)
            
            # 5. Validation Agent (New Feature)
            result.blueprint = await self.validate_and_optimize_blueprint(submission_data, result.blueprint)
            
            return result
        except Exception as exc:
            logger.exception("Audit completely failed, using fallback: %s", exc)
            result = self._fallback_audit(submission_data, intel_context)
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
3. Validate that the flow makes logical sense for their process and provides the best outcome. Ensure no outdated tools like TradeGecko or unrealistic ones like DHL API for cloud kitchens are present.
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
    def _fallback_audit(self, data: dict[str, Any], intel_context: dict = None) -> AuditResult:
        logger.info("Using rule-based fallback audit")
        if not intel_context:
            intel_context = self.get_fallback_intelligence(
                data.get("business_name", "your company"),
                data.get("industry", ""),
                data.get("process_description", ""),
                data.get("team_size", "")
            )
        
        pain_points = []
        total_score = intel_context["score_breakdown"]["final_score"]
        
        team_size = str(data.get("team_size", "")).lower()
        if "1-10" in team_size:
            total_hours = 12.5
        elif "11-50" in team_size:
            total_hours = 18.5
        elif "51-200" in team_size:
            total_hours = 24.5
        else:
            total_hours = 35.5
            
        num_pains = len(intel_context["strategic_pain_points"])
        hours_per_pain = round(total_hours / max(1, num_pains), 1)
        
        for i, spp in enumerate(intel_context["strategic_pain_points"]):
            pain_points.append({
                "title": spp["title"],
                "description": spp["description"],
                "time_wasted_hours": hours_per_pain if i < num_pains - 1 else round(total_hours - (hours_per_pain * (num_pains - 1)), 1),
                "automation_type": "monitoring" if "monitor" in spp["title"].lower() or "sla" in spp["title"].lower() else "data_entry" if "sync" in spp["title"].lower() else "reporting",
                "priority": "high" if i == 0 else "medium",
                "complexity": "complex" if intel_context["company_scale"] == "Enterprise" else "medium"
            })
            
        total_hours = sum(p["time_wasted_hours"] for p in pain_points)

        summary_text = (
            f"### Automation Score Breakdown\n"
            f"- Process Automation Potential: {intel_context['score_breakdown']['potential']}/40\n"
            f"- Operational Inefficiency: {intel_context['score_breakdown']['inefficiency']}/30\n"
            f"- AI Readiness: {intel_context['score_breakdown']['readiness']}/20\n"
            f"- Tool Integration Feasibility: {intel_context['score_breakdown']['feasibility']}/10\n"
            f"**Final Score = {total_score}%**\n\n"
            f"### Estimated Weekly Time Savings\n"
        )
        for p in pain_points:
            summary_text += f"- {p['title']} → {p['time_wasted_hours']} hrs\n"
        summary_text += f"**Total ≈ {total_hours} hrs/week**\n\n"
        
        summary_text += f"We will deploy a tailored **{intel_context['company_scale']}-grade Custom Software + AI Agent** pipeline to resolve key operational bottlenecks for {data.get('business_name', 'your company')}."

        return AuditResult(
            automation_score=total_score,
            hours_wasted_weekly=total_hours,
            automatable_percentage=min(90, max(42, total_score - 10)),
            pain_points=pain_points,
            summary=summary_text,
            industry_context=f"In the {intel_context['detected_industry']} sector, automated workflows are essential to maintain efficiency and competitive advantage."
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
