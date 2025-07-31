from typing import Optional
from pydantic import BaseModel, Field


class ProductIngredientBase(BaseModel):
    warehouse_item_id: int
    quantity: int = Field(ge=1, default=1)
    notes: Optional[str] = None


class ProductIngredientCreate(ProductIngredientBase):
    pass


class ProductIngredientUpdate(BaseModel):
    quantity: Optional[int] = Field(ge=1)
    notes: Optional[str] = None


class ProductIngredient(ProductIngredientBase):
    id: int
    product_id: int
    
    class Config:
        from_attributes = True


class ProductIngredientWithDetails(ProductIngredient):
    """Ingredient with warehouse item details"""
    variety: str
    height_cm: int
    supplier: str
    farm: str
    available_qty: int
    price: float
    
    class Config:
        from_attributes = True