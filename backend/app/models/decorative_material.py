from sqlalchemy import Column, Integer, String, Numeric, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.session import Base


class DecorativeMaterial(Base):
    __tablename__ = "decorative_materials"
    
    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, ForeignKey("shops.id"), nullable=False)
    
    # Material details
    name = Column(String, nullable=False)
    category = Column(String, nullable=True)  # e.g., "packaging", "ribbon", "card", "topper"
    price = Column(Numeric(10, 2), nullable=False)
    unit = Column(String, default="шт")  # Unit of measurement
    
    # Availability
    is_active = Column(Boolean, default=True)
    in_stock = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    shop = relationship("Shop", back_populates="decorative_materials")


class CalculatorSettings(Base):
    __tablename__ = "calculator_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, ForeignKey("shops.id"), nullable=False, unique=True)
    
    # Default values
    default_labor_cost = Column(Numeric(10, 2), nullable=False, default=2000)
    
    # Margin recommendations
    min_margin_percent = Column(Numeric(5, 2), default=30)
    recommended_margin_percent = Column(Numeric(5, 2), default=50)
    premium_margin_percent = Column(Numeric(5, 2), default=100)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    shop = relationship("Shop", back_populates="calculator_settings", uselist=False)