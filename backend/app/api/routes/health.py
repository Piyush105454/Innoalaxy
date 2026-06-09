from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "innoalaxy-api"}


@router.get("/health/deep")
def deep_health(db: Session = Depends(get_db)) -> dict[str, str | bool]:
    db.execute(text("select 1"))
    return {"status": "ok", "database": "ok", "gemini_configured": bool(get_settings().gemini_api_key)}

