# =============================================================================
# AquaSentinel AI — Backend Configuration
# =============================================================================

import secrets
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings. Override via environment variables or .env file."""

    # Database
    DATABASE_URL: str = "sqlite:///./aquasentinel.db"

    # JWT Authentication
    JWT_SECRET_KEY: str = secrets.token_urlsafe(32)
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_MINUTES: int = 60

    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
         # Production frontend
    "https://final-3h14bvz37-moorthy361.vercel.app",
    ]

    # Auto-seed database
    AUTO_SEED: bool = True

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8"
    }


settings = Settings()
