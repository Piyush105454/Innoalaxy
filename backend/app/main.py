import logging
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import agent, audit, health, submissions, webhook
from app.core.config import get_settings
from app.core.database import create_all

logging.basicConfig(level=logging.INFO)
settings = get_settings()

app = FastAPI(title="Innoalaxy API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    elapsed = round((time.perf_counter() - start) * 1000, 2)
    logging.info("%s %s -> %s (%sms)", request.method, request.url.path, response.status_code, elapsed)
    return response


@app.on_event("startup")
def startup() -> None:
    create_all()


app.include_router(health.router)
app.include_router(audit.router)
app.include_router(agent.router)
app.include_router(submissions.router)
app.include_router(webhook.router)

