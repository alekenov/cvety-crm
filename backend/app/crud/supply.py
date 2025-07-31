from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_

from app.crud.base import CRUDBase
from app.models.supply import Supply, SupplyItem
from app.models.warehouse import WarehouseItem
from app.schemas.supply import SupplyCreate, SupplyItemCreate
from app.crud.flower_category import flower_category
from app.utils.supply_parser import calculate_retail_price


class CRUDSupply(CRUDBase[Supply, SupplyCreate, dict]):
    def get_with_items(self, db: Session, *, id: int) -> Optional[Supply]:
        """Get supply with all related items and categories"""
        return db.query(Supply).options(
            joinedload(Supply.items).joinedload(SupplyItem.category)
        ).filter(Supply.id == id).first()
    
    def get_multi_with_items(
        self, db: Session, *, skip: int = 0, limit: int = 100, status: Optional[str] = None
    ) -> List[Supply]:
        """Get multiple supplies with items"""
        query = db.query(Supply).options(
            joinedload(Supply.items).joinedload(SupplyItem.category)
        )
        
        if status:
            query = query.filter(Supply.status == status)
            
        return query.order_by(Supply.created_at.desc()).offset(skip).limit(limit).all()
    
    def create_with_items(
        self, db: Session, *, obj_in: SupplyCreate, created_by: Optional[str] = None
    ) -> Supply:
        """Create supply with items and warehouse entries in a single transaction"""
        # Create supply with all fields from the unified model
        db_supply = Supply(
            supplier=obj_in.supplier,
            farm=getattr(obj_in, 'farm', None),
            delivery_date=getattr(obj_in, 'delivery_date', datetime.now()),
            currency=getattr(obj_in, 'currency', 'KZT'),
            rate=getattr(obj_in, 'rate', 1.0),
            notes=obj_in.notes,
            comment=getattr(obj_in, 'comment', None),
            status="active",
            total_cost=0,
            created_by=created_by
        )
        db.add(db_supply)
        db.flush()  # Get the ID without committing
        
        total_cost = 0
        batch_code = f"S{db_supply.id}-{datetime.now().strftime('%Y%m%d')}"
        
        # Create supply items and warehouse items
        for idx, item_data in enumerate(obj_in.items):
            # Get category if specified
            category = None
            if item_data.category_id:
                category = flower_category.get(db, id=item_data.category_id)
            elif hasattr(item_data, 'flower_name'):
                # Auto-detect category if not specified
                category = flower_category.detect_category(db, flower_name=item_data.flower_name)
            
            # Calculate retail price
            markup = category.markup_percentage if category else 100  # Default 100% markup
            retail_price = calculate_retail_price(item_data.purchase_price, markup)
            
            # Calculate total cost for this item
            item_total_cost = item_data.purchase_price * item_data.quantity
            total_cost += item_total_cost
            
            # Create supply item
            db_item = SupplyItem(
                supply_id=db_supply.id,
                category_id=category.id if category else None,
                flower_name=item_data.flower_name,
                height_cm=item_data.height_cm,
                purchase_price=item_data.purchase_price,
                quantity=item_data.quantity,
                remaining_quantity=item_data.quantity,  # Initially all items are available
                retail_price=retail_price,
                total_cost=item_total_cost,
                batch_code=batch_code
            )
            db.add(db_item)
            db.flush()  # Get the item ID
            
            # Create corresponding warehouse item
            sku = f"{batch_code}-{idx+1:03d}"
            db_warehouse_item = WarehouseItem(
                sku=sku,
                batch_code=batch_code,
                variety=item_data.flower_name,
                height_cm=item_data.height_cm,
                farm=db_supply.farm or db_supply.supplier,
                supplier=db_supply.supplier,
                delivery_date=db_supply.delivery_date,
                currency=db_supply.currency,
                rate=db_supply.rate,
                cost=item_data.purchase_price,
                recommended_price=retail_price,
                price=retail_price,  # Can be adjusted later
                markup_pct=markup,
                qty=item_data.quantity,
                reserved_qty=0,
                on_showcase=False,
                to_write_off=False,
                hidden=False,
                supply_item_id=db_item.id  # Link to supply item
            )
            db.add(db_warehouse_item)
        
        # Update supply total cost
        db_supply.total_cost = total_cost
        
        db.commit()
        db.refresh(db_supply)
        
        # Load relationships
        return self.get_with_items(db, id=db_supply.id)
    
    def update_status(self, db: Session, *, id: int, status: str) -> Optional[Supply]:
        """Update supply status"""
        db_supply = db.query(Supply).filter(Supply.id == id).first()
        if db_supply:
            db_supply.status = status
            db.commit()
            db.refresh(db_supply)
        return db_supply
    
    def get_items_with_stock(self, db: Session, *, flower_name: Optional[str] = None) -> List[SupplyItem]:
        """Get supply items with remaining stock, optionally filtered by flower name"""
        query = db.query(SupplyItem).join(Supply).filter(
            and_(
                SupplyItem.remaining_quantity > 0,
                Supply.status == "active"
            )
        )
        
        if flower_name:
            query = query.filter(SupplyItem.flower_name.ilike(f"%{flower_name}%"))
        
        return query.order_by(SupplyItem.created_at).all()  # FIFO order


supply = CRUDSupply(Supply)