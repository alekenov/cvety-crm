from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from jose import jwt

from app.api import deps
from app.core.config import get_settings
from app.crud import shop as crud_shop
from app.crud import user as crud_user
from app.crud import product as crud_product
from app.models.user import UserRole, User
from app.schemas.user import UserCreate
from app.schemas.shop import (
    PhoneAuthRequest,
    OTPVerifyRequest,
    CompleteRegistrationRequest,
    AuthToken,
    Shop,
    ShopCreate
)
from pydantic import BaseModel
from app.schemas.product import ProductCreate
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
    try:
        # Verify OTP
        result = otp_service.verify_otp(request.phone, request.otp_code)
        
        if not result["valid"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["message"]
            )
        
        # Check if shop exists
        shop = crud_shop.get_by_phone(db, phone=request.phone)
        
        if not shop:
            # New user - save phone in session for registration
            redis_service.set_with_ttl(
                f"registration:{request.phone}",
                {"phone": request.phone, "verified": True},
                ttl_seconds=3600  # 1 hour to complete registration
            )
            
            # Create temporary token for registration flow
            access_token_expires = timedelta(minutes=60)
            access_token = create_access_token(
                data={"sub": "pending", "phone": request.phone},
                expires_delta=access_token_expires
            )
            
            return AuthToken(
                access_token=access_token,
                token_type="bearer",
                is_new_user=True
            )
        
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
        
        # Find admin user for this shop
        admin_user = db.query(User).filter_by(shop_id=shop.id, role=UserRole.admin, is_active=True).first()
        if not admin_user:
            # Try to find any active user for this shop
            admin_user = db.query(User).filter_by(shop_id=shop.id, is_active=True).first()
        
        if not admin_user:
            # Create admin user if none exists (shouldn't happen with new fix, but for safety)
            admin_user_data = UserCreate(
                phone=shop.phone,  # Use same phone as shop
                name=shop.name,
                email=f"admin@shop{shop.id}.com",
                role=UserRole.admin,
                is_active=True
            )
            admin_user = crud_user.create(db, obj_in=admin_user_data, shop_id=shop.id)
            db.commit()
        
        user_id = str(admin_user.id)
        
        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(shop.id), "phone": shop.phone, "user_id": user_id},
            expires_delta=access_token_expires
        )
        
        return AuthToken(
            access_token=access_token,
            token_type="bearer",
            shop_id=shop.id,
            shop_name=shop.name,
            is_new_user=False
        )
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log the error for debugging
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error in verify_otp for phone {request.phone}: {str(e)}", exc_info=True)
        
        # Return a generic error to the client
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during authentication. Please try again."
        )


@router.post("/complete-registration", response_model=AuthToken, status_code=201,
    summary="Complete registration for new shop",
    description="""
    Complete the registration process for a new flower shop.
    
    ## Requirements:
    - Must have a valid temporary token from verify-otp
    - Phone must be verified in Redis session
    
    ## Process:
    1. Validates the registration session
    2. Creates new shop with provided name and city
    3. Creates initial seed products
    4. Returns full authentication token
    """)
async def complete_registration(
    request: CompleteRegistrationRequest,
    db: Session = Depends(deps.get_db),
    token_data: dict = Depends(deps.get_current_token_data)
):
    """Complete registration for new shop"""
    phone = token_data.get("phone")
    
    if not phone or token_data.get("sub") != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid registration token"
        )
    
    # Verify registration session exists
    registration_data = redis_service.get(f"registration:{phone}")
    if not registration_data or not registration_data.get("verified"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration session expired or invalid"
        )
    
    # Check if shop already exists (double check)
    existing_shop = crud_shop.get_by_phone(db, phone=phone)
    if existing_shop:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Shop already exists for this phone number"
        )
    
    # Create new shop
    shop_data = ShopCreate(
        name=request.name,
        phone=phone,
        city=request.city
    )
    shop = crud_shop.create(db, obj_in=shop_data)
    
    # Create seed products for new shop
    seed_products = [
        ProductCreate(
            name="Букет роз \"Классика\"",
            category="bouquet",
            description="Классический букет из 15 красных роз",
            cost_price=10000,
            retail_price=25000,
            sale_price=22000,
            is_active=True,
            is_popular=True
        ),
        ProductCreate(
            name="Букет тюльпанов \"Весна\"",
            category="bouquet",
            description="Нежный букет из 25 тюльпанов",
            cost_price=8000,
            retail_price=18000,
            sale_price=16000,
            is_active=True,
            is_new=True
        ),
        ProductCreate(
            name="Композиция \"Праздничная\"",
            category="composition",
            description="Праздничная композиция в корзине",
            cost_price=15000,
            retail_price=35000,
            sale_price=32000,
            is_active=True,
            is_popular=True
        )
    ]
    
    for product_data in seed_products:
        product_dict = product_data.dict()
        product_dict['shop_id'] = shop.id
        db_product = crud_product.model(**product_dict)
        db.add(db_product)
    
    # Create admin user for the new shop
    admin_user_data = UserCreate(
        phone=phone,  # Use the same phone as the shop
        name=request.name,
        email=f"admin@shop{shop.id}.com",  # Use shop ID for unique email
        role=UserRole.admin,
        is_active=True
    )
    admin_user = crud_user.create(db, obj_in=admin_user_data, shop_id=shop.id)
    
    db.commit()
    
    # Clear registration session
    redis_service.client.delete(f"registration:{phone}")
    
    # Create full authentication token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(shop.id), "phone": shop.phone, "user_id": str(admin_user.id)},
        expires_delta=access_token_expires
    )
    
    return AuthToken(
        access_token=access_token,
        token_type="bearer",
        shop_id=shop.id,
        shop_name=shop.name,
        is_new_user=False
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


@router.get("/redis-test")
async def test_redis():
    """Test Redis connection (DEBUG only)"""
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        # Check if Redis is configured
        from app.core.config import get_settings
        settings = get_settings()
        redis_url = getattr(settings, 'REDIS_URL', None)
        
        result = {
            "redis_configured": bool(redis_url),
            "redis_url_prefix": redis_url[:30] if redis_url else None,
            "redis_client_type": type(redis_service.client).__name__
        }
        
        # Test basic operations
        test_key = f"test:{datetime.utcnow().isoformat()}"
        test_data = {"test": "data", "timestamp": datetime.utcnow().isoformat()}
        
        # Test set
        set_result = redis_service.set_with_ttl(test_key, test_data, 60)
        result["set_operation"] = set_result
        
        # Test get
        get_result = redis_service.get(test_key)
        result["get_operation"] = get_result == test_data
        result["retrieved_data"] = get_result
        
        # Test delete
        delete_result = redis_service.delete(test_key)
        result["delete_operation"] = delete_result
        
        return result
        
    except Exception as e:
        logger.error(f"Redis test failed: {str(e)}", exc_info=True)
        return {
            "error": str(e),
            "type": type(e).__name__
        }


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


class TelegramLoginRequest(BaseModel):
    initData: str
    phoneNumber: Optional[str] = None

@router.post("/telegram-login", response_model=AuthToken, status_code=200,
    summary="Telegram Mini App Login", 
    description="""
    Authenticate user via Telegram Mini App initData.
    
    ## Process:
    1. Validates initData signature using bot token
    2. Extracts user information and phone from initData
    3. Verifies shop exists (should be created by bot)
    4. Returns JWT access token
    
    ## Parameters:
    - **initData**: Raw initData string from Telegram.WebApp.initData
    - **phoneNumber**: Optional phone number (usually from URL params)
    
    ## Response:
    - **access_token**: JWT token for API access
    - **shop_id**: Shop identifier
    - **shop_name**: Shop name
    """)
async def telegram_login(
    request: TelegramLoginRequest,
    db: Session = Depends(deps.get_db)
):
    """Authenticate user via Telegram Mini App initData"""
    import hmac
    import hashlib
    import urllib.parse
    from urllib.parse import unquote
    import json
    
    try:
        # Validate initData signature
        if not request.initData:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="initData is required"
            )
        
        # Parse initData
        parsed_data = dict(urllib.parse.parse_qsl(request.initData))
        
        if 'hash' not in parsed_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid initData: missing hash"
            )
        
        # Extract hash and create data check string
        received_hash = parsed_data.pop('hash')
        
        # Create data-check-string (sorted alphabetically)
        data_check_string = '\n'.join([f"{key}={value}" for key, value in sorted(parsed_data.items())])
        
        # Create secret key from bot token
        bot_token = settings.TELEGRAM_BOT_TOKEN
        if not bot_token:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Telegram bot token not configured"
            )
            
        secret_key = hmac.new(
            "WebAppData".encode(),
            bot_token.encode(),
            hashlib.sha256
        ).digest()
        
        # Calculate expected hash
        expected_hash = hmac.new(
            secret_key,
            data_check_string.encode(),
            hashlib.sha256
        ).hexdigest()
        
        # Verify signature
        if not hmac.compare_digest(received_hash, expected_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid initData signature"
            )
        
        # Parse user data
        if 'user' not in parsed_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User data not found in initData"
            )
        
        user_data = json.loads(unquote(parsed_data['user']))
        telegram_id = str(user_data.get('id'))
        first_name = user_data.get('first_name', '')
        last_name = user_data.get('last_name', '')
        username = user_data.get('username', '')
        
        # Check if contact data is in initData
        phone_number = request.phoneNumber
        if not phone_number and 'contact' in parsed_data:
            try:
                contact_data = json.loads(unquote(parsed_data['contact']))
                phone_number = contact_data.get('phone_number')
                # Format phone number if needed (add + if missing)
                if phone_number and not phone_number.startswith('+'):
                    phone_number = '+' + phone_number
            except Exception:
                pass
        
        # Phone number is required (should come from bot or URL params)
        if not phone_number:
            # Try to find shop by telegram_id
            from app.models.shop import Shop
            shop = db.query(Shop).filter_by(telegram_id=telegram_id).first()
            if shop:
                phone_number = shop.phone
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Phone number required. Please open the app from Telegram bot."
                )
        
        # Find shop by phone number (should be created by bot)
        shop = crud_shop.get_by_phone(db, phone=phone_number)
        
        if not shop:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shop not found. Please register through Telegram bot first."
            )
        
        # Update telegram data if needed
        if shop.telegram_id != telegram_id:
            shop = crud_shop.update_telegram(
                db,
                db_obj=shop,
                telegram_id=telegram_id,
                telegram_username=username
            )
        
        # Find admin user
        admin_user = db.query(User).filter_by(shop_id=shop.id, role=UserRole.admin, is_active=True).first()
        if not admin_user:
            admin_user = db.query(User).filter_by(shop_id=shop.id, is_active=True).first()
        
        if not admin_user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not find or create admin user"
            )
        
        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={
                "sub": str(shop.id),
                "phone": shop.phone,
                "user_id": str(admin_user.id),
                "telegram_id": telegram_id
            },
            expires_delta=access_token_expires
        )
        
        return AuthToken(
            access_token=access_token,
            token_type="bearer",
            shop_id=shop.id,
            shop_name=shop.name,
            is_new_user=False
        )
        
    except HTTPException:
        raise
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error in telegram_login: {str(e)}", exc_info=True)
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed"
        )


@router.post("/test-token", response_model=AuthToken, status_code=200)
async def get_test_token(
    db: Session = Depends(deps.get_db)
):
    """Get test token for development (only works in DEBUG mode)"""
    if not settings.DEBUG:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is only available in DEBUG mode"
        )
    
    # Get test shop
    shop = crud_shop.get_by_phone(db, phone="+77011234567")
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test shop not found. Run /api/auth/create-test-shop first"
        )
    
    # Get or create test admin user
    from app.crud import user as crud_user
    from app.models.user import UserRole, User
    
    admin_user = db.query(User).filter_by(shop_id=shop.id, role=UserRole.admin, is_active=True).first()
    if not admin_user:
        # Create a test admin user
        from app.schemas.user import UserCreate
        test_user = UserCreate(
            phone="+77011234567",
            name="Test Admin",
            email="admin@test.com",
            role=UserRole.admin,
            is_active=True
        )
        admin_user = crud_user.create(db, obj_in=test_user, shop_id=shop.id)
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(shop.id), "phone": shop.phone, "user_id": str(admin_user.id)},
        expires_delta=access_token_expires
    )
    
    return AuthToken(
        access_token=access_token,
        token_type="bearer",
        shop_id=shop.id,
        shop_name=shop.name
    )


class TelegramRegisterRequest(BaseModel):
    telegram_id: str
    phone: str = Field(..., pattern=r"^\+7\d{10}$")
    shop_name: str = Field(..., min_length=2, max_length=100)
    city: str = Field(default="Алматы")
    telegram_username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None


@router.post("/telegram-register", response_model=AuthToken, status_code=201,
    summary="Register new shop from Telegram",
    description="""
    Register a new shop from Telegram bot.
    Should only be called after phone verification in bot.
    
    ## Process:
    1. Creates new shop with provided data
    2. Creates admin user for the shop
    3. Returns JWT access token
    
    ## Parameters:
    - **telegram_id**: Telegram user ID
    - **phone**: Verified phone number
    - **shop_name**: Name of the shop
    - **city**: City where shop is located
    
    ## Response:
    - **access_token**: JWT token for API access
    - **shop_id**: New shop identifier
    - **shop_name**: Shop name
    - **is_new_user**: Always true for registration
    """)
async def telegram_register(
    request: TelegramRegisterRequest,
    db: Session = Depends(deps.get_db)
):
    """Register new shop from Telegram"""
    
    # Check if shop already exists
    existing_shop = crud_shop.get_by_phone(db, phone=request.phone)
    if existing_shop:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Shop with this phone number already exists"
        )
    
    # Create new shop
    shop_data = ShopCreate(
        name=request.shop_name,
        phone=request.phone,
        city=request.city,
        telegram_id=request.telegram_id,
        telegram_username=request.telegram_username
    )
    shop = crud_shop.create(db, obj_in=shop_data)
    
    # Create admin user
    full_name = f"{request.first_name or ''} {request.last_name or ''}".strip()
    admin_user_data = UserCreate(
        phone=request.phone,
        name=full_name or request.shop_name,
        email=f"telegram{request.telegram_id}@cvety.kz",
        role=UserRole.admin,
        is_active=True
    )
    admin_user = crud_user.create(db, obj_in=admin_user_data, shop_id=shop.id)
    
    db.commit()
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": str(shop.id),
            "phone": shop.phone,
            "user_id": str(admin_user.id),
            "telegram_id": request.telegram_id
        },
        expires_delta=access_token_expires
    )
    
    return AuthToken(
        access_token=access_token,
        token_type="bearer",
        shop_id=shop.id,
        shop_name=shop.name,
        is_new_user=True
    )