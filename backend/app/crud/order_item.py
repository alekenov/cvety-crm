from typing import List, Optional
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.order import OrderItem
from app.models.product import Product
from app.schemas.order import OrderItemCreate, OrderItemUpdate


class CRUDOrderItem(CRUDBase[OrderItem, OrderItemCreate, OrderItemUpdate]):
    def create_for_order(
        self,
        db: Session,
        *,
        order_id: int,
        obj_in: OrderItemCreate
    ) -> OrderItem:
        # Get product details
        product = db.query(Product).filter(Product.id == obj_in.product_id).first()
        if not product:
            raise ValueError(f"Product with id {obj_in.product_id} not found")
        
        # Calculate total
        total = product.retail_price * obj_in.quantity
        
        # Create order item
        db_obj = OrderItem(
            order_id=order_id,
            product_id=obj_in.product_id,
            product_name=product.name,
            product_category=product.category,
            quantity=obj_in.quantity,
            price=product.retail_price,
            total=total
        )
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        
        return db_obj
    
    def get_by_order(
        self,
        db: Session,
        *,
        order_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[OrderItem]:
        return (
            db.query(OrderItem)
            .filter(OrderItem.order_id == order_id)
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def update_quantity(
        self,
        db: Session,
        *,
        db_obj: OrderItem,
        quantity: int
    ) -> OrderItem:
        db_obj.quantity = quantity
        db_obj.total = db_obj.price * quantity
        
        db.commit()
        db.refresh(db_obj)
        
        return db_obj


order_item = CRUDOrderItem(OrderItem)