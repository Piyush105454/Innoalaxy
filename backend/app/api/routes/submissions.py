from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_admin_key
from app.models.schemas import APIResponse, SubmissionDetail, SubmissionSummary
from app.services.audit_service import AuditService

router = APIRouter(prefix="/submissions", tags=["submissions"], dependencies=[Depends(require_admin_key)])


class StatusUpdate(BaseModel):
    status: str
    notes: str | None = None


@router.get("", response_model=APIResponse[list[SubmissionSummary]])
def list_submissions(db: Session = Depends(get_db)) -> APIResponse[list[SubmissionSummary]]:
    return APIResponse(data=AuditService(db).list_submissions())


@router.get("/{submission_id}", response_model=APIResponse[SubmissionDetail])
def get_submission(submission_id: UUID, db: Session = Depends(get_db)) -> APIResponse[SubmissionDetail]:
    result = AuditService(db).get_submission(submission_id)
    if not result:
        raise HTTPException(status_code=404, detail="Submission not found")
    return APIResponse(data=result)


@router.patch("/{submission_id}", response_model=APIResponse[SubmissionDetail])
def update_submission(submission_id: UUID, request: StatusUpdate, db: Session = Depends(get_db)) -> APIResponse[SubmissionDetail]:
    result = AuditService(db).update_status(submission_id, request.status, request.notes)
    if not result:
        raise HTTPException(status_code=404, detail="Submission not found")
    return APIResponse(data=result, message="Submission updated")

