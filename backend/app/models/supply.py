from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class FlowerCategory(Base):
    __tablename__ = "flower_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    markup_percentage = Column(Float, nullable=False)
    keywords = Column(Text)  # Comma-separated keywords for auto-detection
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    supply_items = relationship("SupplyItem", back_populates="category")


class Supply(Base):
    __tablename__ = "supplies"

    id = Column(Integer, primary_key=True, index=True)
    supplier = Column(String, nullable=False)
    farm = Column(String)  # Farm/producer name
    delivery_date = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    
    # Pricing
    currency = Column(String, nullable=False, default="KZT")  # USD, EUR, KZT
    rate = Column(Float, nullable=False, default=1.0)  # Exchange rate to KZT
    total_cost = Column(Float, nullable=False, default=0)  # Total in original currency
    
    # Status and notes
    status = Column(String, default="active")  # active, archived
    notes = Column(Text)
    comment = Column(String)  # Additional comment (from Delivery model)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(String)
    
    # Relationships
    items = relationship("SupplyItem", back_populates="supply", cascade="all, delete-orphan")


class SupplyItem(Base):
    __tablename__ = "supply_items"

    id = Column(Integer, primary_key=True, index=True)
    supply_id = Column(Integer, ForeignKey("supplies.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("flower_categories.id"))
    
    # Product info
    flower_name = Column(String, nullable=False, index=True)  # Maps to variety in DeliveryPosition
    height_cm = Column(Integer, nullable=False)
    
    # Quantities and pricing
    purchase_price = Column(Float, nullable=False)  # Cost per stem in original currency
    quantity = Column(Integer, nullable=False)
    remaining_quantity = Column(Integer, nullable=False)
    retail_price = Column(Float, nullable=False)  # Calculated retail price in KZT
    
    # Calculated fields
    total_cost = Column(Float, nullable=False)  # Total in original currency
    
    # SKU generation info
    batch_code = Column(String)  # For generating SKU when creating warehouse items
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    supply = relationship("Supply", back_populates="items")
    category = relationship("FlowerCategory", back_populates="supply_items")
    warehouse_items = relationship("WarehouseItem", back_populates="supply_item")