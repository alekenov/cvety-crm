from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import Optional, Dict, List
from datetime import datetime
from app.models.user import UserRole


class UserBase(BaseModel):
    phone: str = Field(..., pattern=r'^\+7\d{10}$', description="Phone in format +7XXXXXXXXXX")
    name: str = Field(..., min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    role: UserRole
    is_active: bool = True
    telegram_id: Optional[str] = None


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    telegram_id: Optional[str] = None


class UserPermissionsUpdate(BaseModel):
    permissions: Dict[str, bool] = Field(
        ..., 
        description="Dictionary of permissions",
        example={
            "orders": True,
            "warehouse": True,
            "customers": False,
            "production": True,
            "settings": False
        }
    )


class UserInDBBase(UserBase):
    id: int
    shop_id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class User(UserInDBBase):
    permissions: Dict[str, bool] = Field(
        default_factory=lambda: {
            "orders": False,
            "warehouse": False,
            "customers": False,
            "production": False,
            "settings": False,
            "users": False
        }
    )


class UserInDB(UserInDBBase):
    pass


class UserList(BaseModel):
    items: List[User]
    total: int