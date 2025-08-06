from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SQLEnum, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.db.session import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    manager = "manager"
    florist = "florist"
    courier = "courier"


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        UniqueConstraint('shop_id', 'phone', name='uq_users_shop_phone'),
    )

    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String, nullable=False, index=True)  # Removed unique=True
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True)
    role = Column(SQLEnum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True)
    telegram_id = Column(String, nullable=True, index=True)  # Telegram user ID for notifications
    
    # Permissions stored as JSON
    permissions = Column(JSON, default={
        "orders": False,
        "warehouse": False,
        "customers": False,
        "production": False,
        "settings": False,
        "users": False
    })
    
    # Shop association
    shop_id = Column(Integer, ForeignKey("shops.id"), nullable=False, default=1)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    shop = relationship("Shop", back_populates="users")
    assigned_orders = relationship("Order", foreign_keys="Order.assigned_florist_id", back_populates="assigned_florist")
    courier_orders = relationship("Order", foreign_keys="Order.courier_id", back_populates="courier")
    order_history_entries = relationship("OrderHistory", back_populates="user")
    comments = relationship("Comment", back_populates="user")
    uploaded_photos = relationship("OrderPhoto", back_populates="uploaded_by")