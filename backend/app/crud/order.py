from typing import Optional, List, Union
from sqlalchemy.orm import Session
from sqlalchemy import or_
import secrets

from app.crud.base import CRUDBase
from app.models.order import Order, OrderStatus, IssueType
from app.schemas.order import OrderCreate, OrderUpdate, OrderCreateWithItems
from app.crud.customer import customer as crud_customer
from app.models.product import Product


def generate_tracking_token() -> str:
    return secrets.token_urlsafe(16)


class CRUDOrder(CRUDBase[Order, OrderCreate, OrderUpdate]):
    def create(self, db: Session, *, obj_in: Union[OrderCreate, OrderCreateWithItems]) -> Order:
        # Get or create customer
        customer = crud_customer.get_or_create(
            db,
            phone=obj_in.customer_phone,
            name=obj_in.recipient_name,
            address=obj_in.address
        )
        
        # Convert delivery window to JSON format
        delivery_window_json = None
        if obj_in.delivery_window:
            delivery_window_json = {
                "from": obj_in.delivery_window.from_time.isoformat() if obj_in.delivery_window.from_time else None,
                "to": obj_in.delivery_window.to_time.isoformat() if obj_in.delivery_window.to_time else None
            }
        
        # Check if this is a create with items
        items_data = []
        if isinstance(obj_in, OrderCreateWithItems):
            items_data = obj_in.items
            obj_dict = obj_in.dict(exclude={"delivery_window", "items"})
        else:
            obj_dict = obj_in.dict(exclude={"delivery_window"})
        
        # If creating with items, calculate totals
        if items_data:
            flower_sum = 0
            for item in items_data:
                product = db.query(Product).filter(Product.id == item.product_id).first()
                if product:
                    flower_sum += product.retail_price * item.quantity
            
            # Update the order total
            obj_dict["flower_sum"] = flower_sum
            obj_dict["total"] = flower_sum + obj_dict.get("delivery_fee", 0)
        
        db_obj = Order(
            **obj_dict,
            delivery_window=delivery_window_json,
            tracking_token=generate_tracking_token(),
            customer_id=customer.id
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        
        # Create order items if provided
        if items_data:
            from app.crud.order_item import order_item as crud_order_item
            
            for item_data in items_data:
                crud_order_item.create_for_order(
                    db,
                    order_id=db_obj.id,
                    obj_in=item_data
                )
        
        # Update customer statistics
        crud_customer.update_statistics(db, customer_id=customer.id)
        
        return db_obj
    
    def get_multi(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        search: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None
    ) -> List[Order]:
        query = db.query(Order)
        
        if status and status != "all":
            query = query.filter(Order.status == status)
        
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Order.customer_phone.ilike(search_pattern),
                    Order.recipient_phone.ilike(search_pattern),
                    Order.recipient_name.ilike(search_pattern),
                    Order.id.cast(str).ilike(search_pattern)
                )
            )
        
        if date_from:
            query = query.filter(Order.created_at >= date_from)
        
        if date_to:
            query = query.filter(Order.created_at <= date_to)
        
        return query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
    
    def get_by_tracking_token(self, db: Session, *, tracking_token: str) -> Optional[Order]:
        return db.query(Order).filter(Order.tracking_token == tracking_token).first()
    
    def update_status(self, db: Session, *, db_obj: Order, status: OrderStatus) -> Order:
        db_obj.status = status
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def report_issue(
        self,
        db: Session,
        *,
        db_obj: Order,
        issue_type: IssueType,
        comment: str
    ) -> Order:
        db_obj.has_issue = True
        db_obj.issue_type = issue_type
        db_obj.issue_comment = comment
        db_obj.status = OrderStatus.issue
        
        db.commit()
        db.refresh(db_obj)
        return db_obj


order = CRUDOrder(Order)