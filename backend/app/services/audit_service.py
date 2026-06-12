from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.db_models import AuditResultDB, Contact, Submission
from app.models.schemas import AuditResult, SubmissionDetail, SubmissionRequest, SubmissionSummary
from app.services.gemini_service import GeminiService


class AuditService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.gemini = GeminiService()

    async def create_audit(self, request: SubmissionRequest, file_name: str | None, file_text: str | None, user_id: str | None = None) -> AuditResult:
        submission = Submission(
            user_id=user_id,
            business_name=request.business_name,
            industry=request.industry,
            team_size=request.team_size,
            process_description=request.process_description,
            file_name=file_name,
            file_text=file_text,
        )
        self.db.add(submission)
        self.db.flush()
        if request.email or request.phone or request.whatsapp_number:
            self.db.add(Contact(submission_id=submission.id, email=request.email, phone=request.phone, whatsapp_number=request.whatsapp_number))

        audit = await self.gemini.analyze_process({
            "business_name": request.business_name,
            "industry": request.industry,
            "team_size": request.team_size,
            "process_description": request.process_description,
            "additional_context": file_text or "",
        })
        audit.submission_id = submission.id
        self.db.add(AuditResultDB(
            submission_id=submission.id,
            automation_score=audit.automation_score,
            hours_wasted_weekly=audit.hours_wasted_weekly,
            automatable_percentage=audit.automatable_percentage,
            pain_points=[p.model_dump() for p in audit.pain_points],
            blueprint=audit.blueprint.model_dump() if audit.blueprint else {},
            summary=audit.summary,
            industry_context=audit.industry_context,
        ))
        self.db.commit()
        return audit

    def get_audit(self, submission_id: UUID) -> AuditResult | None:
        row = self.db.execute(select(AuditResultDB).where(AuditResultDB.submission_id == submission_id)).scalar_one_or_none()
        if not row:
            return None
        return AuditResult(
            submission_id=row.submission_id,
            automation_score=row.automation_score,
            hours_wasted_weekly=row.hours_wasted_weekly,
            automatable_percentage=row.automatable_percentage,
            pain_points=row.pain_points,
            blueprint=row.blueprint,
            summary=row.summary,
            industry_context=row.industry_context,
        )

    def list_submissions(self) -> list[SubmissionSummary]:
        rows = self.db.execute(select(Submission).order_by(Submission.created_at.desc())).scalars().all()
        return self._format_summaries(rows)

    def list_user_submissions(self, user_id: str) -> list[SubmissionSummary]:
        rows = self.db.execute(select(Submission).where(Submission.user_id == user_id).order_by(Submission.created_at.desc())).scalars().all()
        return self._format_summaries(rows)

    def _format_summaries(self, rows) -> list[SubmissionSummary]:
        summaries = []
        for row in rows:
            audit = row.audit_result
            summaries.append(SubmissionSummary(
                id=row.id,
                business_name=row.business_name,
                industry=row.industry,
                team_size=row.team_size,
                status=row.status,
                automation_score=audit.automation_score if audit else None,
                hours_wasted_weekly=audit.hours_wasted_weekly if audit else None,
                created_at=row.created_at,
            ))
        return summaries

    def get_submission(self, submission_id: UUID) -> SubmissionDetail | None:
        row = self.db.get(Submission, submission_id)
        if not row:
            return None
        audit = row.audit_result
        return SubmissionDetail(
            id=row.id,
            business_name=row.business_name,
            industry=row.industry,
            team_size=row.team_size,
            status=row.status,
            automation_score=audit.automation_score if audit else None,
            hours_wasted_weekly=audit.hours_wasted_weekly if audit else None,
            created_at=row.created_at,
            process_description=row.process_description,
            internal_notes=row.internal_notes,
            audit_result=self.get_audit(row.id) if audit else None,
            agent_runs=[],
        )

    def update_status(self, submission_id: UUID, status: str, notes: str | None = None) -> SubmissionDetail | None:
        row = self.db.get(Submission, submission_id)
        if not row:
            return None
        row.status = status
        if notes is not None:
            row.internal_notes = notes
        self.db.commit()
        return self.get_submission(submission_id)

    def delete_submission(self, submission_id: UUID) -> bool:
        row = self.db.get(Submission, submission_id)
        if not row:
            return False
        self.db.delete(row)
        self.db.commit()
        return True

