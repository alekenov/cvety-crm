from typing import Generator
from sqlalchemy.orm import Session

from app.db.session import get_db_session


def get_db() -> Generator[Session, None, None]:
    """
    Dependency to get database session.
    Uses lazy initialization to ensure env vars are available.
    """
    SessionLocal = get_db_session()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()