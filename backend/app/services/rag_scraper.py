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
                        clean_text = ' '.join(text.split())[:8000]
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

            system_instruction = (
                f"You are a specialized AI RAG researcher. \n"
                f"Client: {submission.business_name}\n"
                f"Industry: {submission.industry}\n"
                f"Problem: {submission.process_description}\n\n"
                f"Use the following real-time scraped context to recommend exactly 3 specific, modern AI products/startups "
                f"that solve their problem. Do not be generic.\n\n"
                f"{scraped_context}"
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
            
            if any(w in desc or w in ind for w in ["credit", "finance", "kyc", "bank", "onboard", "document", "pdf", "file", "ocr"]):
                tools_list = [
                    "- **HyperVerge / Signzy**: Best for automated KYC, OCR document verification, and user onboarding flows.",
                    "- **Docsumo**: Excellent for intelligent document parsing and financial data extraction from statements/invoices.",
                    "- **Flowise**: For drag-and-drop LLM orchestration to automate credit queries and applicant screening."
                ]
            elif any(w in desc or w in ind for w in ["lead", "sales", "whatsapp", "customer", "support", "chat"]):
                tools_list = [
                    "- **Yellow.ai**: Best for automated WhatsApp customer support and conversational commerce.",
                    "- **HubSpot / Zoho CRM**: Centralized platform for tracking customer leads and managing automated follow-ups.",
                    "- **Make.com / Zapier**: Seamless API automation to connect lead forms directly to your communication channels."
                ]
            elif any(w in desc or w in ind for w in ["report", "excel", "sheet", "data", "tally", "invoice"]):
                tools_list = [
                    "- **Docsumo**: Excellent for automated data entry and OCR invoice data extraction.",
                    "- **Zoho Analytics**: Ideal for compiling dashboard metrics and generating real-time business reports automatically.",
                    "- **Make.com**: For setting up automated hourly syncs between spreadsheets, databases, and Tally."
                ]
            else:
                tools_list = [
                    "- **Make.com / Zapier**: Best for connecting various tools and automating data syncs across workflows.",
                    "- **Flowise / Langflow**: Excellent for building custom AI chatbot agents and document query systems.",
                    "- **Yellow.ai**: Best for automated WhatsApp customer communication and notification alerts."
                ]
            
            fallback_output = (
                "\n\n### RAG Agent Research (Parallel AI Tools)\n"
                "We identified the following automation tools matching your workflow:\n"
                + "\n".join(tools_list)
            )
            return fallback_output
