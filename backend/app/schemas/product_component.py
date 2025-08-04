from typing import Optional
from pydantic import BaseModel, Field

from app.models.product_component import ComponentType


class ProductComponentBase(BaseModel):
    component_type: ComponentType
    name: str
    description: Optional[str] = None
    quantity: int = Field(ge=1, default=1)
    unit: str = "шт"
    unit_cost: float = Field(ge=0, default=0)
    unit_price: float = Field(ge=0, default=0)
    warehouse_item_id: Optional[int] = None
    material_id: Optional[int] = None


class ProductComponentCreate(ProductComponentBase):
    pass


class ProductComponentUpdate(BaseModel):
    component_type: Optional[ComponentType] = None
    name: Optional[str] = None
    description: Optional[str] = None
    quantity: Optional[int] = Field(ge=1)
    unit: Optional[str] = None
    unit_cost: Optional[float] = Field(ge=0)
    unit_price: Optional[float] = Field(ge=0)
    warehouse_item_id: Optional[int] = None
    material_id: Optional[int] = None


class ProductComponent(ProductComponentBase):
    id: int
    product_id: int
    
    class Config:
        from_attributes = True