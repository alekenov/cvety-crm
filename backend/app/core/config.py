from typing import Optional, List
from pydantic import validator, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Cvety.kz API"
    DEBUG: bool = Field(default=False, env="DEBUG")
    API_PREFIX: str = "/api"
    
    # Database - Railway will provide DATABASE_URL
    DATABASE_URL: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/flower_shop",
        env="DATABASE_URL"
    )
    
    @validator("DATABASE_URL", pre=True)
    def fix_postgres_url(cls, v):
        """Handle Railway's DATABASE_URL format (postgres:// -> postgresql://)"""
        if v and v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql://", 1)
        return v
    
    # Security
    SECRET_KEY: str = Field(
        default="your-secret-key-here-change-in-production",
        env="SECRET_KEY"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS - Allow Railway domains
    BACKEND_CORS_ORIGINS: List[str] = Field(
        default=[
            "http://localhost:5173",
            "http://localhost:5174",  # telegram-miniapp local
            "http://localhost:3000",
            "https://cvety-kz-production.up.railway.app",
            "https://telegram-miniapp-production-5ad1.up.railway.app",
            "https://telegram-miniapp-production-bb16.up.railway.app"
        ]
    )
    
    # Railway specific
    PORT: int = Field(default=8000, env="PORT")
    RAILWAY_ENVIRONMENT: Optional[str] = Field(default=None, env="RAILWAY_ENVIRONMENT")
    
    # Redis (Railway provides this)
    REDIS_URL: Optional[str] = Field(default=None, env="REDIS_URL")
    
    # Telegram Bot
    TELEGRAM_BOT_TOKEN: Optional[str] = Field(default=None, env="TELEGRAM_BOT_TOKEN")
    TELEGRAM_WEBHOOK_URL: Optional[str] = Field(default=None, env="TELEGRAM_WEBHOOK_URL")
    
    # Use SettingsConfigDict instead of Config class (Pydantic v2 style)
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"  # Ignore extra env vars
    )


# Lazy initialization pattern
_settings: Optional[Settings] = None


def get_settings() -> Settings:
    """
    Get settings instance. Creates it on first call when env vars are available.
    """
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings