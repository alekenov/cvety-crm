from datetime import datetime
from typing import Optional
from pydantic import BaseModel

from app.models.order_photo import PhotoType, CustomerFeedback


class OrderPhotoBase(BaseModel):
    photo_url: str
    photo_type: PhotoType
    description: Optional[str] = None


class OrderPhotoCreate(OrderPhotoBase):
    uploaded_by_user_id: int


class OrderPhoto(OrderPhotoBase):
    id: int
    order_id: int
    uploaded_by_user_id: int
    customer_feedback: Optional[CustomerFeedback] = None
    feedback_comment: Optional[str] = None
    feedback_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OrderPhotoPublic(BaseModel):
    """Public view of order photo for customers"""
    id: int
    photo_url: str
    photo_type: PhotoType
    description: Optional[str] = None
    customer_feedback: Optional[CustomerFeedback] = None
    feedback_comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CustomerFeedbackCreate(BaseModel):
    photo_id: int
    feedback: CustomerFeedback
    comment: Optional[str] = None


class CustomerFeedbackResponse(BaseModel):
    success: bool
    message: str