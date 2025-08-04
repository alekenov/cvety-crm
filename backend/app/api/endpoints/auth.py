from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from jose import jwt

from app.api import deps
from app.core.config import get_settings
from app.crud import shop as crud_shop
from app.schemas.shop import (
    PhoneAuthRequest,
    OTPVerifyRequest,
    AuthToken,
    Shop
)
from app.services.otp_service import otp_service
from app.services.telegram_service import telegram_service
from app.services.redis_service import redis_service

router = APIRouter()
settings = get_settings()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


@router.post("/request-otp", status_code=201,
    summary="Request OTP code",
    description="""
    Request a one-time password (OTP) for phone number authentication.
    
    ## Process:
    1. Provide phone number in Kazakhstan format (+7XXXXXXXXXX)
    2. System generates 6-digit OTP code
    3. Code is sent via Telegram if user has connected their account
    4. Code expires after 5 minutes
    
    ## Delivery methods:
    - **telegram**: Sent to user's Telegram (requires @cvety_kz_bot)
    - **sms**: SMS delivery (not implemented yet)
    - **debug**: Returns OTP in response (only in DEBUG mode)
    
    ## Rate limiting:
    - Maximum 3 requests per minute per phone number
    - After 3 failed attempts, account is temporarily locked
    
    ## Response:
    - Success: Message with delivery method
    - Rate limited: 429 error
    """,
    responses={
        201: {
            "description": "OTP requested successfully",
            "content": {
                "application/json": {
                    "example": {
                        "message": "OTP sent to your Telegram",
                        "delivery_method": "telegram"
                    }
                }
            }
        },
        429: {
            "description": "Too many requests",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Too many requests. Please try again later."
                    }
                }
            }
        }
    })
async def request_otp(
    request: PhoneAuthRequest,
    db: Session = Depends(deps.get_db)
):
    """Request OTP for phone number"""
    # Check if shop exists
    shop = crud_shop.get_by_phone(db, phone=request.phone)
    
    if not shop:
        # For new shops, we'll create them after OTP verification
        pass
    
    # Generate OTP
    otp = otp_service.generate_otp(request.phone)
    
    if not otp:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please try again later."
        )
    
    # Get telegram_id from Redis if available (set by Telegram bot)
    telegram_data = redis_service.get(f"telegram:{request.phone}")
    
    if telegram_data and telegram_data.get("telegram_id"):
        # Send OTP via Telegram
        telegram_id = int(telegram_data["telegram_id"])
        success = await telegram_service.send_otp(telegram_id, otp)
        
        if success:
            return {
                "message": "OTP sent to your Telegram",
                "delivery_method": "telegram"
            }
    
    # In production, you would send OTP via SMS here
    # For now, we'll return it in development mode
    if settings.DEBUG:
        return {
            "message": "OTP generated",
            "otp": otp,  # Remove in production!
            "delivery_method": "debug"
        }
    else:
        return {
            "message": "OTP sent to your phone",
            "delivery_method": "sms"
        }


@router.post("/verify-otp", response_model=AuthToken, status_code=200,
    summary="Verify OTP and get access token",
    description="""
    Verify the OTP code and receive a JWT access token for API authentication.
    
    ## Process:
    1. Submit phone number and 6-digit OTP code
    2. System validates the code (must be used within 5 minutes)
    3. If valid, returns JWT access token
    4. If shop doesn't exist, creates new shop account
    
    ## JWT Token:
    - Valid for 24 hours (configurable)
    - Contains shop_id and phone number
    - Use in Authorization header: `Bearer <token>`
    
    ## Multi-tenancy:
    - Each phone number = separate shop (tenant)
    - All API calls are scoped to authenticated shop
    - Shops are isolated from each other
    
    ## Response includes:
    - **access_token**: JWT token for API calls
    - **token_type**: Always "bearer"
    - **shop_id**: Unique shop identifier
    - **shop_name**: Display name of the shop
    """,
    responses={
        200: {
            "description": "Authentication successful",
            "content": {
                "application/json": {
                    "example": {
                        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        "token_type": "bearer",
                        "shop_id": 1,
                        "shop_name": "Цветочный магазин 4567"
                    }
                }
            }
        },
        400: {
            "description": "Invalid OTP",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Invalid or expired OTP code"
                    }
                }
            }
        }
    })
async def verify_otp(
    request: OTPVerifyRequest,
    db: Session = Depends(deps.get_db)
):
    """Verify OTP and return access token"""
    # Verify OTP
    result = otp_service.verify_otp(request.phone, request.otp_code)
    
    if not result["valid"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )
    
    # Get or create shop
    shop = crud_shop.get_by_phone(db, phone=request.phone)
    
    if not shop:
        # Create new shop
        from app.schemas.shop import ShopCreate
        
        shop_data = ShopCreate(
            name=f"Цветочный магазин {request.phone[-4:]}",
            phone=request.phone
        )
        shop = crud_shop.create(db, obj_in=shop_data)
    
    # Update telegram_id if available
    telegram_data = redis_service.get(f"telegram:{request.phone}")
    if telegram_data and telegram_data.get("telegram_id"):
        shop = crud_shop.update_telegram(
            db,
            db_obj=shop,
            telegram_id=str(telegram_data["telegram_id"]),
            telegram_username=telegram_data.get("telegram_username")
        )
    
    # Update last login
    shop = crud_shop.update_last_login(db, db_obj=shop)
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(shop.id), "phone": shop.phone},
        expires_delta=access_token_expires
    )
    
    return AuthToken(
        access_token=access_token,
        token_type="bearer",
        shop_id=shop.id,
        shop_name=shop.name
    )


@router.get("/me", response_model=Shop)
async def get_current_shop(
    current_shop: Shop = Depends(deps.get_current_shop)
):
    """Get current authenticated shop"""
    return current_shop


@router.post("/logout", status_code=204)
async def logout(
    current_shop: Shop = Depends(deps.get_current_shop)
):
    """Logout current shop"""
    # In a real application, you might want to:
    # - Blacklist the token
    # - Clear any server-side sessions
    # - Log the logout event
    
    # For now, we'll just return success
    # The client should remove the token
    return None


@router.get("/otp-status/{phone}")
async def get_otp_status(
    phone: str,
    current_shop: Shop = Depends(deps.get_current_shop)
):
    """Get OTP status (for debugging, admin only)"""
    # In production, add proper admin check
    status = otp_service.get_otp_status(phone)
    return status


@router.post("/create-test-shop", status_code=201)
async def create_test_shop(
    db: Session = Depends(deps.get_db)
):
    """Create test shop for development (only works in DEBUG mode)"""
    if not settings.DEBUG:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is only available in DEBUG mode"
        )
    
    # Check if test shop already exists
    existing_shop = crud_shop.get_by_phone(db, phone="+77011234567")
    
    if existing_shop:
        return {
            "message": "Test shop already exists",
            "shop": {
                "id": existing_shop.id,
                "name": existing_shop.name,
                "phone": existing_shop.phone,
                "email": existing_shop.email
            },
            "instructions": {
                "phone": "+77011234567",
                "otp": "Any 6-digit code works in DEBUG mode"
            }
        }
    
    # Create test shop
    from app.schemas.shop import ShopCreate
    
    test_shop_data = ShopCreate(
        name="Тестовый магазин цветов",
        phone="+77011234567",
        email="test@cvety.kz",
        telegram_id="123456789",
        telegram_username="test_flower_shop",
        address="ул. Тестовая, 123",
        city="Алматы",
        description="Тестовый магазин для разработки",
        business_hours={
            "mon": ["09:00", "18:00"],
            "tue": ["09:00", "18:00"],
            "wed": ["09:00", "18:00"],
            "thu": ["09:00", "18:00"],
            "fri": ["09:00", "18:00"],
            "sat": ["10:00", "16:00"],
            "sun": []
        },
        is_active=True,
        is_verified=True,
        plan="premium"
    )
    
    test_shop = crud_shop.create(db, obj_in=test_shop_data)
    
    return {
        "message": "Test shop created successfully",
        "shop": {
            "id": test_shop.id,
            "name": test_shop.name,
            "phone": test_shop.phone,
            "email": test_shop.email
        },
        "instructions": {
            "phone": "+77011234567",
            "otp": "Any 6-digit code works in DEBUG mode"
        }
    }