from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.db.session import Base


class ProductCategory(str, enum.Enum):
    bouquet = "bouquet"
    composition = "composition"
    potted = "potted"
    other = "other"


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    category = Column(SQLEnum(ProductCategory), nullable=False)
    description = Column(Text)
    
    # Images
    image_url = Column(String)  # Main image
    
    # Shop association for multi-tenancy
    shop_id = Column(Integer, ForeignKey("shops.id"), nullable=False, default=1)
    
    # Pricing
    cost_price = Column(Float, nullable=False, default=0)
    retail_price = Column(Float, nullable=False)  # Retail price
    sale_price = Column(Float)
    
    # Flags
    is_active = Column(Boolean, default=True, index=True)
    is_popular = Column(Boolean, default=False)
    is_new = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")
    order_items = relationship("OrderItem", back_populates="product")
    ingredients = relationship("ProductIngredient", back_populates="product", cascade="all, delete-orphan")
    components = relationship("ProductComponent", back_populates="product", cascade="all, delete-orphan")
    shop = relationship("Shop", back_populates="products")
    
    @property
    def current_price(self):
        """Return sale price if available, otherwise retail price"""
        return self.sale_price if self.sale_price else self.retail_price
    
    @property
    def discount_percentage(self):
        """Calculate discount percentage if on sale"""
        if self.sale_price and self.sale_price < self.retail_price:
            return int((1 - self.sale_price / self.retail_price) * 100)
        return 0


class ProductImage(Base):
    __tablename__ = "product_images"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    image_url = Column(String, nullable=False)
    is_primary = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    product = relationship("Product", back_populates="images")