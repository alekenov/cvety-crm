from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

from app.models.order import OrderStatus, DeliveryMethod


class TrackingResponse(BaseModel):
    order_number: str
    status: OrderStatus
    created_at: datetime
    updated_at: datetime
    delivery_method: DeliveryMethod
    delivery_window: Optional[Dict[str, Any]] = None
    delivery_fee: float
    total: float
    recipient_name: Optional[str] = None
    recipient_phone: Optional[str] = None
    address: Optional[str] = None
    items: List[Dict[str, Any]] = []
    tracking_token: str
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }