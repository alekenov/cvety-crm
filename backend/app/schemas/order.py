from datetime import datetime
from typing import Optional, Dict, List
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


# OrderItem schemas
class OrderItemBase(BaseModel):
    product_id: int
    quantity: int
    price: float
    total: float
    product_name: str
    product_category: str


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int


class OrderItemUpdate(BaseModel):
    quantity: Optional[int] = None


class OrderItemInDB(OrderItemBase):
    id: int
    order_id: int
    
    class Config:
        from_attributes = True


class OrderItemResponse(OrderItemInDB):
    pass


# Extended Order schemas with items
class OrderCreateWithItems(BaseModel):
    customer_phone: str
    recipient_phone: Optional[str] = None
    recipient_name: Optional[str] = None
    address: Optional[str] = None
    delivery_method: DeliveryMethod
    delivery_fee: float = 0
    items: List[OrderItemCreate]
    delivery_window: Optional[DeliveryWindow] = None


class OrderResponseWithItems(OrderResponse):
    items: List[OrderItemResponse] = []
    customer_id: Optional[int] = None
    customer: Optional[dict] = None
    assigned_florist: Optional[dict] = None
    courier: Optional[dict] = None


class OrderDetailResponse(OrderResponseWithItems):
    """Extended order response with all related data for detail view"""
    history: List[dict] = []