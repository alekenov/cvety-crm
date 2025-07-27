from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel

from app.models.order import OrderStatus, DeliveryMethod


class TrackingResponse(BaseModel):
    status: OrderStatus
    updated_at: datetime
    photos: List[str] = []
    delivery_window: Optional[Dict] = None
    delivery_method: DeliveryMethod
    address: str
    tracking_token: str
    views_count: Optional[int] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }