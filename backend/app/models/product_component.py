from sqlalchemy import Column, Integer, ForeignKey, Float, String, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum

from app.db.session import Base


class ComponentType(str, enum.Enum):
    flower = "flower"           # Цветы со склада
    material = "material"       # Декоративные материалы
    service = "service"         # Услуги (работа флориста)


class ProductComponent(Base):
    """Flexible component system for product composition"""
    __tablename__ = "product_components"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    # Component type
    component_type = Column(SQLEnum(ComponentType), nullable=False)
    
    # Component details
    name = Column(String, nullable=False)  # "Роза Ред Наоми", "Лента атласная", "Работа флориста"
    description = Column(String)           # "60см, красная", "шелковая", "сборка букета"
    quantity = Column(Integer, nullable=False, default=1)
    unit = Column(String, default="шт")    # "шт", "м", "услуга"
    
    # Pricing
    unit_cost = Column(Float, default=0)      # Себестоимость за единицу
    unit_price = Column(Float, default=0)    # Цена за единицу
    
    # Optional links to other entities
    warehouse_item_id = Column(Integer, ForeignKey("warehouse_items.id"), nullable=True)  # For flowers
    material_id = Column(Integer, ForeignKey("decorative_materials.id"), nullable=True)   # For materials
    
    # Relationships
    product = relationship("Product", back_populates="components")
    warehouse_item = relationship("WarehouseItem", back_populates="product_components")