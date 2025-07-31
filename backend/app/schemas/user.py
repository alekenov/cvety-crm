from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr

from app.models.user import UserRole


class UserBase(BaseModel):
    phone: str
    name: str
    email: Optional[EmailStr] = None
    role: UserRole


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    phone: Optional[str] = None
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class UserInDBBase(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class User(UserInDBBase):
    pass


class UserInDB(UserInDBBase):
    pass