from typing import Optional
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, Field


class DecorativeMaterialBase(BaseModel):
    name: str
    category: Optional[str] = None
    price: Decimal = Field(..., ge=0)
    unit: str = "шт"
    is_active: bool = True
    in_stock: bool = True


class DecorativeMaterialCreate(DecorativeMaterialBase):
    pass


class DecorativeMaterialUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[Decimal] = Field(None, ge=0)
    unit: Optional[str] = None
    is_active: Optional[bool] = None
    in_stock: Optional[bool] = None


class DecorativeMaterialResponse(DecorativeMaterialBase):
    id: int
    shop_id: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class DecorativeMaterialList(BaseModel):
    items: list[DecorativeMaterialResponse]
    total: int


class CalculatorSettingsBase(BaseModel):
    default_labor_cost: Decimal = Field(default=2000, max_digits=10, decimal_places=2)
    min_margin_percent: Decimal = Field(default=30, max_digits=5, decimal_places=2)
    recommended_margin_percent: Decimal = Field(default=50, max_digits=5, decimal_places=2)
    premium_margin_percent: Decimal = Field(default=100, max_digits=5, decimal_places=2)


class CalculatorSettingsCreate(CalculatorSettingsBase):
    pass


class CalculatorSettingsUpdate(BaseModel):
    default_labor_cost: Optional[Decimal] = Field(None, max_digits=10, decimal_places=2)
    min_margin_percent: Optional[Decimal] = Field(None, max_digits=5, decimal_places=2)
    recommended_margin_percent: Optional[Decimal] = Field(None, max_digits=5, decimal_places=2)
    premium_margin_percent: Optional[Decimal] = Field(None, max_digits=5, decimal_places=2)


class CalculatorSettingsResponse(CalculatorSettingsBase):
    id: int
    shop_id: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True