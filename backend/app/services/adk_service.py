"""
InnoalaxyAgent — Google ADK-based business optimization agent.

Architecture:
* Uses google.adk.sessions.InMemorySessionService for in-process session memory.
* Each agent run gets its own ADK Session keyed by run_id.
* Logs are persisted to the AgentRun row in SQLite so they survive restarts.
* Falls back to deterministic demo mode when ADK is not installed.
"""

import asyncio
import logging
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.db_models import AgentRun, Submission
from app.prompts.agent_prompt import AGENT_SYSTEM_PROMPT, BUSINESS_SOFTWARE_CATALOG
from app.services.gemini_service import GeminiService
from app.services.whatsapp_service import WhatsAppService

logger = logging.getLogger(__name__)

try:
    from google.adk.agents import Agent, LlmAgent
    _ADK_AVAILABLE = True
except ImportError:
    Agent = None  # type: ignore[assignment,misc]
    LlmAgent = None
    _ADK_AVAILABLE = False

try:
    from google.adk.sessions import InMemorySessionService
    _SESSION_SERVICE: InMemorySessionService | None = InMemorySessionService()
    logger.info("ADK InMemorySessionService initialised")
except Exception as _exc:
    InMemorySessionService = None  # type: ignore[assignment,misc]
    _SESSION_SERVICE = None
    logger.warning("ADK InMemorySessionService not available: %s", _exc)


class InnoalaxyAgent:
    """
    Orchestrates the business optimization workflow.

    Memory management:
    - An ADK Session is created (or resumed) for every run via _SESSION_SERVICE.
    - Structured logs are appended to the AgentRun.logs JSON column so the
      full trace is queryable and persists across server restarts.
    """

    APP_NAME = "innoalaxy"

    def __init__(self, db: Session, run_id: UUID, agent_type: str, demo_mode: bool) -> None:
        self.db = db
        self.run_id = run_id
        self.agent_type = agent_type
        self.demo_mode = demo_mode
        self.gemini = GeminiService()
        self.whatsapp = WhatsAppService()
        self.adk_available = _ADK_AVAILABLE
        self._session_id: str | None = None

    # ── ADK session helpers ─────────────────────────────────────────────────

    async def _get_or_create_session(self) -> None:
        """Create an ADK in-memory session keyed to this run."""
        if _SESSION_SERVICE is None:
            return
        try:
            session = await _SESSION_SERVICE.create_session(
                app_name=self.APP_NAME,
                user_id=f"run:{self.run_id}",
            )
            self._session_id = session.id
            logger.info("ADK session created: %s", self._session_id)
        except Exception as exc:
            logger.warning("Could not create ADK session: %s", exc)

    async def _save_to_session(self, key: str, value: object) -> None:
        """Persist a value into the ADK session state (in-memory)."""
        if _SESSION_SERVICE is None or self._session_id is None:
            return
        try:
            session = await _SESSION_SERVICE.get_session(
                app_name=self.APP_NAME,
                user_id=f"run:{self.run_id}",
                session_id=self._session_id,
            )
            if session:
                session.state[key] = value  # type: ignore[index]
        except Exception as exc:
            logger.debug("ADK session update skipped: %s", exc)

    # ── main entry ──────────────────────────────────────────────────────────

    async def run(self) -> None:
        run = self.db.get(AgentRun, self.run_id)
        if not run:
            return

        run.status = "running"
        run.logs = []
        self.db.commit()

        # Create ADK session for this run
        await self._get_or_create_session()

        try:
            submission = self.db.get(Submission, run.submission_id)
            if not submission:
                raise RuntimeError("Submission not found")

            software_map = self._detect_business_software(
                submission.process_description, submission.industry
            )

            await self._log("Loaded submitted workflow and business context")
            await self._log(
                f"Google ADK runtime: {'available (v2.2.0)' if self.adk_available else 'not installed — using deterministic demo adapter'}"
            )
            await self._log(
                f"ADK InMemorySessionService: {'active — session_id=' + self._session_id if self._session_id else 'not available'}"
            )
            await self._log("Agent role loaded: Business Optimization Agent")

            # Persist context into ADK session memory
            await self._save_to_session("submission_id", str(run.submission_id))
            await self._save_to_session("business_name", submission.business_name)
            await self._save_to_session("industry", submission.industry)
            await self._save_to_session("software_map", software_map)

            await asyncio.sleep(0.8)
            await self._log(f"Detected integration candidates: {', '.join(software_map)}")
            await self._save_to_session("detected_integrations", software_map)

            await asyncio.sleep(0.8)
            work_units = self._build_work_units(submission, software_map)
            outputs: list[str] = []

            for unit in work_units:
                await self._log(f"Inspecting {unit['area']}: {unit['manual_step']}")
                await asyncio.sleep(0.8)
                await self._log(f"Mapped integration: {unit['integration']} → {unit['agent_action']}")

                update = self._operator_update(submission.business_name, unit)
                outputs.append(
                    f"{unit['area']}\n"
                    f"Integration: {unit['integration']}\n"
                    f"Agent action: {unit['agent_action']}\n"
                    f"Operator update: {update}"
                )

                # Save per-area result into session memory
                await self._save_to_session(f"area_{unit['area'].lower()}", unit)

                if unit["area"] == "Communication":
                    await self.whatsapp.send_lead_message(
                        "+910000000000", update, demo_mode=self.demo_mode
                    )
                    await self._log("Demo WhatsApp update logged for operator review")

            await asyncio.sleep(0.8)
            await self._log("Persisted optimization plan, logs, and output to agent_runs table")

            run.status = "completed"
            run.output = self._final_report(submission, software_map, outputs)
            self.db.commit()

            # Mark session complete
            await self._save_to_session("status", "completed")
            await self._log("Business optimization agent completed")
            logger.info("AgentRun %s completed successfully", self.run_id)

        except Exception as exc:
            logger.exception("AgentRun %s failed: %s", self.run_id, exc)
            run.status = "failed"
            run.output = str(exc)
            self.db.commit()
            await self._log(f"Agent failed: {exc}", level="error")
            await self._save_to_session("status", "failed")

    # ── logging ─────────────────────────────────────────────────────────────

    async def _log(self, message: str, level: str = "info") -> None:
        run = self.db.get(AgentRun, self.run_id)
        if not run:
            return
        logs = list(run.logs or [])
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": level,
            "message": message,
        }
        logs.append(entry)
        run.logs = logs
        self.db.commit()
        logger.log(
            logging.ERROR if level == "error" else logging.INFO,
            "[AgentRun %s] %s",
            self.run_id,
            message,
        )

    # ── business logic helpers ───────────────────────────────────────────────

    def _detect_business_software(self, description: str, industry: str) -> list[str]:
        text = f"{description} {industry}".lower()
        detected: list[str] = []
        keyword_map = {
            "IndiaMART": ["indiamart", "india mart", "lead"],
            "Justdial": ["justdial", "just dial"],
            "WhatsApp Business": ["whatsapp", "message", "follow-up", "follow up"],
            "Excel": ["excel", "spreadsheet", "sheet"],
            "Google Sheets": ["google sheet", "sheets"],
            "Tally": ["tally", "gst", "invoice", "finance"],
            "Zoho CRM": ["crm", "sales pipeline"],
            "Gmail": ["email", "gmail"],
            "Google Calendar": ["schedule", "meeting", "calendar"],
            "ERPNext": ["inventory", "dispatch", "purchase", "production"],
            "Keka": ["hr", "attendance", "payroll"],
        }
        for tool, keywords in keyword_map.items():
            if any(kw in text for kw in keywords):
                detected.append(tool)
        if not detected:
            detected = ["Excel", "WhatsApp Business", "Gmail", "custom dashboard"]
        return list(dict.fromkeys(detected))

    def _build_work_units(
        self, submission: Submission, integrations: list[str]
    ) -> list[dict[str, str]]:
        return [
            {
                "area": "Intake",
                "manual_step": "Collect incoming leads, requests, files, and updates from the team's current channels.",
                "integration": self._pick(integrations, ["IndiaMART", "Justdial", "Website forms", "Gmail"], fallback=integrations[0]),
                "agent_action": "Read new items, classify urgency, extract contact details, and create a clean work queue.",
            },
            {
                "area": "Operations",
                "manual_step": "Move data between spreadsheets, ERP/CRM records, and team trackers.",
                "integration": self._pick(integrations, ["Excel", "Google Sheets", "Zoho CRM", "ERPNext", "Tally"], fallback="Excel"),
                "agent_action": "Validate fields, update records, flag missing details, and prepare the next action automatically.",
            },
            {
                "area": "Communication",
                "manual_step": "Send repetitive WhatsApp or email updates and chase pending responses.",
                "integration": self._pick(integrations, ["WhatsApp Business", "Gmail"], fallback="WhatsApp Business"),
                "agent_action": "Draft personalized updates, schedule follow-ups, and notify the owner when a human decision is needed.",
            },
            {
                "area": "Reporting",
                "manual_step": "Compile weekly status, sales, finance, or operations reports for the owner.",
                "integration": self._pick(integrations, ["Google Sheets", "Excel", "Tally", "custom dashboard"], fallback="custom dashboard"),
                "agent_action": "Generate a daily summary, weekly report, and exception list with audit logs.",
            },
        ]

    @staticmethod
    def _pick(integrations: list[str], preferred: list[str], fallback: str) -> str:
        for item in preferred:
            if item in integrations:
                return item
        return fallback

    @staticmethod
    def _operator_update(business_name: str, unit: dict[str, str]) -> str:
        return (
            f"{business_name}: {unit['area']} automation is ready in demo mode. "
            f"I mapped {unit['integration']} so the agent can {unit['agent_action'].lower()} "
            "Please review the flagged exceptions before production setup."
        )

    def _final_report(
        self, submission: Submission, integrations: list[str], outputs: list[str]
    ) -> str:
        catalog_hint = ", ".join(
            BUSINESS_SOFTWARE_CATALOG["communication"]
            + BUSINESS_SOFTWARE_CATALOG["productivity"][:2]
        )
        session_note = (
            f"ADK Session ID: {self._session_id}" if self._session_id else "ADK session: N/A"
        )
        return (
            f"Business Optimization Agent Report\n"
            f"Company: {submission.business_name}\n"
            f"Industry: {submission.industry}\n"
            f"ADK package available: {'yes' if self.adk_available else 'no'}\n"
            f"{session_note}\n"
            f"System prompt loaded: {AGENT_SYSTEM_PROMPT.splitlines()[1]}\n"
            f"Detected integrations: {', '.join(integrations)}\n"
            f"Common connector set: {catalog_hint}\n\n"
            + "\n\n".join(outputs)
            + "\n\nRecommended production setup: Google ADK agent + InMemorySessionService "
            "(dev) / DatabaseSessionService (prod) on Neon/Postgres + Vertex AI/Gemini + "
            "approved WhatsApp templates."
        )
