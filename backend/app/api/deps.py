from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.core.config import get_settings
from app.crud import shop as crud_shop
from app.crud import user as crud_user
from app.models.shop import Shop
from app.models.user import User

security = HTTPBearer(
    scheme_name="JWT",
    description="JWT token in format: Bearer <token>",
    auto_error=True
)
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


def get_optional_current_shop(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: Session = Depends(get_db)
) -> Optional[Shop]:
    """Get current authenticated shop if token is provided, None otherwise"""
    if not credentials:
        return None
    
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        shop_id: str = payload.get("sub")
        
        if shop_id is None:
            return None
            
        shop = crud_shop.get(db, shop_id=int(shop_id))
        return shop if shop and shop.is_active else None
        
    except JWTError:
        return None


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user from JWT token"""
    token = credentials.credentials
    
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("user_id")
        
        if user_id is None:
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
    
    user = crud_user.get(db, id=int(user_id))
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is inactive"
        )
    
    return user