from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Enum as SQLEnum, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.db.session import Base


class OrderStatus(str, enum.Enum):
    new = "new"
    paid = "paid"
    assembled = "assembled"
    delivery = "delivery"
    self_pickup = "self_pickup"
    issue = "issue"


class DeliveryMethod(str, enum.Enum):
    delivery = "delivery"
    self_pickup = "self_pickup"


class IssueType(str, enum.Enum):
    wrong_address = "wrong_address"
    recipient_unavailable = "recipient_unavailable"
    quality_issue = "quality_issue"
    wrong_order = "wrong_order"
    delivery_delay = "delivery_delay"
    other = "other"


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Status
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.new, nullable=False)
    
    # Customer relationship
    customer_id = Column(Integer, ForeignKey("customers.id"))
    
    # Customer info (kept for backward compatibility and denormalization)
    customer_phone = Column(String, nullable=False, index=True)
    recipient_phone = Column(String)
    recipient_name = Column(String)
    
    # Delivery info
    address = Column(String)
    delivery_method = Column(SQLEnum(DeliveryMethod), nullable=False)
    delivery_window = Column(JSON)  # {"from": "2024-01-26T14:00:00", "to": "2024-01-26T16:00:00"}
    
    # Pricing
    flower_sum = Column(Float, nullable=False)
    delivery_fee = Column(Float, default=0)
    total = Column(Float, nullable=False)
    
    # Flags
    has_pre_delivery_photos = Column(Boolean, default=False)
    has_issue = Column(Boolean, default=False)
    issue_type = Column(SQLEnum(IssueType))
    issue_comment = Column(String)
    
    # Tracking
    tracking_token = Column(String, unique=True, index=True)
    
    # Relationships
    customer = relationship("Customer", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    
    @property
    def items_total(self):
        """Calculate total from order items"""
        return sum(item.total for item in self.items) if self.items else 0


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    # Snapshot of product info at order time
    product_name = Column(String, nullable=False)
    product_category = Column(String, nullable=False)
    
    # Pricing
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)  # Price per unit at order time
    total = Column(Float, nullable=False)
    
    # Warehouse tracking
    warehouse_item_id = Column(Integer, ForeignKey("warehouse_items.id"))
    is_reserved = Column(Boolean, default=False)
    is_written_off = Column(Boolean, default=False)
    
    # Timestamps
    reserved_at = Column(DateTime(timezone=True))
    written_off_at = Column(DateTime(timezone=True))
    
    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")
    warehouse_item = relationship("WarehouseItem")