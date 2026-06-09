import logging
from dataclasses import dataclass

from twilio.rest import Client

from app.core.config import get_settings

logger = logging.getLogger(__name__)


@dataclass
class MessageResult:
    sent: bool
    sid: str | None
    body: str
    demo_mode: bool


class WhatsAppService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.demo_mode = self.settings.whatsapp_demo_mode
        self.client = None
        if self.settings.twilio_account_sid and self.settings.twilio_auth_token:
            self.client = Client(self.settings.twilio_account_sid, self.settings.twilio_auth_token)

    async def notify_piyush(self, submission: dict, audit: dict | None = None) -> bool:
        top_pain = "Needs review"
        if audit and audit.get("pain_points"):
            top_pain = audit["pain_points"][0]["title"]
        body = (
            "New Innoalaxy submission!\n\n"
            f"Company: {submission['business_name']}\n"
            f"Industry: {submission['industry']}\n"
            f"Team size: {submission['team_size']}\n"
            f"Automation score: {audit.get('automation_score', 'pending') if audit else 'pending'}\n"
            f"Hours wasted/week: {audit.get('hours_wasted_weekly', 'pending') if audit else 'pending'}\n\n"
            f"Top pain: {top_pain}\n"
            f"View audit: {self.settings.dashboard_url}"
        )
        result = await self.send_lead_message(self.settings.piyush_whatsapp_number, body, demo_mode=self.demo_mode)
        return result.sent

    async def send_lead_message(self, to_number: str, message: str, demo_mode: bool = True) -> MessageResult:
        if demo_mode or not self.client:
            logger.info("WhatsApp demo message to %s: %s", to_number, message)
            return MessageResult(sent=True, sid="demo-message", body=message, demo_mode=True)
        msg = self.client.messages.create(
            from_=self.settings.twilio_whatsapp_from,
            to=f"whatsapp:{to_number}" if not to_number.startswith("whatsapp:") else to_number,
            body=message,
        )
        return MessageResult(sent=True, sid=msg.sid, body=message, demo_mode=False)

    async def send_audit_ready(self, contact: dict, audit_url: str) -> bool:
        number = contact.get("whatsapp_number") or contact.get("phone")
        if not number:
            return False
        message = f"Hi, your Innoalaxy AI workflow audit is ready: {audit_url}. Reply YES if you want us to review it with you."
        result = await self.send_lead_message(number, message, demo_mode=self.demo_mode)
        return result.sent

