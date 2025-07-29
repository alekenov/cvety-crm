from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from typing import Optional
import logging

from app.core.config import get_settings

logger = logging.getLogger(__name__)

# Lazy initialization for engine and session
_engine: Optional[object] = None
_SessionLocal: Optional[sessionmaker] = None

Base = declarative_base()


def get_engine():
    """
    Get database engine. Creates it on first call when settings are available.
    """
    global _engine
    if _engine is None:
        settings = get_settings()
        
        try:
            # Add connection pool settings for PostgreSQL
            if "postgresql" in settings.DATABASE_URL:
                _engine = create_engine(
                    settings.DATABASE_URL,
                    pool_pre_ping=True,  # Verify connections before using
                    pool_size=5,
                    max_overflow=10
                )
            else:
                # SQLite doesn't need connection pooling
                _engine = create_engine(settings.DATABASE_URL)
            
            logger.info(f"Database engine created successfully: {settings.DATABASE_URL[:50]}...")
        except Exception as e:
            logger.error(f"Failed to create database engine: {str(e)}")
            raise
    
    return _engine


def get_db_session():
    """
    Get sessionmaker instance. Creates it on first call.
    """
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(
            autocommit=False, 
            autoflush=False, 
            bind=get_engine()
        )
    return _SessionLocal


# For backward compatibility - these will be removed later
# For now, they act as lazy proxies
class _EngineProxy:
    def __getattr__(self, name):
        return getattr(get_engine(), name)
    
    def __repr__(self):
        return repr(get_engine())


class _SessionLocalProxy:
    def __call__(self, *args, **kwargs):
        return get_db_session()(*args, **kwargs)
    
    def __getattr__(self, name):
        return getattr(get_db_session(), name)


engine = _EngineProxy()
SessionLocal = _SessionLocalProxy()