from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class DeliveryZone(BaseModel):
    name: str
    price: int = Field(ge=0)


class WorkingHours(BaseModel):
    from_time: str = Field(alias="from", pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")
    to_time: str = Field(alias="to", pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")
    
    class Config:
        populate_by_name = True


class CompanySettingsBase(BaseModel):
    name: str
    address: str
    email: str
    phones: List[str]
    working_hours: WorkingHours
    delivery_zones: List[DeliveryZone]


class CompanySettingsCreate(CompanySettingsBase):
    pass


class CompanySettingsUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None
    phones: Optional[List[str]] = None
    working_hours: Optional[WorkingHours] = None
    delivery_zones: Optional[List[DeliveryZone]] = None


class CompanySettings(CompanySettingsBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True