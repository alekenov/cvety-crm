from sqlalchemy import Column, Integer, ForeignKey, Float, String
from sqlalchemy.orm import relationship

from app.db.session import Base


class ProductIngredient(Base):
    """Link between Product (catalog item) and WarehouseItem (physical flowers)"""
    __tablename__ = "product_ingredients"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    warehouse_item_id = Column(Integer, ForeignKey("warehouse_items.id"), nullable=False)
    
    # Quantity of this warehouse item needed for the product
    quantity = Column(Integer, nullable=False, default=1)
    
    # Optional: specific notes for this ingredient (e.g., "main flower", "accent flower", "greenery")
    notes = Column(String)
    
    # Relationships
    product = relationship("Product", back_populates="ingredients")
    warehouse_item = relationship("WarehouseItem", back_populates="product_ingredients")