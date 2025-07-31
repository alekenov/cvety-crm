from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.db.session import Base


class OrderEventType(str, enum.Enum):
    created = "created"
    status_changed = "status_changed"
    comment_added = "comment_added"
    issue_reported = "issue_reported"
    florist_assigned = "florist_assigned"
    courier_assigned = "courier_assigned"
    payment_received = "payment_received"
    edited = "edited"


class OrderHistory(Base):
    __tablename__ = "order_history"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    event_type = Column(SQLEnum(OrderEventType), nullable=False)
    
    # Event details
    old_status = Column(String)
    new_status = Column(String)
    comment = Column(String)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    order = relationship("Order", back_populates="history")
    user = relationship("User", back_populates="order_history_entries")