from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.crud.base import CRUDBase
from app.models.order import OrderItem
from app.models.product import Product
from app.models.warehouse import WarehouseItem
from app.schemas.order import OrderItemCreate, OrderItemUpdate


class CRUDOrderItem(CRUDBase[OrderItem, OrderItemCreate, OrderItemUpdate]):
    def create_for_order(
        self,
        db: Session,
        *,
        order_id: int,
        obj_in: OrderItemCreate,
        auto_reserve: bool = True
    ) -> OrderItem:
        # Get product details
        product = db.query(Product).filter(Product.id == obj_in.product_id).first()
        if not product:
            raise ValueError(f"Product with id {obj_in.product_id} not found")
        
        # Calculate total
        total = product.retail_price * obj_in.quantity
        
        # Try to reserve warehouse items if auto_reserve is True
        warehouse_item_id = None
        if auto_reserve:
            warehouse_item_id = self._reserve_warehouse_items(
                db, 
                product_id=obj_in.product_id, 
                quantity=obj_in.quantity
            )
        
        # Create order item
        db_obj = OrderItem(
            order_id=order_id,
            product_id=obj_in.product_id,
            product_name=product.name,
            product_category=product.category,
            quantity=obj_in.quantity,
            price=product.retail_price,
            total=total,
            warehouse_item_id=warehouse_item_id,
            is_reserved=warehouse_item_id is not None
        )
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        
        return db_obj
    
    def _reserve_warehouse_items(
        self,
        db: Session,
        *,
        product_id: int,
        quantity: int
    ) -> Optional[int]:
        """
        Резервирует товары на складе для заказа.
        Возвращает ID склада или None если резервирование не удалось.
        """
        # Найти доступные товары на складе для данного продукта
        # Пока что используем простую логику - берем первый доступный товар
        # В реальности здесь может быть более сложная логика выбора товара
        
        warehouse_item = db.query(WarehouseItem).filter(
            and_(
                WarehouseItem.variety == f"product_{product_id}",  # Связываем по названию/артикулу
                WarehouseItem.qty - WarehouseItem.reserved_qty >= quantity,  # available_qty
                WarehouseItem.to_write_off == False,
                WarehouseItem.hidden == False
            )
        ).first()
        
        if warehouse_item:
            # Резервируем товар
            warehouse_item.reserved_qty += quantity
            db.commit()
            return warehouse_item.id
        
        return None
    
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
    
    def unreserve_item(
        self,
        db: Session,
        *,
        db_obj: OrderItem
    ) -> OrderItem:
        """Отменяет резервирование товара"""
        if db_obj.is_reserved and db_obj.warehouse_item_id:
            warehouse_item = db.query(WarehouseItem).filter(
                WarehouseItem.id == db_obj.warehouse_item_id
            ).first()
            
            if warehouse_item:
                # Отменяем резервирование
                warehouse_item.reserved_qty = max(0, warehouse_item.reserved_qty - db_obj.quantity)
                
                # Обновляем позицию заказа
                db_obj.is_reserved = False
                db_obj.warehouse_item_id = None
                
                db.commit()
                db.refresh(db_obj)
        
        return db_obj
    
    def write_off_item(
        self,
        db: Session,
        *,
        db_obj: OrderItem
    ) -> OrderItem:
        """Списывает товар со склада (при выполнении заказа)"""
        if db_obj.warehouse_item_id:
            warehouse_item = db.query(WarehouseItem).filter(
                WarehouseItem.id == db_obj.warehouse_item_id
            ).first()
            
            if warehouse_item:
                # Списываем товар
                warehouse_item.qty = max(0, warehouse_item.qty - db_obj.quantity)
                warehouse_item.reserved_qty = max(0, warehouse_item.reserved_qty - db_obj.quantity)
                
                # Обновляем позицию заказа
                db_obj.is_written_off = True
                from datetime import datetime
                db_obj.written_off_at = datetime.utcnow()
                
                db.commit()
                db.refresh(db_obj)
        
        return db_obj


order_item = CRUDOrderItem(OrderItem)