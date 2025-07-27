from datetime import datetime
from typing import Optional, Dict
from pydantic import BaseModel

from app.models.order import OrderStatus, DeliveryMethod, IssueType


class DeliveryWindow(BaseModel):
    from_time: datetime = None
    to_time: datetime = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "from_time": "2024-01-26T14:00:00",
                "to_time": "2024-01-26T16:00:00"
            }
        }


class OrderBase(BaseModel):
    customer_phone: str
    recipient_phone: Optional[str] = None
    recipient_name: Optional[str] = None
    address: Optional[str] = None
    delivery_method: DeliveryMethod
    flower_sum: float
    delivery_fee: float = 0
    total: float


class OrderCreate(OrderBase):
    delivery_window: Optional[DeliveryWindow] = None


class OrderUpdate(BaseModel):
    customer_phone: Optional[str] = None
    recipient_phone: Optional[str] = None
    recipient_name: Optional[str] = None
    address: Optional[str] = None
    delivery_method: Optional[DeliveryMethod] = None
    flower_sum: Optional[float] = None
    delivery_fee: Optional[float] = None
    total: Optional[float] = None


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderIssueUpdate(BaseModel):
    issue_type: IssueType
    comment: str


class OrderInDB(OrderBase):
    id: int
    created_at: datetime
    updated_at: datetime
    status: OrderStatus
    has_pre_delivery_photos: bool = False
    has_issue: bool = False
    issue_type: Optional[IssueType] = None
    issue_comment: Optional[str] = None
    tracking_token: str
    delivery_window: Optional[Dict] = None
    
    class Config:
        from_attributes = True


class OrderResponse(OrderInDB):
    # Transform delivery_window for frontend compatibility
    delivery_window: Optional[Dict] = None
    
    def __init__(self, **data):
        # Transform delivery_window from JSON to expected format
        if data.get('delivery_window'):
            window = data['delivery_window']
            data['delivery_window'] = {
                'from': window.get('from_time', window.get('from')),
                'to': window.get('to_time', window.get('to'))
            }
        super().__init__(**data)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class OrderList(BaseModel):
    items: list[OrderResponse]
    total: int