from datetime import datetime
from typing import Optional, Dict, List
from pydantic import BaseModel

from app.models.order import OrderStatus, DeliveryMethod, IssueType, PaymentMethod


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
    address_needs_clarification: bool = False
    delivery_method: DeliveryMethod
    flower_sum: float
    delivery_fee: float = 0
    total: float


class OrderCreate(OrderBase):
    delivery_window: Optional[DeliveryWindow] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "customer_phone": "+77011234567",
                "recipient_phone": "+77017654321",
                "recipient_name": "Айгуль Касымова",
                "address": "г. Алматы, пр. Достык 89, кв. 45",
                "delivery_method": "delivery",
                "delivery_window": {
                    "from_time": "2024-12-26T14:00:00",
                    "to_time": "2024-12-26T16:00:00"
                },
                "flower_sum": 25000.0,
                "delivery_fee": 2000.0,
                "total": 27000.0
            }
        }


class OrderUpdate(BaseModel):
    customer_phone: Optional[str] = None
    recipient_phone: Optional[str] = None
    recipient_name: Optional[str] = None
    address: Optional[str] = None
    address_needs_clarification: Optional[bool] = None
    delivery_method: Optional[DeliveryMethod] = None
    delivery_window: Optional[Dict] = None
    flower_sum: Optional[float] = None
    delivery_fee: Optional[float] = None
    total: Optional[float] = None
    payment_method: Optional[PaymentMethod] = None
    payment_date: Optional[datetime] = None


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
    payment_method: Optional[PaymentMethod] = None
    payment_date: Optional[datetime] = None
    card_text: Optional[str] = None
    delivery_time_text: Optional[str] = None
    source: Optional[str] = None
    
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
    price: Optional[float] = None


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


# Public order creation schema for storefront
class PublicOrderCreate(BaseModel):
    customer_phone: str
    recipient_phone: Optional[str] = None
    recipient_name: Optional[str] = None
    address: Optional[str] = None
    delivery_method: DeliveryMethod
    delivery_fee: float = 0
    items: List[OrderItemCreate]
    delivery_window: Optional[DeliveryWindow] = None
    card_text: Optional[str] = None
    delivery_time_text: Optional[str] = None
    shop_id: int


class OrderResponseWithItems(OrderResponse):
    items: List[OrderItemResponse] = []
    customer_id: Optional[int] = None
    customer: Optional[dict] = None
    assigned_florist: Optional[dict] = None
    courier: Optional[dict] = None


class PublicOrderResponse(OrderResponse):
    items: List[OrderItemResponse] = []


class OrderDetailResponse(OrderResponseWithItems):
    """Extended order response with all related data for detail view"""
    history: List[dict] = []