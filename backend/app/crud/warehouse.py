from typing import Optional, List, Dict
from sqlalchemy.orm import Session
from sqlalchemy import or_, func, and_

from app.models.warehouse import WarehouseItem, Delivery, DeliveryPosition, WarehouseMovement, MovementType
from app.schemas.warehouse import (
    WarehouseItemCreate, 
    WarehouseItemUpdate,
    DeliveryCreate,
    WarehouseFilterParams,
    WarehouseMovementCreate,
    StockAdjustmentRequest
)


class CRUDWarehouse:
    def get_items(
        self,
        db: Session,
        filters: WarehouseFilterParams
    ) -> tuple[List[WarehouseItem], int]:
        query = db.query(WarehouseItem)
        
        # Apply filters
        if filters.variety:
            query = query.filter(WarehouseItem.variety == filters.variety)
        if filters.height_cm:
            query = query.filter(WarehouseItem.height_cm == filters.height_cm)
        if filters.farm:
            query = query.filter(WarehouseItem.farm == filters.farm)
        if filters.supplier:
            query = query.filter(WarehouseItem.supplier == filters.supplier)
        if filters.on_showcase is not None:
            query = query.filter(WarehouseItem.on_showcase == filters.on_showcase)
        if filters.to_write_off is not None:
            query = query.filter(WarehouseItem.to_write_off == filters.to_write_off)
        
        # Search
        if filters.search:
            search_pattern = f"%{filters.search}%"
            query = query.filter(
                or_(
                    WarehouseItem.sku.ilike(search_pattern),
                    WarehouseItem.variety.ilike(search_pattern),
                    WarehouseItem.batch_code.ilike(search_pattern)
                )
            )
        
        # Don't show hidden items
        query = query.filter(WarehouseItem.hidden == False)
        
        # Count before pagination
        total = query.count()
        
        # Pagination
        offset = (filters.page - 1) * filters.limit
        items = query.order_by(WarehouseItem.created_at.desc()).offset(offset).limit(filters.limit).all()
        
        return items, total
    
    def get_item(self, db: Session, item_id: int) -> Optional[WarehouseItem]:
        return db.query(WarehouseItem).filter(WarehouseItem.id == item_id).first()
    
    def create_item(self, db: Session, item: WarehouseItemCreate) -> WarehouseItem:
        # Calculate recommended price
        recommended_price = item.cost * item.rate * (1 + item.markup_pct / 100)
        
        db_item = WarehouseItem(
            **item.model_dump(),
            recommended_price=recommended_price,
            reserved_qty=0
        )
        
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        return db_item
    
    def update_item(
        self, 
        db: Session, 
        item_id: int, 
        item_update: WarehouseItemUpdate
    ) -> Optional[WarehouseItem]:
        db_item = self.get_item(db, item_id)
        if not db_item:
            return None
        
        update_data = item_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_item, field, value)
        
        db.commit()
        db.refresh(db_item)
        return db_item
    
    def create_delivery(self, db: Session, delivery: DeliveryCreate) -> Delivery:
        # Calculate total cost
        cost_total = sum(
            pos.qty * pos.cost_per_stem 
            for pos in delivery.positions
        )
        
        # Create delivery
        db_delivery = Delivery(
            supplier=delivery.supplier,
            farm=delivery.farm,
            delivery_date=delivery.delivery_date,
            currency=delivery.currency,
            rate=delivery.rate,
            comment=delivery.comment,
            cost_total=cost_total
        )
        
        db.add(db_delivery)
        db.flush()  # Get delivery ID
        
        # Create positions and warehouse items
        for pos_data in delivery.positions:
            # Create delivery position
            db_position = DeliveryPosition(
                delivery_id=db_delivery.id,
                variety=pos_data.variety,
                height_cm=pos_data.height_cm,
                qty=pos_data.qty,
                cost_per_stem=pos_data.cost_per_stem,
                total_cost=pos_data.qty * pos_data.cost_per_stem
            )
            db.add(db_position)
            
            # Create or update warehouse item
            # Generate SKU
            sku = f"{pos_data.variety[:3].upper()}-{delivery.farm[:3].upper()}-{pos_data.height_cm}"
            batch_code = f"B{delivery.delivery_date.strftime('%Y%m%d')}-{db_delivery.id}"
            
            # Check if similar item exists
            existing_item = db.query(WarehouseItem).filter(
                and_(
                    WarehouseItem.variety == pos_data.variety,
                    WarehouseItem.height_cm == pos_data.height_cm,
                    WarehouseItem.farm == delivery.farm,
                    WarehouseItem.supplier == delivery.supplier
                )
            ).first()
            
            if existing_item:
                # Update quantity
                existing_item.qty += pos_data.qty
                existing_item.batch_code = batch_code
                existing_item.delivery_date = delivery.delivery_date
                existing_item.cost = pos_data.cost_per_stem
                existing_item.currency = delivery.currency
                existing_item.rate = delivery.rate
                existing_item.recommended_price = pos_data.cost_per_stem * delivery.rate * 2  # 100% markup
            else:
                # Create new item
                warehouse_item = WarehouseItem(
                    sku=sku,
                    batch_code=batch_code,
                    variety=pos_data.variety,
                    height_cm=pos_data.height_cm,
                    farm=delivery.farm,
                    supplier=delivery.supplier,
                    delivery_date=delivery.delivery_date,
                    currency=delivery.currency,
                    rate=delivery.rate,
                    cost=pos_data.cost_per_stem,
                    recommended_price=pos_data.cost_per_stem * delivery.rate * 2,  # 100% markup
                    price=pos_data.cost_per_stem * delivery.rate * 2,  # Start with recommended
                    markup_pct=100.0,
                    qty=pos_data.qty,
                    reserved_qty=0
                )
                db.add(warehouse_item)
        
        db.commit()
        db.refresh(db_delivery)
        return db_delivery
    
    def get_deliveries(self, db: Session, skip: int = 0, limit: int = 20) -> tuple[List[Delivery], int]:
        query = db.query(Delivery)
        total = query.count()
        
        deliveries = query.order_by(Delivery.created_at.desc()).offset(skip).limit(limit).all()
        return deliveries, total
    
    def get_stats(self, db: Session) -> Dict:
        # Total items and value
        total_query = db.query(
            func.count(WarehouseItem.id),
            func.sum(WarehouseItem.qty * WarehouseItem.price)
        ).filter(
            WarehouseItem.hidden == False,
            WarehouseItem.to_write_off == False
        ).first()
        
        total_items, total_value = total_query
        
        # Critical items (available qty < 15)
        critical_items = db.query(func.count(WarehouseItem.id)).filter(
            (WarehouseItem.qty - WarehouseItem.reserved_qty) < 15,
            WarehouseItem.to_write_off == False
        ).scalar()
        
        # Showcase items
        showcase_items = db.query(func.count(WarehouseItem.id)).filter(
            WarehouseItem.on_showcase == True
        ).scalar()
        
        # Write-off items
        writeoff_items = db.query(func.count(WarehouseItem.id)).filter(
            WarehouseItem.to_write_off == True
        ).scalar()
        
        # By variety
        variety_stats = db.query(
            WarehouseItem.variety,
            func.sum(WarehouseItem.qty)
        ).filter(
            WarehouseItem.hidden == False
        ).group_by(WarehouseItem.variety).all()
        
        # By supplier
        supplier_stats = db.query(
            WarehouseItem.supplier,
            func.sum(WarehouseItem.qty)
        ).filter(
            WarehouseItem.hidden == False
        ).group_by(WarehouseItem.supplier).all()
        
        return {
            "total_items": total_items or 0,
            "total_value": float(total_value or 0),
            "critical_items": critical_items or 0,
            "showcase_items": showcase_items or 0,
            "writeoff_items": writeoff_items or 0,
            "by_variety": {v: int(q) for v, q in variety_stats},
            "by_supplier": {s: int(q) for s, q in supplier_stats}
        }
    
    # Movement methods
    def create_movement(
        self, 
        db: Session, 
        movement: WarehouseMovementCreate
    ) -> WarehouseMovement:
        """Create a new warehouse movement and update item quantity"""
        # Get current item
        item = db.query(WarehouseItem).filter(WarehouseItem.id == movement.warehouse_item_id).first()
        if not item:
            raise ValueError(f"Warehouse item {movement.warehouse_item_id} not found")
        
        qty_before = item.qty
        qty_after = qty_before + movement.quantity
        
        if qty_after < 0:
            raise ValueError(f"Insufficient quantity. Current: {qty_before}, Requested: {movement.quantity}")
        
        # Create movement record
        db_movement = WarehouseMovement(
            warehouse_item_id=movement.warehouse_item_id,
            type=movement.type,
            quantity=movement.quantity,
            description=movement.description,
            reference_type=movement.reference_type,
            reference_id=movement.reference_id,
            created_by=movement.created_by,
            qty_before=qty_before,
            qty_after=qty_after
        )
        
        # Update item quantity
        item.qty = qty_after
        
        db.add(db_movement)
        db.commit()
        db.refresh(db_movement)
        
        return db_movement
    
    def get_movements(
        self, 
        db: Session, 
        warehouse_item_id: int,
        skip: int = 0, 
        limit: int = 50
    ) -> tuple[List[WarehouseMovement], int]:
        """Get movements for a specific warehouse item"""
        query = db.query(WarehouseMovement).filter(
            WarehouseMovement.warehouse_item_id == warehouse_item_id
        )
        
        total = query.count()
        movements = query.order_by(WarehouseMovement.created_at.desc()).offset(skip).limit(limit).all()
        
        return movements, total
    
    def adjust_stock(
        self, 
        db: Session, 
        warehouse_item_id: int, 
        adjustment_request: StockAdjustmentRequest
    ) -> WarehouseMovement:
        """Adjust stock quantity and create movement record"""
        movement_data = WarehouseMovementCreate(
            warehouse_item_id=warehouse_item_id,
            type=MovementType.ADJUSTMENT,
            quantity=adjustment_request.adjustment,
            description=adjustment_request.reason,
            reference_type="manual",
            reference_id=None,
            created_by=adjustment_request.created_by
        )
        
        return self.create_movement(db, movement_data)
    
    def update_item(
        self, 
        db: Session, 
        item_id: int, 
        item_update: WarehouseItemUpdate
    ) -> Optional[WarehouseItem]:
        """Update warehouse item and create movement record if quantity changed"""
        item = db.query(WarehouseItem).filter(WarehouseItem.id == item_id).first()
        if not item:
            return None
        
        # Check if quantity is being updated
        old_qty = item.qty
        new_qty = item_update.qty if item_update.qty is not None else old_qty
        
        # Update item fields
        update_data = item_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(item, field, value)
        
        # If quantity changed, create movement record
        if new_qty != old_qty:
            qty_change = new_qty - old_qty
            movement_type = MovementType.IN if qty_change > 0 else MovementType.ADJUSTMENT
            
            movement = WarehouseMovementCreate(
                warehouse_item_id=item_id,
                type=movement_type,
                quantity=qty_change,
                description=f"Корректировка количества: {old_qty} → {new_qty}",
                reference_type="manual",
                reference_id=None,
                created_by=item_update.updated_by or "system"
            )
            
            # Create movement record (this will also update quantity, so we need to set it back)
            item.qty = old_qty  # Reset to old quantity
            self.create_movement(db, movement)
        else:
            # Just commit the changes if no quantity change
            db.commit()
            db.refresh(item)
        
        return item


warehouse = CRUDWarehouse()