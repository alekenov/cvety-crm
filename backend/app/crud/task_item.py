from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.production import TaskItem
from app.schemas.production import TaskItemCreate, TaskItemUpdate


class CRUDTaskItem(CRUDBase[TaskItem, TaskItemCreate, TaskItemUpdate]):
    def get_by_task(self, db: Session, *, task_id: int) -> List[TaskItem]:
        """Получить все позиции задачи"""
        return db.query(self.model).filter(self.model.task_id == task_id).all()
    
    def complete_item(
        self, db: Session, *, 
        item_id: int,
        quality_approved: Optional[bool] = None,
        quality_notes: Optional[str] = None
    ) -> Optional[TaskItem]:
        """Отметить позицию как выполненную"""
        item = self.get(db, id=item_id)
        if not item:
            return None
        
        item.is_completed = True
        item.completed_at = datetime.utcnow()
        
        if quality_approved is not None:
            item.quality_approved = quality_approved
        if quality_notes:
            item.quality_notes = quality_notes
        
        db.add(item)
        db.commit()
        db.refresh(item)
        return item
    
    def update_quality(
        self, db: Session, *,
        item_id: int,
        quality_approved: bool,
        quality_notes: Optional[str] = None
    ) -> Optional[TaskItem]:
        """Обновить результаты проверки качества"""
        item = self.get(db, id=item_id)
        if not item:
            return None
        
        item.quality_approved = quality_approved
        if quality_notes:
            item.quality_notes = quality_notes
        
        db.add(item)
        db.commit()
        db.refresh(item)
        return item


task_item = CRUDTaskItem(TaskItem)