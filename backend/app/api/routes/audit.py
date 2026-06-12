from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.schemas import APIResponse, AuditResult, SubmissionRequest
from app.services.audit_service import AuditService
from app.services.whatsapp_service import WhatsAppService
from app.api.dependencies import get_current_user

router = APIRouter(prefix="/audit", tags=["audit"])


async def _read_upload(file: UploadFile | None) -> tuple[str | None, str | None]:
    if not file:
        return None, None
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File must be under 10MB")
    text = content[:12000].decode("utf-8", errors="ignore").replace("\x00", "")
    return file.filename, text


@router.post("/analyze", response_model=APIResponse[AuditResult])
async def analyze_audit(
    background_tasks: BackgroundTasks,
    business_name: Annotated[str, Form()],
    industry: Annotated[str, Form()],
    team_size: Annotated[str, Form()],
    process_description: Annotated[str, Form()],
    email: Annotated[str | None, Form()] = None,
    phone: Annotated[str | None, Form()] = None,
    whatsapp_number: Annotated[str | None, Form()] = None,
    file: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
    user_id: str | None = Depends(get_current_user),
) -> APIResponse[AuditResult]:
    request = SubmissionRequest(
        business_name=business_name,
        industry=industry,
        team_size=team_size,
        process_description=process_description,
        email=email or None,
        phone=phone or None,
        whatsapp_number=whatsapp_number or None,
    )
    file_name, file_text = await _read_upload(file)
    result = await AuditService(db).create_audit(request, file_name, file_text, user_id)
    background_tasks.add_task(
        WhatsAppService().notify_piyush,
        request.model_dump(),
        result.model_dump(mode="json"),
    )
    return APIResponse(data=result, message="Audit generated")


@router.get("/history")
def get_user_history(db: Session = Depends(get_db), user_id: str | None = Depends(get_current_user)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    summaries = AuditService(db).list_user_submissions(user_id)
    return APIResponse(data=summaries)


@router.get("/{submission_id}", response_model=APIResponse[AuditResult])
def get_audit(submission_id: UUID, db: Session = Depends(get_db)) -> APIResponse[AuditResult]:
    result = AuditService(db).get_audit(submission_id)
    if not result:
        raise HTTPException(status_code=404, detail="Audit not found")
    return APIResponse(data=result)

