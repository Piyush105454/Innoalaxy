from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    environment: str = "development"
    database_url: str = Field(default="postgresql+psycopg://postgres:postgres@localhost:5432/innoalaxy")
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-1.5-pro"
    groq_api_key: str | None = None
    groq_model: str = "llama-3.3-70b-versatile"
    innoalaxy_admin_key: str = "change-me"
    frontend_url: str = "http://localhost:5173"
    dashboard_url: str = "http://localhost:5173/dashboard"
    piyush_whatsapp_number: str = "+919999999999"
    twilio_account_sid: str | None = None
    twilio_auth_token: str | None = None
    twilio_whatsapp_from: str = "whatsapp:+14155238886"
    whatsapp_demo_mode: bool = True


@lru_cache
def get_settings() -> Settings:
    return Settings()

