from pydantic import BaseModel, Field
from typing import Optional, Dict, List
from datetime import datetime


class ShopBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    phone: str = Field(..., pattern=r"^\+7\d{10}$")
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = "Алматы"
    description: Optional[str] = None
    business_hours: Optional[Dict[str, List[str]]] = None
    currency: Optional[str] = "KZT"
    timezone: Optional[str] = "Asia/Almaty"
    language: Optional[str] = "ru"


class ShopCreate(ShopBase):
    pass


class ShopUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    description: Optional[str] = None
    business_hours: Optional[Dict[str, List[str]]] = None
    currency: Optional[str] = None
    timezone: Optional[str] = None
    language: Optional[str] = None


class Shop(ShopBase):
    id: int
    telegram_id: Optional[str] = None
    telegram_username: Optional[str] = None
    is_active: bool = True
    is_verified: bool = False
    plan: str = "basic"
    trial_ends_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    last_login_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class ShopList(BaseModel):
    items: List[Shop]
    total: int


# Authentication schemas
class PhoneAuthRequest(BaseModel):
    phone: str = Field(..., pattern=r"^\+7\d{10}$", description="Phone in format +7XXXXXXXXXX")


class OTPVerifyRequest(BaseModel):
    phone: str = Field(..., pattern=r"^\+7\d{10}$")
    otp_code: str = Field(..., pattern=r"^\d{6}$", description="6-digit OTP code")


class AuthToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
    shop_id: int
    shop_name: str


class TelegramAuthStart(BaseModel):
    telegram_id: str
    telegram_username: Optional[str] = None
    phone: str = Field(..., pattern=r"^\+7\d{10}$")