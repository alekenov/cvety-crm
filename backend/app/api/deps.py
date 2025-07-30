from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.core.config import get_settings
from app.crud import shop as crud_shop
from app.models.shop import Shop

security = HTTPBearer()
settings = get_settings()


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


def get_current_shop(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Shop:
    """Get current authenticated shop from JWT token"""
    token = credentials.credentials
    
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        shop_id: str = payload.get("sub")
        
        if shop_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    shop = crud_shop.get(db, shop_id=int(shop_id))
    
    if shop is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found"
        )
    
    if not shop.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Shop is inactive"
        )
    
    return shop


def get_current_active_shop(
    current_shop: Shop = Depends(get_current_shop)
) -> Shop:
    """Get current active shop"""
    if not current_shop.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive shop"
        )
    return current_shop