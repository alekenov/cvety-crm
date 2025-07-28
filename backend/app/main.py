from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
import logging

from app.core.config import settings
from app.api.api import api_router
from app.api.deps import get_db
from app.db.session import engine
from app.db.base import Base

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Log configuration
logger.info(f"Starting {settings.APP_NAME}")
logger.info(f"PORT: {settings.PORT}")
logger.info(f"Environment: {'production' if not settings.DEBUG else 'development'}")

# Log database URL (hide password)
try:
    if '@' in settings.DATABASE_URL:
        db_url_parts = settings.DATABASE_URL.split('@')
        protocol_user = db_url_parts[0].split('//')
        safe_db_url = f"{protocol_user[0]}//***:***@{db_url_parts[1]}"
    else:
        safe_db_url = "Invalid DATABASE_URL format"
    logger.info(f"Connecting to database: {safe_db_url}")
except Exception as e:
    logger.error(f"Error parsing DATABASE_URL: {e}")
    safe_db_url = "Error parsing URL"

# Create tables
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")
    
    # Test database connection
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        logger.info("Database connection test: OK")
except Exception as e:
    logger.error(f"Failed to create database tables: {str(e)}")
    logger.error(f"Database URL starts with: {settings.DATABASE_URL[:30]}...")
    raise

app = FastAPI(
    title=settings.APP_NAME,
    openapi_url=f"{settings.API_PREFIX}/openapi.json",
    docs_url=f"{settings.API_PREFIX}/docs",
    redoc_url=f"{settings.API_PREFIX}/redoc",
)

# Health check endpoint
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "api_prefix": settings.API_PREFIX
    }

# Debug endpoint (remove in production)
@app.get("/debug/env")
def debug_env():
    import os
    return {
        "DATABASE_URL_env": os.environ.get("DATABASE_URL", "NOT SET")[:50] + "...",
        "SECRET_KEY_env": os.environ.get("SECRET_KEY", "NOT SET")[:20] + "...",
        "PORT_env": os.environ.get("PORT", "NOT SET"),
        "RAILWAY_ENVIRONMENT": os.environ.get("RAILWAY_ENVIRONMENT", "NOT SET"),
        "DATABASE_URL_config": settings.DATABASE_URL[:50] + "...",
        "PORT_config": settings.PORT
    }

# Database health check endpoint
@app.get("/api/health/db")
def db_health_check(db: Session = Depends(get_db)):
    try:
        # Test database connection
        result = db.execute(text("SELECT 1"))
        result.fetchone()
        
        # Get table count
        if "postgresql" in settings.DATABASE_URL:
            tables_query = text("""
                SELECT COUNT(*) FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            """)
        else:
            tables_query = text("SELECT COUNT(*) FROM sqlite_master WHERE type='table'")
        
        table_count = db.execute(tables_query).scalar()
        
        return {
            "status": "healthy",
            "database": "connected",
            "table_count": table_count,
            "database_type": "postgresql" if "postgresql" in settings.DATABASE_URL else "sqlite"
        }
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_PREFIX)

# Redirect trailing slash for API routes
@app.middleware("http")
async def redirect_trailing_slash(request, call_next):
    """Add trailing slash to API routes if missing"""
    if request.url.path.startswith("/api/") and not request.url.path.endswith("/"):
        # Check if it's not a specific resource (contains ID)
        path_parts = request.url.path.split("/")
        if len(path_parts) <= 4 or not path_parts[-1]:  # /api/resource or /api/resource/
            return RedirectResponse(url=f"{request.url.path}/", status_code=307)
    
    response = await call_next(request)
    return response

# Serve static files (frontend build)
try:
    app.mount("/", StaticFiles(directory="../dist", html=True), name="static")
    logger.info("Static files mounted successfully")
except Exception as e:
    logger.info(f"Static files not mounted: {str(e)}")
    # If dist folder doesn't exist, that's ok for dev
    pass