import uuid
from datetime import datetime

from sqlalchemy import CHAR, DateTime, Float, ForeignKey, Integer, JSON, String, Text, TypeDecorator, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class GUID(TypeDecorator):
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(UUID(as_uuid=True))
        return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == "postgresql":
            return value
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        return uuid.UUID(str(value))


JSON_FIELD = JSONB().with_variant(JSON(), "sqlite")


class Submission(Base):
    __tablename__ = "submissions"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    business_name: Mapped[str] = mapped_column(String(160))
    industry: Mapped[str] = mapped_column(String(120))
    team_size: Mapped[str] = mapped_column(String(60))
    process_description: Mapped[str] = mapped_column(Text)
    file_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    file_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(40), default="new")
    internal_notes: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    audit_result: Mapped["AuditResultDB | None"] = relationship(back_populates="submission", uselist=False)
    contacts: Mapped[list["Contact"]] = relationship(back_populates="submission")
    agent_runs: Mapped[list["AgentRun"]] = relationship(back_populates="submission")


class AuditResultDB(Base):
    __tablename__ = "audit_results"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    submission_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("submissions.id", ondelete="CASCADE"))
    automation_score: Mapped[int] = mapped_column(Integer)
    hours_wasted_weekly: Mapped[float] = mapped_column(Float)
    automatable_percentage: Mapped[int] = mapped_column(Integer)
    pain_points: Mapped[list[dict]] = mapped_column(JSON_FIELD)
    blueprint: Mapped[dict] = mapped_column(JSON_FIELD)
    summary: Mapped[str] = mapped_column(Text)
    industry_context: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    submission: Mapped[Submission] = relationship(back_populates="audit_result")


class AgentRun(Base):
    __tablename__ = "agent_runs"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    submission_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("submissions.id", ondelete="CASCADE"))
    agent_type: Mapped[str] = mapped_column(String(80))
    status: Mapped[str] = mapped_column(String(40), default="queued")
    logs: Mapped[list[dict]] = mapped_column(JSON_FIELD, default=list)
    output: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    submission: Mapped[Submission] = relationship(back_populates="agent_runs")


class Contact(Base):
    __tablename__ = "contacts"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    submission_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("submissions.id", ondelete="CASCADE"))
    email: Mapped[str | None] = mapped_column(String(180), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(40), nullable=True)
    whatsapp_number: Mapped[str | None] = mapped_column(String(40), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    submission: Mapped[Submission] = relationship(back_populates="contacts")
