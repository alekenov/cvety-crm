from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


# FlowerCategory schemas
class FlowerCategoryBase(BaseModel):
    name: str
    markup_percentage: float = Field(ge=0, le=500)
    keywords: Optional[str] = None


class FlowerCategoryCreate(FlowerCategoryBase):
    pass


class FlowerCategoryUpdate(BaseModel):
    name: Optional[str] = None
    markup_percentage: Optional[float] = Field(None, ge=0, le=500)
    keywords: Optional[str] = None


class FlowerCategory(FlowerCategoryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# SupplyItem schemas
class SupplyItemBase(BaseModel):
    flower_name: str
    height_cm: int = Field(ge=10, le=200)
    purchase_price: float = Field(gt=0)
    quantity: int = Field(gt=0)
    category_id: Optional[int] = None


class SupplyItemCreate(SupplyItemBase):
    pass


class SupplyItemImport(BaseModel):
    """Schema for parsing import text line"""
    flower_name: str
    height_cm: int
    purchase_price: float
    quantity: int
    # Auto-detected or manually set
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    retail_price: Optional[float] = None


class SupplyItem(SupplyItemBase):
    id: int
    supply_id: int
    remaining_quantity: int
    retail_price: float
    total_cost: float
    created_at: datetime
    category: Optional[FlowerCategory] = None

    class Config:
        from_attributes = True


# Supply schemas
class SupplyBase(BaseModel):
    supplier: str  # Made required
    farm: Optional[str] = None
    delivery_date: Optional[datetime] = None
    currency: str = "KZT"
    rate: float = 1.0
    notes: Optional[str] = None
    comment: Optional[str] = None


class SupplyCreate(SupplyBase):
    items: List[SupplyItemCreate]


class SupplyImportPreview(BaseModel):
    """Preview of parsed import data"""
    supplier: Optional[str] = None
    items: List[SupplyItemImport]
    total_cost: float
    errors: List[str] = []


class Supply(SupplyBase):
    id: int
    status: str
    total_cost: float
    delivery_date: datetime  # Always set, defaults to created_at
    created_at: datetime
    created_by: Optional[str] = None
    items: List[SupplyItem] = []

    class Config:
        from_attributes = True


# API Response schemas
class SupplyListResponse(BaseModel):
    items: List[Supply]
    total: int