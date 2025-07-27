from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func

from app.crud.base import CRUDBase
from app.models.production import FloristTask, TaskItem, TaskStatus, TaskPriority
from app.models.order import OrderItem
from app.schemas.production import (
    FloristTaskCreate, FloristTaskUpdate, 
    TaskItemCreate, TaskItemUpdate
)


class CRUDFloristTask(CRUDBase[FloristTask, FloristTaskCreate, FloristTaskUpdate]):
    def create_with_items(self, db: Session, *, obj_in: FloristTaskCreate) -> FloristTask:
        """Создать задачу с позициями"""
        # Создаем задачу
        db_obj = FloristTask(
            order_id=obj_in.order_id,
            task_type=obj_in.task_type,
            priority=obj_in.priority,
            estimated_minutes=obj_in.estimated_minutes,
            deadline=obj_in.deadline,
            instructions=obj_in.instructions
        )
        db.add(db_obj)
        db.flush()
        
        # Создаем позиции задачи
        for item in obj_in.items:
            task_item = TaskItem(
                task_id=db_obj.id,
                order_item_id=item.order_item_id,
                quantity=item.quantity
            )
            db.add(task_item)
        
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def get_pending_tasks(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[FloristTask]:
        """Получить список ожидающих задач"""
        return db.query(self.model).filter(
            self.model.status == TaskStatus.pending
        ).order_by(
            self.model.priority.desc(),
            self.model.created_at
        ).offset(skip).limit(limit).all()
    
    def get_by_florist(
        self, db: Session, *, florist_id: int, 
        status: Optional[TaskStatus] = None,
        skip: int = 0, limit: int = 100
    ) -> List[FloristTask]:
        """Получить задачи флориста"""
        query = db.query(self.model).filter(self.model.florist_id == florist_id)
        if status:
            query = query.filter(self.model.status == status)
        return query.order_by(self.model.created_at.desc()).offset(skip).limit(limit).all()
    
    def get_overdue_tasks(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[FloristTask]:
        """Получить просроченные задачи"""
        return db.query(self.model).filter(
            and_(
                self.model.deadline < datetime.utcnow(),
                self.model.status.notin_([TaskStatus.completed, TaskStatus.cancelled])
            )
        ).order_by(self.model.deadline).offset(skip).limit(limit).all()
    
    def assign_to_florist(self, db: Session, *, task_id: int, florist_id: int) -> Optional[FloristTask]:
        """Назначить задачу флористу"""
        task = self.get(db, id=task_id)
        if not task or task.status != TaskStatus.pending:
            return None
        
        task.florist_id = florist_id
        task.status = TaskStatus.assigned
        task.assigned_at = datetime.utcnow()
        
        db.add(task)
        db.commit()
        db.refresh(task)
        return task
    
    def start_task(self, db: Session, *, task_id: int, florist_notes: Optional[str] = None) -> Optional[FloristTask]:
        """Начать выполнение задачи"""
        task = self.get(db, id=task_id)
        if not task or task.status != TaskStatus.assigned:
            return None
        
        task.status = TaskStatus.in_progress
        task.started_at = datetime.utcnow()
        if florist_notes:
            task.florist_notes = florist_notes
        
        db.add(task)
        db.commit()
        db.refresh(task)
        return task
    
    def complete_task(
        self, db: Session, *, 
        task_id: int, 
        actual_minutes: Optional[int] = None,
        florist_notes: Optional[str] = None,
        result_photos: Optional[List[str]] = None
    ) -> Optional[FloristTask]:
        """Завершить задачу"""
        task = self.get(db, id=task_id)
        if not task or task.status != TaskStatus.in_progress:
            return None
        
        task.status = TaskStatus.quality_check
        task.completed_at = datetime.utcnow()
        
        if actual_minutes is not None:
            task.actual_minutes = actual_minutes
        elif task.started_at:
            # Автоматически рассчитываем время
            task.actual_minutes = int((task.completed_at - task.started_at).total_seconds() / 60)
        
        if florist_notes:
            task.florist_notes = florist_notes
        if result_photos:
            task.result_photos = result_photos
        
        # Отмечаем все позиции как выполненные
        for item in task.items:
            item.is_completed = True
            item.completed_at = datetime.utcnow()
        
        db.add(task)
        db.commit()
        db.refresh(task)
        return task
    
    def quality_check(
        self, db: Session, *,
        task_id: int,
        quality_score: float,
        quality_approved: bool,
        quality_notes: Optional[str] = None
    ) -> Optional[FloristTask]:
        """Проверка качества задачи"""
        task = self.get(db, id=task_id)
        if not task or task.status != TaskStatus.quality_check:
            return None
        
        task.quality_score = quality_score
        task.quality_notes = quality_notes
        
        if quality_approved:
            task.status = TaskStatus.completed
            # Отмечаем все позиции как проверенные
            for item in task.items:
                item.quality_approved = True
                if quality_notes:
                    item.quality_notes = quality_notes
        else:
            # Возвращаем в работу
            task.status = TaskStatus.in_progress
            task.started_at = datetime.utcnow()
        
        db.add(task)
        db.commit()
        db.refresh(task)
        return task
    
    def cancel_task(self, db: Session, *, task_id: int) -> Optional[FloristTask]:
        """Отменить задачу"""
        task = self.get(db, id=task_id)
        if not task or task.status == TaskStatus.completed:
            return None
        
        task.status = TaskStatus.cancelled
        db.add(task)
        db.commit()
        db.refresh(task)
        return task
    
    def get_florist_stats(self, db: Session, *, florist_id: int) -> dict:
        """Получить статистику флориста"""
        tasks = db.query(self.model).filter(self.model.florist_id == florist_id).all()
        
        total_tasks = len(tasks)
        completed_tasks = len([t for t in tasks if t.status == TaskStatus.completed])
        in_progress_tasks = len([t for t in tasks if t.status == TaskStatus.in_progress])
        overdue_tasks = len([t for t in tasks if t.is_overdue])
        
        # Средняя оценка качества
        quality_scores = [t.quality_score for t in tasks if t.quality_score is not None]
        avg_quality = sum(quality_scores) / len(quality_scores) if quality_scores else None
        
        # Среднее время выполнения
        completion_times = [t.time_spent for t in tasks if t.status == TaskStatus.completed and t.time_spent > 0]
        avg_time = sum(completion_times) / len(completion_times) if completion_times else None
        
        return {
            "florist_id": florist_id,
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "in_progress_tasks": in_progress_tasks,
            "average_quality_score": avg_quality,
            "average_completion_time": avg_time,
            "overdue_tasks": overdue_tasks
        }
    
    def get_queue_stats(self, db: Session) -> dict:
        """Получить статистику очереди задач"""
        tasks = db.query(self.model).all()
        
        pending = len([t for t in tasks if t.status == TaskStatus.pending])
        assigned = len([t for t in tasks if t.status == TaskStatus.assigned])
        in_progress = len([t for t in tasks if t.status == TaskStatus.in_progress])
        overdue = len([t for t in tasks if t.is_overdue])
        urgent = len([t for t in tasks if t.priority == TaskPriority.urgent and t.status not in [TaskStatus.completed, TaskStatus.cancelled]])
        
        # Группировка по типу
        tasks_by_type = {}
        for task in tasks:
            if task.status not in [TaskStatus.completed, TaskStatus.cancelled]:
                tasks_by_type[task.task_type] = tasks_by_type.get(task.task_type, 0) + 1
        
        # Группировка по приоритету
        tasks_by_priority = {}
        for task in tasks:
            if task.status not in [TaskStatus.completed, TaskStatus.cancelled]:
                tasks_by_priority[task.priority.value] = tasks_by_priority.get(task.priority.value, 0) + 1
        
        return {
            "pending_tasks": pending,
            "assigned_tasks": assigned,
            "in_progress_tasks": in_progress,
            "overdue_tasks": overdue,
            "urgent_tasks": urgent,
            "tasks_by_type": tasks_by_type,
            "tasks_by_priority": tasks_by_priority
        }


florist_task = CRUDFloristTask(FloristTask)