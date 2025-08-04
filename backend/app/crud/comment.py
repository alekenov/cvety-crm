from typing import List, Optional
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.comment import Comment
from app.models.order_history import OrderHistory, OrderEventType
from app.schemas.comment import CommentCreate, CommentUpdate


class CRUDComment(CRUDBase[Comment, CommentCreate, CommentUpdate]):
    def create_for_order(
        self, db: Session, *, order_id: int, user_id: int, obj_in: CommentCreate
    ) -> Comment:
        db_obj = Comment(
            order_id=order_id,
            user_id=user_id,
            text=obj_in.text
        )
        db.add(db_obj)
        
        # Add to order history
        history = OrderHistory(
            order_id=order_id,
            user_id=user_id,
            event_type=OrderEventType.comment_added,
            comment=obj_in.text
        )
        db.add(history)
        
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def get_by_order(
        self, db: Session, *, order_id: int, skip: int = 0, limit: int = 100
    ) -> List[Comment]:
        return (
            db.query(self.model)
            .filter(Comment.order_id == order_id)
            .order_by(Comment.created_at)
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def update(
        self, db: Session, *, db_obj: Comment, obj_in: CommentUpdate
    ) -> Comment:
        if obj_in.text is not None:
            db_obj.text = obj_in.text
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


comment = CRUDComment(Comment)