"""Runtime config. Pulls from env vars (Cloud Run mounts Secret Manager values as env)."""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """App-wide config. Env vars override defaults; Secret Manager values arrive as env on Cloud Run."""

    model_config = SettingsConfigDict(
        env_file=".env.local",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    env: str = Field(default="dev", description="dev | staging | prod")
    log_level: str = Field(default="INFO")

    # GCP / Firebase
    gcp_project: str = Field(default="pulse-dev")
    firebase_project_id: str = Field(default="pulse-dev")

    # Gemini
    gemini_api_key: str = Field(default="", description="Loaded from Secret Manager in prod")
    gemini_model_pro: str = Field(default="gemini-3-pro")
    gemini_model_flash: str = Field(default="gemini-3-flash")
    gemini_model_live: str = Field(default="gemini-3-flash-live")

    # CORS
    cors_origins: list[str] = Field(
        default_factory=lambda: ["*"],
        description="Allowed origins. Demo: open. Lock down post-hackathon.",
    )

    # Slack
    slack_signing_secret: str = Field(default="")
    slack_bot_token: str = Field(default="")

    # Cloud Tasks
    cloud_tasks_queue: str = Field(default="pulse-slack-events")
    cloud_tasks_location: str = Field(default="us-central1")

    # Limits
    max_audio_bytes: int = Field(default=5 * 1024 * 1024)
    max_text_chars: int = Field(default=10_000)
    rate_limit_per_minute: int = Field(default=60)


@lru_cache
def get_settings() -> Settings:
    """Return cached Settings singleton. Cache invalidated only on process restart."""
    return Settings()
