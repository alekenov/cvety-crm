from typing import Optional
from datetime import datetime
from pydantic import BaseModel

from app.models.order_history import OrderEventType


class OrderHistoryBase(BaseModel):
    order_id: int
    user_id: Optional[int] = None
    event_type: OrderEventType
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    comment: Optional[str] = None


class OrderHistoryCreate(OrderHistoryBase):
    pass


class OrderHistoryUpdate(BaseModel):
    comment: Optional[str] = None


class OrderHistoryInDBBase(OrderHistoryBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class OrderHistory(OrderHistoryInDBBase):
    pass


class OrderHistoryWithUser(OrderHistoryInDBBase):
    user_name: Optional[str] = None
    
    @classmethod
    def from_orm_with_user(cls, history: OrderHistoryInDBBase):
        data = history.dict()
        if history.user:
            data['user_name'] = history.user.name
        return cls(**data)