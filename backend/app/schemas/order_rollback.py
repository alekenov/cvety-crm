from pydantic import BaseModel
from app.models.order import OrderStatus


class OrderStatusRollback(BaseModel):
    target_status: OrderStatus
    reason: str