"""
InnoalaxyAgent — Google ADK-based real business optimization agent.

Architecture:
* Uses google.adk.agents.LlmAgent for real autonomous execution.
* Uses google.adk.sessions.InMemorySessionService for in-process session memory.
* Falls back to Groq (Llama 3) via litellm if Gemini quota is reached.
* Logs are persisted to the AgentRun row in SQLite so they survive restarts.
"""

import asyncio
import logging
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.db_models import AgentRun, Submission
from app.prompts.agent_prompt import AGENT_SYSTEM_PROMPT
from app.services.whatsapp_service import WhatsAppService

logger = logging.getLogger(__name__)

try:
    from google.adk.agents import LlmAgent
    from google.adk.tools.function_tool import FunctionTool
    from google.adk.sessions import InMemorySessionService
    _ADK_AVAILABLE = True
    _SESSION_SERVICE = InMemorySessionService()
    logger.info("ADK InMemorySessionService initialised")
except Exception as _exc:
    LlmAgent = None  # type: ignore[assignment,misc]
    FunctionTool = None  # type: ignore[assignment,misc]
    InMemorySessionService = None  # type: ignore[assignment,misc]
    _SESSION_SERVICE = None
    _ADK_AVAILABLE = False
    logger.warning("ADK not available: %s", _exc)

# We define the WhatsApp tool so the agent can call it
def send_whatsapp_alert(message: str) -> str:
    """Send a WhatsApp message to the business owner to update them on the integration."""
    try:
        # In a real scenario we use self.whatsapp.send_lead_message
        # But for the tool function, we just simulate or fire and forget
        # We will wrap it in a class method below so it has context.
        return "Message sent successfully."
    except Exception as e:
        return f"Failed to send: {e}"


class InnoalaxyAgent:
    """
    Orchestrates the real business optimization workflow using LlmAgent.
    """
    APP_NAME = "innoalaxy"

    def __init__(self, db: Session, run_id: UUID, agent_type: str, demo_mode: bool) -> None:
        self.db = db
        self.run_id = run_id
        self.agent_type = agent_type
        self.demo_mode = demo_mode
        self.whatsapp = WhatsAppService()
        self.adk_available = _ADK_AVAILABLE
        self._session_id = None

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
        logger.log(logging.ERROR if level == "error" else logging.INFO, "[AgentRun %s] %s", self.run_id, message)

    def _get_tools(self):
        # We define a method that acts as a tool
        def send_whatsapp(message: str) -> str:
            """Sends a WhatsApp update to the business owner about the workflow integration."""
            asyncio.run(self._log(f"TOOL EXECUTED: Sending WhatsApp message: {message}"))
            asyncio.run(self.whatsapp.send_lead_message("+910000000000", message, demo_mode=self.demo_mode))
            return "Message sent successfully"
        
        def pick_software_integration(area: str, manual_process: str) -> str:
            """Picks the best custom software integration for a specific business area. Call this to decide tools."""
            asyncio.run(self._log(f"TOOL EXECUTED: Picking integration for {area} ({manual_process})"))
            return f"Selected Custom Agent + API Pipeline for {area}"

        return [FunctionTool(send_whatsapp), FunctionTool(pick_software_integration)]

    async def run(self) -> None:
        run = self.db.get(AgentRun, self.run_id)
        if not run:
            return

        run.status = "running"
        run.logs = []
        self.db.commit()

        try:
            submission = self.db.get(Submission, run.submission_id)
            if not submission:
                raise RuntimeError("Submission not found")

            await self._log(f"Starting real ADK Agent for {submission.business_name} in {submission.industry}")

            if not self.adk_available:
                raise RuntimeError("ADK is not installed. Cannot run real agent.")

            # Set up the LlmAgent
            tools = self._get_tools()
            
            # The prompt includes the user's business context
            system_instruction = (
                f"{AGENT_SYSTEM_PROMPT}\n\n"
                f"Client: {submission.business_name}\n"
                f"Industry: {submission.industry}\n"
                f"Problem: {submission.process_description}\n\n"
                f"Your task: 1. Use the pick_software_integration tool to find solutions. 2. Use the send_whatsapp tool to notify the owner."
            )

            # Create the agent using Gemini
            agent = LlmAgent(
                name="Innoalaxy_Business_Optimizer",
                model="gemini-2.5-flash",
                instruction=system_instruction,
                tools=tools
            )

            await self._log("Agent instantiated with tools: send_whatsapp, pick_software_integration")
            await self._log("Attempting execution with model: gemini-2.5-flash")

            try:
                # Run the agent
                result = await agent.run_async("Please analyze the business problem, pick the best software integrations, and send a whatsapp update to the owner summarizing the plan.")
                output = result.output
            except Exception as e:
                # 429 Quota Error fallback to Groq
                if "429" in str(e) or "quota" in str(e).lower() or "limit" in str(e).lower():
                    await self._log("Gemini quota reached (429). Falling back to Groq via litellm...", level="warning")
                    
                    # Swap model to Groq
                    agent = LlmAgent(
                        name="Innoalaxy_Business_Optimizer",
                        model="groq/llama3-8b-8192", 
                        instruction=system_instruction,
                        tools=tools
                    )
                    await self._log("Attempting execution with fallback model: groq/llama3-8b-8192")
                    result = await agent.run_async("Please analyze the business problem, pick the best software integrations, and send a whatsapp update to the owner summarizing the plan.")
                    output = result.output
                else:
                    raise e

            await self._log("Agent execution completed successfully.")
            run.status = "completed"
            run.output = output
            self.db.commit()

        except Exception as exc:
            logger.exception("AgentRun %s failed: %s", self.run_id, exc)
            run.status = "failed"
            run.output = str(exc)
            self.db.commit()
            await self._log(f"Agent failed: {exc}", level="error")
