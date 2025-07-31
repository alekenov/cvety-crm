from typing import List, Optional
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.order_history import OrderHistory, OrderEventType
from app.models.order import OrderStatus
from app.schemas.order_history import OrderHistoryCreate, OrderHistoryUpdate


class CRUDOrderHistory(CRUDBase[OrderHistory, OrderHistoryCreate, OrderHistoryUpdate]):
    def get_by_order(self, db: Session, *, order_id: int) -> List[OrderHistory]:
        return db.query(OrderHistory).filter(
            OrderHistory.order_id == order_id
        ).order_by(OrderHistory.created_at).all()
    
    def create_status_change(
        self, 
        db: Session, 
        *, 
        order_id: int,
        old_status: OrderStatus,
        new_status: OrderStatus,
        user_id: Optional[int] = None,
        comment: Optional[str] = None
    ) -> OrderHistory:
        db_obj = OrderHistory(
            order_id=order_id,
            user_id=user_id,
            event_type=OrderEventType.status_changed,
            old_status=old_status.value,
            new_status=new_status.value,
            comment=comment or f"Статус изменен с {old_status.value} на {new_status.value}"
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def create_comment(
        self,
        db: Session,
        *,
        order_id: int,
        comment: str,
        user_id: Optional[int] = None
    ) -> OrderHistory:
        db_obj = OrderHistory(
            order_id=order_id,
            user_id=user_id,
            event_type=OrderEventType.comment_added,
            comment=comment
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def create_issue_report(
        self,
        db: Session,
        *,
        order_id: int,
        issue_type: str,
        comment: str,
        user_id: Optional[int] = None
    ) -> OrderHistory:
        db_obj = OrderHistory(
            order_id=order_id,
            user_id=user_id,
            event_type=OrderEventType.issue_reported,
            comment=f"Проблема: {issue_type}. {comment}"
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def create_florist_assignment(
        self,
        db: Session,
        *,
        order_id: int,
        florist_id: int,
        florist_name: str,
        user_id: Optional[int] = None
    ) -> OrderHistory:
        db_obj = OrderHistory(
            order_id=order_id,
            user_id=user_id,
            event_type=OrderEventType.florist_assigned,
            comment=f"Назначен флорист: {florist_name}"
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


order_history = CRUDOrderHistory(OrderHistory)