import asyncio
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, get_db
from app.models.db_models import AgentRun
from app.models.schemas import APIResponse, AgentRunRequest, AgentRunResult
from app.services.adk_service import InnoalaxyAgent

router = APIRouter(prefix="/agent", tags=["agent"])


def _serialize(run: AgentRun) -> AgentRunResult:
    return AgentRunResult(
        run_id=run.id,
        submission_id=run.submission_id,
        agent_type=run.agent_type,
        status=run.status,
        logs=run.logs or [],
        output=run.output or "",
    )


async def _run_agent_task(run_id: UUID, agent_type: str, demo_mode: bool) -> None:
    db = SessionLocal()
    try:
        await InnoalaxyAgent(db, run_id, agent_type, demo_mode).run()
    finally:
        db.close()


@router.post("/run", response_model=APIResponse[dict[str, str]])
def run_agent(request: AgentRunRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)) -> APIResponse[dict[str, str]]:
    run = AgentRun(submission_id=request.submission_id, agent_type=request.agent_type, status="queued", logs=[], output="")
    db.add(run)
    db.commit()
    background_tasks.add_task(_run_agent_task, run.id, request.agent_type, request.demo_mode)
    return APIResponse(data={"run_id": str(run.id)}, message="Agent run started")


@router.get("/{run_id}/status", response_model=APIResponse[AgentRunResult])
def agent_status(run_id: UUID, db: Session = Depends(get_db)) -> APIResponse[AgentRunResult]:
    run = db.get(AgentRun, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Agent run not found")
    return APIResponse(data=_serialize(run))


@router.get("/{run_id}/output", response_model=APIResponse[dict[str, str]])
def agent_output(run_id: UUID, db: Session = Depends(get_db)) -> APIResponse[dict[str, str]]:
    run = db.get(AgentRun, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Agent run not found")
    return APIResponse(data={"output": run.output or "", "status": run.status})


@router.websocket("/{run_id}/stream")
async def agent_stream(websocket: WebSocket, run_id: UUID) -> None:
    await websocket.accept()
    seen = 0
    try:
        while True:
            db = SessionLocal()
            run = db.get(AgentRun, run_id)
            db.close()
            if not run:
                await websocket.send_json({"error": "Agent run not found"})
                return
            logs = run.logs or []
            for item in logs[seen:]:
                await websocket.send_json(item)
            seen = len(logs)
            if run.status in {"completed", "failed"}:
                await websocket.send_json({"status": run.status, "output": run.output})
                return
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        return

