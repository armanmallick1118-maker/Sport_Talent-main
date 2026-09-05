"""
ATHENA API Configuration.
"""
import os

class Settings:
    PROJECT_NAME: str = "ATHENA Personal Wellness & Fitness Intelligence"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("ATHENA_SECRET_KEY", "athena-secure-prod-key-2026")
    CORS_ORIGINS: list = ["*"]
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./athena.db")

settings = Settings()
