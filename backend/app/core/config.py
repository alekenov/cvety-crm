import os
from typing import Optional
from pydantic import validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Cvety.kz API"
    DEBUG: bool = False
    API_PREFIX: str = "/api"
    
    # Database - Railway will provide DATABASE_URL
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/flower_shop"
    
    @validator("DATABASE_URL", pre=True)
    def fix_postgres_url(cls, v):
        """Handle Railway's DATABASE_URL format (postgres:// -> postgresql://)"""
        if v and v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql://", 1)
        return v
    
    # Security
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS - Allow Railway domains
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:5173", 
        "http://localhost:3000",
        "https://cvety-kz-production.up.railway.app",
        "https://*.railway.app",
        "https://*.up.railway.app"
    ]
    
    # Railway specific
    PORT: int = 8000
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()