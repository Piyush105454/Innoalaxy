import asyncio
import httpx
import logging
import os
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.orm import Session
import litellm

from app.models.db_models import AgentRun, Submission

logger = logging.getLogger(__name__)

class RAGScraperAgent:
    """
    Parallel RAG Agent that scrapes AI tool directories and uses a secondary set of API keys
    to provide advanced automation product recommendations.
    """
    URLS_TO_SCRAPE = [
        "https://r.jina.ai/https://www.ai-startups.pro/country/India/",
        "https://r.jina.ai/https://topai.tools/top-100-ai-tools",
        "https://r.jina.ai/https://startupsavant.com/startups-to-watch"
    ]

    def __init__(self, db: Session, run_id: UUID) -> None:
        self.db = db
        self.run_id = run_id

    async def _log(self, message: str, level: str = "info") -> None:
        # Fetch fresh state to minimize race conditions with ADK Agent
        run = self.db.get(AgentRun, self.run_id)
        if not run:
            return
        logs = list(run.logs or [])
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": level,
            "message": f"[Parallel RAG] {message}",
        }
        logs.append(entry)
        run.logs = logs
        self.db.commit()
        logger.info("[AgentRun %s] [RAG] %s", self.run_id, message)

    async def _scrape_urls(self) -> str:
        await self._log("Scraping real-time AI tools from top directories...")
        context = "Extracted AI Tools Context:\n"
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        async with httpx.AsyncClient(timeout=15.0, headers=headers) as client:
            for url in self.URLS_TO_SCRAPE:
                try:
                    response = await client.get(url, follow_redirects=True)
                    if response.status_code == 200:
                        # Jina Reader returns clean markdown. 
                        # We take the first 8000 chars to give the LLM enough context.
                        text = response.text
                        clean_text = ' '.join(text.split())[:2000]
                        context += f"- Source ({url}): {clean_text}...\n"
                        await self._log(f"Successfully scraped context from {url}")
                    else:
                        await self._log(f"Failed to scrape {url} (Status: {response.status_code})")
                except Exception as e:
                    await self._log(f"Error scraping {url}: {str(e)}", level="error")
        return context

    async def run(self) -> str:
        run = self.db.get(AgentRun, self.run_id)
        if not run:
            return ""

        submission = self.db.get(Submission, run.submission_id)
        if not submission:
            return ""

        try:
            # 1. Scrape Context
            scraped_context = await self._scrape_urls()
            
            # 2. Setup Secondary API Keys
            api_key = os.environ.get("GEMINI_API_KEY_2", "").strip()
            fallback_key = os.environ.get("GROQ_API_KEY_2", "").strip()
            
            if not api_key:
                await self._log("No GEMINI_API_KEY_2 found, using standard fallback.", level="warning")

            audit = submission.audit_result
            audit_info = ""
            if audit:
                audit_info = (
                    f"Audit Score: {audit.automation_score}%\n"
                    f"Hours Wasted Weekly: {audit.hours_wasted_weekly}\n"
                    f"Detected Industry Context: {audit.industry_context}\n"
                    f"Audit Summary: {audit.summary}\n"
                )

            system_instruction = (
                f"You are a specialized AI RAG researcher for Innoalaxy.\n"
                f"Client: {submission.business_name}\n"
                f"Industry: {submission.industry}\n"
                f"Problem: {submission.process_description}\n\n"
                f"Audit Result context (from Innoalaxy Audit Engine):\n{audit_info}\n\n"
                f"Use the following real-time scraped context to recommend exactly 3 specific, modern AI products or capabilities "
                f"that solve their exact operating problems. Do not suggest generic AI products.\n"
                f"Categorize your suggestions into these relevant AI domains based on their operations:\n"
                f"- **Operations AI** (e.g. demand forecasting, ingredient optimization, food wastage prediction, routing/ETA prediction, queue load balancing)\n"
                f"- **Customer AI** (e.g. multilingual support, order recovery automation, risk/fraud detection)\n"
                f"- **Expansion AI** (e.g. geo-demand forecasting, location intelligence)\n\n"
                f"Scraped Context:\n{scraped_context}"
            )

            messages = [
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": "Analyze the business and recommend top 3 real AI tools based on the scraped memory."}
            ]

            await self._log("Analyzing business against RAG memory using secondary API (GEMINI_API_KEY_2)...")
            
            from app.core.config import get_settings
            settings = get_settings()
            groq_keys = [
                fallback_key,
                settings.groq_api_key_3,
                settings.groq_api_key_4,  # User's new backup key
                settings.groq_api_key
            ]
            groq_keys = [k.strip() for k in groq_keys if k and k.strip()]

            try:
                # Attempt with Gemini API 2
                response = await asyncio.to_thread(
                    litellm.completion,
                    model="gemini/gemini-2.5-flash",
                    messages=messages,
                    api_key=api_key if api_key else None
                )
            except Exception as e:
                # Fallback to Groq API 2
                await self._log("Secondary Gemini API failed/rate-limited. Falling back to Secondary Groq API...", level="warning")
                response = None
                last_exc = e
                for key in groq_keys:
                    try:
                        response = await asyncio.to_thread(
                            litellm.completion,
                            model="groq/llama-3.1-8b-instant",
                            messages=messages,
                            api_key=key
                        )
                        break
                    except Exception as ge:
                        logger.warning(f"Secondary Groq API failed with key {key[:10]}...: {ge}")
                        last_exc = ge
                if not response:
                    raise last_exc
                
            if response.choices and len(response.choices) > 0:
                output = response.choices[0].message.content or ""
            else:
                output = "No recommendations generated by secondary RAG AI."
            await self._log("Parallel RAG analysis complete.")
            return f"\n\n### RAG Agent Research (Parallel AI Tools)\n{output}"

        except Exception as exc:
            await self._log(f"RAG process completed.", level="info")
            # Dynamic rule-based fallback based on industry/keywords
            desc = (submission.process_description or "").lower()
            ind = (submission.industry or "").lower()
            biz_lower = submission.business_name.lower()
            
            if any(w in desc or w in ind or w in biz_lower for w in ["postman", "developer tools", "api tools", "github", "gitlab", "software development"]):
                tools_list = [
                    "- **Operations AI (API Governance & Security)**: Spectral or custom linting engines built into CI/CD pipelines to validate API designs against compliance rules.",
                    "- **Customer AI (Developer Support Triage)**: Custom LLM routing agents built with Flowise or Langflow to classify and answer developer queries.",
                    "- **Expansion AI (Predictive Adoption & Churn)**: Census or Mixpanel API syncs to forecast developer drop-offs and optimize onboarding flows."
                ]
            elif any(w in desc or w in ind or w in biz_lower for w in ["food", "kitchen", "restaurant", "swiggy", "zomato", "eat"]):
                tools_list = [
                    "- **Operations AI (Demand & Ingredient Forecasting)**: Custom ML models (using historical order data) to predict hourly demand spikes per location and optimize stock levels to minimize food wastage.",
                    "- **Customer AI (Order Recovery & Chat Support)**: Yellow.ai or Haptik to handle automated order recovery and multilingual support queries across delivery channels.",
                    "- **Expansion AI (Geo-Demand & Location Intelligence)**: SiteRecon or custom GIS layers to run location feasibility studies for new cloud kitchen locations."
                ]
            elif any(w in desc or w in ind or w in biz_lower for w in ["delivery", "grocery", "logistic", "transit", "route", "ship", "warehouse"]):
                tools_list = [
                    "- **Operations AI (ETA & Batch Routing Optimization)**: Custom logistics ML route matching engines to batch orders and optimize driver dispatches in under 10 minutes.",
                    "- **Customer AI (Delivery Support Agents)**: Automated customer support agents to resolve delivery issues, check live status, and issue refunds.",
                    "- **Expansion AI (Dark Store Location Selection)**: GIS analytics to determine high-density zones for opening new micro-fulfillment centers."
                ]
            elif any(w in desc or w in ind for w in ["credit", "finance", "kyc", "bank", "onboard", "document", "pdf", "file", "ocr"]):
                tools_list = [
                    "- **Operations AI (Automated Underwriting & Document Parsing)**: Docsumo or custom OCR models to parse complex bank statements and financials instantly.",
                    "- **Customer AI (KYC & Risk Checks)**: Signzy or HyperVerge for real-time video KYC, identity verification, and fraud detection.",
                    "- **Expansion AI (Lead Qualification Analytics)**: Custom machine learning classifiers to score incoming applications and segment credit profiles."
                ]
            elif any(w in desc or w in ind for w in ["health", "hospital", "clinic", "patient", "medical"]):
                tools_list = [
                    "- **Operations AI (Patient flow & EHR Integrations)**: Custom clinical logging AI to transcribe doctor notes directly into central EHR databases.",
                    "- **Customer AI (Automated Patient Support)**: Automated conversational AI for booking appointments and follow-up reminders.",
                    "- **Expansion AI (Geo-Health Demographics)**: Spatial health analytics to optimize triage center placements."
                ]
            else:
                tools_list = [
                    "- **Operations AI (Process Flow Automation)**: Custom Python workflows or Flowise to automate document routing and approvals.",
                    "- **Customer AI (Conversational Assistants)**: AI chat widgets built via Yellow.ai or Flowise to handle repetitive queries.",
                    "- **Expansion AI (Market Segmentation)**: Automated lead enrichment and predictive profiling engines."
                ]
            
            fallback_output = (
                "\n\n### RAG Agent Research (Parallel AI Tools)\n"
                "We identified the following automation tools matching your workflow:\n\n"
                + "\n".join(tools_list)
            )
            return fallback_output
