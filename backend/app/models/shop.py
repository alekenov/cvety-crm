from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class Shop(Base):
    """Flower shop (tenant) model for multi-tenancy"""
    __tablename__ = "shops"

    id = Column(Integer, primary_key=True, index=True)
    
    # Basic info
    name = Column(String(100), nullable=False)
    phone = Column(String(20), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=True)
    
    # Telegram authentication
    telegram_id = Column(String(50), unique=True, nullable=True, index=True)
    telegram_username = Column(String(50), nullable=True)
    
    # Shop details
    address = Column(Text, nullable=True)
    city = Column(String(50), default="Алматы")
    description = Column(Text, nullable=True)
    
    # Storefront settings
    whatsapp_number = Column(String(20), nullable=True)  # WhatsApp number for orders
    shop_domain = Column(String(50), unique=True, nullable=True, index=True)  # Unique domain identifier
    shop_logo_url = Column(String(255), nullable=True)  # Logo URL for storefront
    
    # Business hours
    business_hours = Column(JSON, nullable=True)  # {"mon": ["09:00", "18:00"], ...}
    
    # Settings
    currency = Column(String(3), default="KZT")
    timezone = Column(String(50), default="Asia/Almaty")
    language = Column(String(2), default="ru")  # ru, kz, en
    
    # Status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # Subscription/Plan (for SaaS)
    plan = Column(String(20), default="basic")  # basic, standard, premium
    trial_ends_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    last_login_at = Column(DateTime, nullable=True)
    
    # Relationships
    orders = relationship("Order", back_populates="shop")
    users = relationship("User", back_populates="shop")
    customers = relationship("Customer", back_populates="shop")
    products = relationship("Product", back_populates="shop")
    decorative_materials = relationship("DecorativeMaterial", back_populates="shop")
    calculator_settings = relationship("CalculatorSettings", back_populates="shop", uselist=False)