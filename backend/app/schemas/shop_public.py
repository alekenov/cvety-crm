"""Pydantic schemas for public shop endpoints"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class ShopPublicInfo(BaseModel):
    """Public shop information for storefront"""
    id: int
    name: str
    description: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    rating: float = Field(default=4.5, ge=0, le=5)
    reviews_count: int = Field(default=0, ge=0)
    delivery_price: int = Field(default=2000, ge=0)
    delivery_time: str = Field(default="2-4 часа")
    pickup_address: Optional[str] = None
    working_hours: Optional[str] = None
    instagram: Optional[str] = None
    whatsapp: Optional[str] = None
    
    class Config:
        from_attributes = True


class ProductAPI(BaseModel):
    """Product model for API responses"""
    id: int
    name: str
    description: Optional[str] = None
    price: int = Field(ge=0)
    category: Optional[str] = None
    image_url: Optional[str] = None
    in_stock: bool = True
    shop_id: int
    
    class Config:
        from_attributes = True


class ShopProductsResponse(BaseModel):
    """Response model for shop products list"""
    products: List[ProductAPI]
    total: int
    shop_id: int


class CategoryInfo(BaseModel):
    """Category information with product count"""
    name: str
    count: int
    display_name: str


class ShopCategoriesResponse(BaseModel):
    """Response model for shop categories"""
    categories: List[CategoryInfo]
    total: int


class OrderItemCreate(BaseModel):
    """Order item for creating order"""
    product_id: int
    quantity: int = Field(gt=0)
    price: int = Field(ge=0)
    product_name: Optional[str] = None


class ShopOrderCreate(BaseModel):
    """Create order request from storefront"""
    customer_name: str = Field(min_length=1, max_length=100)
    customer_phone: str = Field(min_length=10, max_length=20)
    delivery_type: str = Field(pattern="^(delivery|pickup)$")
    delivery_address: Optional[str] = None
    delivery_date: Optional[str] = None
    delivery_time: Optional[str] = None
    recipient_name: Optional[str] = None
    recipient_phone: Optional[str] = None
    card_text: Optional[str] = Field(default=None, max_length=500)
    payment_method: str = Field(pattern="^(cash|card)$")
    special_requests: Optional[str] = Field(default=None, max_length=500)
    items: List[OrderItemCreate]
    total_amount: int = Field(ge=0)


class ShopOrderResponse(BaseModel):
    """Response after creating order"""
    id: int
    tracking_token: str
    status: str
    customer_name: str
    customer_phone: str
    total_amount: int
    created_at: str
    message: str = "Заказ успешно создан"
    
    class Config:
        from_attributes = True