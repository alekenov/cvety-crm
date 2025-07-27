from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, validator


class WarehouseItemBase(BaseModel):
    sku: str
    batch_code: str
    variety: str
    height_cm: int = Field(gt=0)
    farm: str
    supplier: str
    delivery_date: datetime
    currency: str = Field(pattern="^(USD|EUR|KZT)$")
    rate: float = Field(gt=0)
    cost: float = Field(ge=0)
    markup_pct: float = Field(default=100.0, ge=0)
    qty: int = Field(ge=0)
    price: Optional[float] = None
    
    @validator('price', always=True)
    def calculate_price(cls, v, values):
        if v is None and all(k in values for k in ['cost', 'rate', 'markup_pct']):
            # If price not provided, calculate recommended price
            base_price = values['cost'] * values['rate']
            return base_price * (1 + values['markup_pct'] / 100)
        return v


class WarehouseItemCreate(WarehouseItemBase):
    pass


class WarehouseItemUpdate(BaseModel):
    variety: Optional[str] = None
    height_cm: Optional[int] = Field(None, gt=0)
    farm: Optional[str] = None
    supplier: Optional[str] = None
    price: Optional[float] = Field(None, ge=0)
    qty: Optional[int] = Field(None, ge=0)
    reserved_qty: Optional[int] = Field(None, ge=0)
    on_showcase: Optional[bool] = None
    to_write_off: Optional[bool] = None
    hidden: Optional[bool] = None
    updated_by: Optional[str] = None


class WarehouseItemInDB(WarehouseItemBase):
    id: int
    reserved_qty: int = 0
    recommended_price: float
    on_showcase: bool = False
    to_write_off: bool = False
    hidden: bool = False
    created_at: datetime
    updated_at: datetime
    updated_by: Optional[str] = None
    
    class Config:
        from_attributes = True


class WarehouseItemResponse(WarehouseItemInDB):
    available_qty: int = Field(description="Доступное количество (qty - reserved_qty)")
    is_critical_stock: bool = Field(description="Критически низкий запас")
    
    @validator('available_qty', always=True)
    def calc_available(cls, v, values):
        return values.get('qty', 0) - values.get('reserved_qty', 0)
    
    @validator('is_critical_stock', always=True)
    def check_critical(cls, v, values):
        available = values.get('qty', 0) - values.get('reserved_qty', 0)
        return available < 15 and not values.get('to_write_off', False)


class WarehouseItemList(BaseModel):
    items: List[WarehouseItemResponse]
    total: int


# Delivery schemas
class DeliveryPositionBase(BaseModel):
    variety: str
    height_cm: int = Field(gt=0)
    qty: int = Field(gt=0)
    cost_per_stem: float = Field(ge=0)


class DeliveryPositionCreate(DeliveryPositionBase):
    pass


class DeliveryPositionInDB(DeliveryPositionBase):
    id: int
    delivery_id: int
    total_cost: float
    
    class Config:
        from_attributes = True


class DeliveryBase(BaseModel):
    supplier: str
    farm: str
    delivery_date: datetime
    currency: str = Field(pattern="^(USD|EUR|KZT)$")
    rate: float = Field(gt=0)
    comment: Optional[str] = None


class DeliveryCreate(DeliveryBase):
    positions: List[DeliveryPositionCreate]
    
    @validator('positions')
    def validate_positions(cls, v):
        if not v:
            raise ValueError("Поставка должна содержать хотя бы одну позицию")
        return v


class DeliveryUpdate(BaseModel):
    invoice_number: Optional[str] = None
    supplier: Optional[str] = None
    delivery_date: Optional[datetime] = None
    comment: Optional[str] = None


class DeliveryInDB(DeliveryBase):
    id: int
    cost_total: float
    created_at: datetime
    created_by: Optional[str] = None
    positions: List[DeliveryPositionInDB] = []
    
    class Config:
        from_attributes = True


class DeliveryResponse(DeliveryInDB):
    pass


class DeliveryList(BaseModel):
    items: List[DeliveryResponse]
    total: int


# Filter params
class WarehouseFilterParams(BaseModel):
    variety: Optional[str] = None
    height_cm: Optional[int] = None
    farm: Optional[str] = None
    supplier: Optional[str] = None
    on_showcase: Optional[bool] = None
    to_write_off: Optional[bool] = None
    search: Optional[str] = None
    page: int = Field(1, ge=1)
    limit: int = Field(20, le=100)


# Stats
class WarehouseStats(BaseModel):
    total_items: int
    total_value: float
    critical_items: int
    showcase_items: int
    writeoff_items: int
    by_variety: dict[str, int]
    by_supplier: dict[str, int]