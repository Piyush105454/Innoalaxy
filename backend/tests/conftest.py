import os
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")
os.environ.setdefault("INNOALAXY_ADMIN_KEY", "test-key")

from app.core.database import Base, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models import db_models  # noqa: F401,E402


@pytest.fixture(autouse=True)
def reset_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def sample_submission_data():
    return {
        "business_name": "Sharma Components",
        "industry": "B2B Manufacturing",
        "team_size": "16-50",
        "process_description": "Our sales team checks IndiaMART every morning, copies leads to Excel, sends WhatsApp messages, and prepares a weekly report. This takes many hours every week.",
        "email": "piyush@example.com",
    }

