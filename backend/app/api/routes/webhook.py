from fastapi import APIRouter, Form

router = APIRouter(prefix="/webhook", tags=["webhook"])


@router.post("/whatsapp")
async def whatsapp_webhook(From: str = Form(default=""), Body: str = Form(default="")) -> dict[str, str]:
    body = Body.strip().lower()
    status = "interested" if body in {"yes", "y", "interested"} else "received"
    return {"from": From, "status": status}

