from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field

from app.models.product import ProductCategory


class ProductImageBase(BaseModel):
    image_url: str
    is_primary: bool = False
    sort_order: int = 0


class ProductImageCreate(ProductImageBase):
    pass


class ProductImageUpdate(ProductImageBase):
    image_url: Optional[str] = None
    is_primary: Optional[bool] = None
    sort_order: Optional[int] = None


class ProductImage(ProductImageBase):
    id: int
    product_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    name: str
    category: ProductCategory
    description: Optional[str] = None
    image_url: Optional[str] = None
    cost_price: float = Field(gt=0)
    retail_price: float = Field(gt=0)
    sale_price: Optional[float] = Field(default=None, gt=0)
    is_active: bool = True
    is_popular: bool = False
    is_new: bool = False


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[ProductCategory] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    cost_price: Optional[float] = Field(default=None, gt=0)
    retail_price: Optional[float] = Field(default=None, gt=0)
    sale_price: Optional[float] = Field(default=None, gt=0)
    is_active: Optional[bool] = None
    is_popular: Optional[bool] = None
    is_new: Optional[bool] = None


class Product(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime
    images: List[ProductImage] = []
    
    # Computed properties
    current_price: float
    discount_percentage: int

    class Config:
        from_attributes = True


class ProductWithStats(Product):
    total_orders: int = 0
    total_revenue: float = 0
    
    class Config:
        from_attributes = True