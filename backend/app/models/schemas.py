from datetime import datetime
from typing import Generic, Literal, TypeVar
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

AutomationType = str
Priority = str
Complexity = str


class SubmissionRequest(BaseModel):
    business_name: str = Field(min_length=2, max_length=160)
    industry: str = Field(min_length=2, max_length=120)
    team_size: str = Field(min_length=1, max_length=60)
    process_description: str = Field(min_length=50, max_length=8000)
    email: EmailStr | None = None
    phone: str | None = None
    whatsapp_number: str | None = None


class PainPoint(BaseModel):
    title: str
    description: str
    time_wasted_hours: float = Field(ge=0)
    automation_type: AutomationType
    priority: Priority
    complexity: Complexity


class BlueprintStep(BaseModel):
    title: str
    description: str
    tool: str


class BlueprintResult(BaseModel):
    steps: list[BlueprintStep]
    integrations: list[str]
    build_time_weeks: int
    hours_saved_weekly: float
    price_range: str
    score_breakdown: dict[str, int] | None = None


class AuditResult(BaseModel):
    submission_id: UUID | None = None
    automation_score: int = Field(ge=0, le=100)
    hours_wasted_weekly: float = Field(ge=0)
    automatable_percentage: int = Field(ge=0, le=100)
    pain_points: list[PainPoint]
    blueprint: BlueprintResult | None = None
    summary: str
    industry_context: str


class AgentRunRequest(BaseModel):
    submission_id: UUID
    agent_type: str = "lead_followup"
    demo_mode: bool = True


class AgentLog(BaseModel):
    timestamp: datetime
    level: str = "info"
    message: str


class AgentRunResult(BaseModel):
    run_id: UUID
    submission_id: UUID
    agent_type: str
    status: Literal["queued", "running", "completed", "failed"]
    logs: list[AgentLog]
    output: str = ""


class SubmissionSummary(BaseModel):
    id: UUID
    business_name: str
    industry: str
    team_size: str
    status: str
    email: str | None = None
    automation_score: int | None = None
    hours_wasted_weekly: float | None = None
    created_at: datetime


class SubmissionDetail(SubmissionSummary):
    process_description: str
    internal_notes: str = ""
    audit_result: AuditResult | None = None
    agent_runs: list[AgentRunResult] = []


T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    data: T
    message: str = "ok"

