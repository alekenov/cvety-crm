from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, JSON, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.db.session import Base


class MovementType(str, enum.Enum):
    """Types of warehouse movements"""
    IN = "in"           # Incoming stock (deliveries, returns)
    OUT = "out"         # Outgoing stock (sales, transfers)
    ADJUSTMENT = "adjustment"  # Manual adjustments (damage, corrections)


class WarehouseItem(Base):
    __tablename__ = "warehouse_items"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String, unique=True, nullable=False, index=True)
    batch_code = Column(String, nullable=False)
    
    # Product info
    variety = Column(String, nullable=False, index=True)
    height_cm = Column(Integer, nullable=False)
    farm = Column(String, nullable=False, index=True)
    supplier = Column(String, nullable=False, index=True)
    
    # Dates
    delivery_date = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Pricing
    currency = Column(String, nullable=False)  # USD, EUR, KZT
    rate = Column(Float, nullable=False)  # Exchange rate to KZT
    cost = Column(Float, nullable=False)  # Cost in original currency
    recommended_price = Column(Float, nullable=False)  # Calculated price in KZT
    price = Column(Float, nullable=False)  # Actual selling price in KZT
    markup_pct = Column(Float, nullable=False, default=100.0)
    
    # Quantity
    qty = Column(Integer, nullable=False, default=0)
    reserved_qty = Column(Integer, nullable=False, default=0)
    
    # Flags
    on_showcase = Column(Boolean, default=False, index=True)
    to_write_off = Column(Boolean, default=False, index=True)
    hidden = Column(Boolean, default=False)
    
    # Tracking
    updated_by = Column(String)  # User who last updated
    supply_item_id = Column(Integer, ForeignKey("supply_items.id"))  # Link to supply item
    
    # Relationships
    product_ingredients = relationship("ProductIngredient", back_populates="warehouse_item")
    product_components = relationship("ProductComponent", back_populates="warehouse_item")
    supply_item = relationship("SupplyItem", back_populates="warehouse_items")
    
    @property
    def available_qty(self):
        return self.qty - self.reserved_qty
    
    @property
    def is_critical_stock(self):
        return self.available_qty < 15 and not self.to_write_off


class Delivery(Base):
    __tablename__ = "deliveries"

    id = Column(Integer, primary_key=True, index=True)
    supplier = Column(String, nullable=False)
    farm = Column(String, nullable=False)
    delivery_date = Column(DateTime(timezone=True), nullable=False)
    
    # Pricing
    currency = Column(String, nullable=False)
    rate = Column(Float, nullable=False)
    cost_total = Column(Float, nullable=False)
    
    # Meta
    comment = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(String)
    
    # Relationships
    positions = relationship("DeliveryPosition", back_populates="delivery", cascade="all, delete-orphan")


class DeliveryPosition(Base):
    __tablename__ = "delivery_positions"

    id = Column(Integer, primary_key=True, index=True)
    delivery_id = Column(Integer, ForeignKey("deliveries.id"), nullable=False)
    
    # Product info
    variety = Column(String, nullable=False)
    height_cm = Column(Integer, nullable=False)
    qty = Column(Integer, nullable=False)
    cost_per_stem = Column(Float, nullable=False)
    
    # Calculated
    total_cost = Column(Float, nullable=False)
    
    # Relationships
    delivery = relationship("Delivery", back_populates="positions")


class WarehouseMovement(Base):
    """
    Track all movements of warehouse items (in, out, adjustments)
    """
    __tablename__ = "warehouse_movements"

    id = Column(Integer, primary_key=True, index=True)
    warehouse_item_id = Column(Integer, ForeignKey("warehouse_items.id"), nullable=False)
    
    # Movement details
    type = Column(Enum(MovementType), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)  # Positive for IN, negative for OUT/ADJUSTMENT
    description = Column(String, nullable=False)
    
    # References
    reference_type = Column(String)  # "order", "supply", "manual", etc.
    reference_id = Column(String)    # ID of related order/supply/etc.
    
    # Tracking
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    created_by = Column(String, nullable=False)  # User who performed the action
    
    # Stock levels after this movement (for audit purposes)
    qty_before = Column(Integer, nullable=False)
    qty_after = Column(Integer, nullable=False)
    
    # Relationships
    warehouse_item = relationship("WarehouseItem", backref="movements")