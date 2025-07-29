from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
import logging
import os
from pathlib import Path

from app.core.config import get_settings
from app.api.api import api_router
from app.api.deps import get_db
from app.db.session import get_engine
from app.db.base import Base

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Don't log database URL here - do it in startup event after env vars are loaded

# Don't create tables here - do it in startup event

app = FastAPI(redirect_slashes=False)

# Get settings for app configuration
settings = get_settings()

# Configure FastAPI
app.title = settings.APP_NAME
app.openapi_url = f"{settings.API_PREFIX}/openapi.json"
app.docs_url = f"{settings.API_PREFIX}/docs"
app.redoc_url = f"{settings.API_PREFIX}/redoc"

# Define static directory paths
static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dist")
docker_static_dir = "/app/dist"

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
def health_check():
    settings = get_settings()
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "api_prefix": settings.API_PREFIX
    }

# Debug endpoint (remove in production)
@app.get("/debug/env")
def debug_env():
    import os
    settings = get_settings()
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
        settings = get_settings()
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

# Include API router - MUST be before static files
app.include_router(api_router, prefix=settings.API_PREFIX)

# Add a catch-all route for SPA to handle client-side routing
@app.get("/{path:path}")
async def catch_all(path: str):
    """Catch-all route to serve index.html for client-side routing"""
    # Check if this is an API route first
    if path.startswith("api/"):
        raise HTTPException(status_code=404, detail="API endpoint not found")
    
    # Check if static file exists
    static_file = None
    if os.path.exists(static_dir):
        static_file = Path(static_dir) / path
    elif os.path.exists(docker_static_dir):
        static_file = Path(docker_static_dir) / path
    
    if static_file and static_file.exists() and static_file.is_file():
        return FileResponse(static_file)
    
    # For all other routes, return index.html for client-side routing
    index_file = None
    if os.path.exists(static_dir):
        index_file = Path(static_dir) / "index.html"
    elif os.path.exists(docker_static_dir):
        index_file = Path(docker_static_dir) / "index.html"
    
    if index_file and index_file.exists():
        return FileResponse(index_file)
    
    # If no index.html found, return 404
    raise HTTPException(status_code=404, detail="Not Found")

# Set up CORS and routes will be configured in startup event

# Note: Removed trailing slash middleware - let FastAPI handle paths as defined

# Startup event to initialize everything after env vars are loaded
@app.on_event("startup")
async def startup_event():
    """Initialize app configuration on startup"""
    settings = get_settings()
    
    # Log configuration
    logger.info(f"Starting {settings.APP_NAME}")
    logger.info(f"PORT: {settings.PORT}")
    logger.info(f"Environment: {'production' if not settings.DEBUG else 'development'}")
    
    # Log database URL (hide password)
    try:
        import os
        env_db_url = os.environ.get("DATABASE_URL", "NOT SET")
        logger.info(f"DATABASE_URL from env: {env_db_url[:30]}...")
        logger.info(f"DATABASE_URL from settings: {settings.DATABASE_URL[:30]}...")
        
        if '@' in settings.DATABASE_URL:
            db_url_parts = settings.DATABASE_URL.split('@')
            protocol_user = db_url_parts[0].split('//')
            safe_db_url = f"{protocol_user[0]}//***:***@{db_url_parts[1]}"
        else:
            safe_db_url = f"Invalid DATABASE_URL format (length: {len(settings.DATABASE_URL)})"
        logger.info(f"Connecting to database: {safe_db_url}")
    except Exception as e:
        logger.error(f"Error parsing DATABASE_URL: {e}")
    
    # Create database tables
    try:
        engine = get_engine()
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
        
        # Test database connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            logger.info("Database connection test: OK")
    except Exception as e:
        logger.error(f"Failed to create database tables: {str(e)}")
        raise
    
    logger.info("Application startup complete")


# Note: Static file serving is now handled by the catch-all route above
# This provides better control over SPA routing and hard refreshes