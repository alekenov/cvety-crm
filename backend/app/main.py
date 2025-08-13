from fastapi import FastAPI, Depends, HTTPException
from fastapi.routing import APIRoute
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
import logging
import os
from pathlib import Path
import asyncio
from datetime import datetime

from app.core.config import get_settings
from app.api.api import api_router
from app.api.deps import get_db
from app.db.session import get_engine
from app.db.base import Base
from app.services.telegram_service import telegram_service


def generate_unique_operation_id(route: APIRoute) -> str:
    """Generate clean operation IDs for better client generation"""
    if route.tags:
        # Remove tag prefix for cleaner method names
        # e.g., "orders-get_orders" -> "get_orders"
        return route.name
    return f"{route.name}"

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
# Trigger reload

# Don't log database URL here - do it in startup event after env vars are loaded

# Don't create tables here - do it in startup event

app = FastAPI(
    redirect_slashes=False,
    title="Cvety.kz API",
    description="""
## 🌸 Cvety.kz - Flower Shop Management API

This API provides comprehensive endpoints for managing a flower shop business in Kazakhstan.

### Key Features:
- 🔐 **Secure Authentication** via Telegram OTP
- 📦 **Order Management** with real-time status tracking
- 🌷 **Product Catalog** with categories and pricing
- 👥 **Customer CRM** with preferences and important dates
- 📊 **Warehouse Management** with multi-currency support
- 🎨 **Production Queue** for florist task assignment
- 📍 **Public Order Tracking** for customers

### Integration Support:
- **Telegram Bots** - Full webhook support
- **WhatsApp Business** - Order notifications
- **Mobile Apps** - Type-safe client generation
- **AI Assistants** - Semantic API descriptions

### Market Specifics:
- Currency: KZT (Kazakhstani Tenge)
- Phone Format: +7 XXX XXX XX XX
- Languages: Russian (primary), Kazakh
- Payment: Kaspi Pay integration ready
    """,
    version="1.0.0",
    contact={
        "name": "Cvety.kz Support",
        "email": "support@cvety.kz",
        "url": "https://cvety.kz"
    },
    license_info={
        "name": "Proprietary",
        "url": "https://cvety.kz/license"
    },
    openapi_tags=[
        {
            "name": "authentication",
            "description": "🔐 Telegram OTP-based authentication endpoints"
        },
        {
            "name": "orders",
            "description": "📦 Order management and workflow"
        },
        {
            "name": "tracking",
            "description": "📍 Public order tracking (no auth required)"
        },
        {
            "name": "products",
            "description": "🌷 Product catalog management"
        },
        {
            "name": "customers",
            "description": "👥 Customer relationship management"
        },
        {
            "name": "warehouse",
            "description": "📊 Inventory and supply management"
        },
        {
            "name": "production",
            "description": "🎨 Florist task queue and assignment"
        },
        {
            "name": "settings",
            "description": "⚙️ Shop configuration and preferences"
        }
    ],
    generate_unique_id_function=generate_unique_operation_id
)

# Get settings for app configuration
settings = get_settings()

# Mount uploads directory for serving uploaded files
uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Configure FastAPI
app.title = "Cvety.kz API"
# Remove the API prefix from docs URLs - they should be at root level
app.openapi_url = "/openapi.json"
app.docs_url = "/docs"
app.redoc_url = "/redoc"

# Define static directory paths
static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dist")
docker_static_dir = "/app/dist"

# Static file configuration
logger.info(f"Current working directory: {os.getcwd()}")
logger.info(f"Static dir path: {static_dir}")
logger.info(f"Docker static dir path: {docker_static_dir}")
logger.info(f"Static dir exists: {os.path.exists(static_dir)}")
logger.info(f"Docker static dir exists: {os.path.exists(docker_static_dir)}")

# List directory contents for debugging
if os.path.exists(docker_static_dir):
    try:
        files = os.listdir(docker_static_dir)
        logger.info(f"Docker static dir contents: {files}")
        assets_path = os.path.join(docker_static_dir, "assets")
        if os.path.exists(assets_path):
            assets_files = os.listdir(assets_path)[:10]  # Limit to first 10 files
            logger.info(f"Assets dir contents (first 10): {assets_files}")
    except Exception as e:
        logger.error(f"Error listing docker static dir: {e}")
        
if os.path.exists(static_dir):
    try:
        files = os.listdir(static_dir)
        logger.info(f"Local static dir contents: {files}")
    except Exception as e:
        logger.error(f"Error listing local static dir: {e}")

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

# Health check endpoint - must be before API router for proper routing
@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint for Docker and monitoring"""
    try:
        # Check database connection
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "database": "connected"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unhealthy")

# Include API router - MUST be before static files
app.include_router(api_router, prefix=settings.API_PREFIX)

# Mount static files directory if it exists
# This needs to be after API routes but before catch-all
# Check Docker location first in production
if os.path.exists(docker_static_dir):
    assets_dir = os.path.join(docker_static_dir, "assets")
elif os.path.exists(static_dir):
    assets_dir = os.path.join(static_dir, "assets")
else:
    assets_dir = None

if assets_dir and os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="static_assets")
    logger.info(f"Static assets mounted from: {assets_dir}")
else:
    logger.error(f"Static assets directory not found. Checked: docker={docker_static_dir} (exists: {os.path.exists(docker_static_dir)}), local={static_dir} (exists: {os.path.exists(static_dir)})")
    if assets_dir:
        logger.error(f"Assets dir path: {assets_dir} (exists: {os.path.exists(assets_dir)})")

# Add a catch-all route for SPA to handle client-side routing
# This should only handle non-API routes
@app.get("/{path:path}")
async def catch_all(path: str):
    """Catch-all route to serve index.html for client-side routing"""
    # Serving catch-all route for SPA
    
    # Skip catch-all for API routes, docs, and health endpoints
    if path.startswith("api/") or path == "api" or path in ["docs", "redoc", "openapi.json", "health"]:
        # Raise 404 for unknown API routes
        logger.info(f"Skipping API route: {path}")
        raise HTTPException(status_code=404, detail="API endpoint not found")
    
    # Check if static file exists
    # Check Docker location first in production
    static_file = None
    if os.path.exists(docker_static_dir):
        static_file = Path(docker_static_dir) / path
    elif os.path.exists(static_dir):
        static_file = Path(static_dir) / path
    
    if static_file and static_file.exists() and static_file.is_file():
        return FileResponse(static_file)
    
    # For all other routes, return index.html for client-side routing
    # Check Docker location first in production
    index_file = None
    if os.path.exists(docker_static_dir):
        index_file = Path(docker_static_dir) / "index.html"
        logger.info(f"Trying docker index.html: {index_file}")
    elif os.path.exists(static_dir):
        index_file = Path(static_dir) / "index.html"
        logger.info(f"Trying local index.html: {index_file}")
    else:
        logger.error(f"Neither docker nor local static dir exists!")
    
    if index_file and index_file.exists():
        logger.info(f"Serving index.html from: {index_file}")
        return FileResponse(index_file)
    
    # If no index.html found, return 404
    logger.error(f"index.html not found. Checked: {index_file}")
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
    
    # Initialize Telegram bot (в том числе в DEBUG режиме для локальной разработки)
    if settings.TELEGRAM_BOT_TOKEN:
        try:
            logger.info(f"Initializing Telegram bot with token: {settings.TELEGRAM_BOT_TOKEN[:10]}...")
            await telegram_service.initialize(settings.TELEGRAM_BOT_TOKEN)
            
            # Setup webhook in production
            if settings.TELEGRAM_WEBHOOK_URL:
                logger.info(f"Setting up webhook: {settings.TELEGRAM_WEBHOOK_URL}")
                await telegram_service.setup_webhook(
                    webhook_url=settings.TELEGRAM_WEBHOOK_URL,
                    webhook_path="/api/telegram/webhook"
                )
                
                # Verify webhook was set successfully
                if telegram_service.bot:
                    webhook_info = await telegram_service.bot.get_webhook_info()
                    logger.info(f"Webhook verification - URL: {webhook_info.url}, Status: {'active' if webhook_info.url else 'inactive'}")
                
                logger.info(f"Telegram webhook configured: {settings.TELEGRAM_WEBHOOK_URL}")
            else:
                logger.info("No TELEGRAM_WEBHOOK_URL provided, starting polling mode")
                # Start polling in a background task
                asyncio.create_task(telegram_service.start_polling())
                logger.info("Telegram bot polling started")
        except Exception as e:
            logger.error(f"Failed to initialize Telegram bot: {e}", exc_info=True)
            # Don't raise - app should work without Telegram
    else:
        logger.info("Telegram bot not initialized - no TELEGRAM_BOT_TOKEN provided")
    
    logger.info("Application startup complete")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    if telegram_service.bot:
        await telegram_service.stop()
        logger.info("Telegram bot stopped")


# Note: Static file serving is now handled by the catch-all route above
# This provides better control over SPA routing and hard refreshes