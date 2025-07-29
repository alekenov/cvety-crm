from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.db.session import Base


class TaskStatus(str, enum.Enum):
    pending = "pending"          # Ожидает выполнения
    assigned = "assigned"        # Назначена флористу
    in_progress = "in_progress"  # В работе
    quality_check = "quality_check"  # На проверке качества
    completed = "completed"      # Завершена
    cancelled = "cancelled"      # Отменена


class TaskPriority(str, enum.Enum):
    urgent = "urgent"      # Срочная (< 2 часа)
    high = "high"         # Высокий приоритет (< 4 часа)
    normal = "normal"     # Обычный приоритет
    low = "low"          # Низкий приоритет


class FloristTask(Base):
    __tablename__ = "florist_tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    florist_id = Column(Integer)  # ForeignKey("users.id") - будет добавлено после создания таблицы users
    
    # Task info
    task_type = Column(String, nullable=False, default="bouquet")  # bouquet, composition, decoration
    status = Column(SQLEnum(TaskStatus), nullable=False, default=TaskStatus.pending)
    priority = Column(SQLEnum(TaskPriority), nullable=False, default=TaskPriority.normal)
    
    # Time tracking
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    assigned_at = Column(DateTime(timezone=True))
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    deadline = Column(DateTime(timezone=True))
    
    # Work details
    estimated_minutes = Column(Integer, default=30)
    actual_minutes = Column(Integer)
    quality_score = Column(Float)  # 1-5 оценка качества
    
    # Photos
    work_photos = Column(JSON)  # ["url1", "url2"] - фото процесса работы
    result_photos = Column(JSON)  # ["url1", "url2"] - фото готового букета
    
    # Notes
    instructions = Column(String)  # Особые инструкции для флориста
    florist_notes = Column(String)  # Заметки флориста
    quality_notes = Column(String)  # Заметки проверяющего
    
    # Relationships
    order = relationship("Order")
    # florist = relationship("User")  # Будет добавлено с User моделью
    items = relationship("TaskItem", back_populates="task", cascade="all, delete-orphan")
    
    @property
    def is_overdue(self):
        """Проверяет, просрочена ли задача"""
        from datetime import datetime, timezone
        
        if not self.deadline or self.status in [TaskStatus.completed, TaskStatus.cancelled]:
            return False
            
        # Use timezone-aware datetime for comparison
        now = datetime.now(timezone.utc)
        
        # Ensure deadline is timezone-aware
        if self.deadline.tzinfo is None:
            # If deadline is naive, assume it's UTC
            deadline_aware = self.deadline.replace(tzinfo=timezone.utc)
        else:
            deadline_aware = self.deadline
            
        return now > deadline_aware
    
    @property
    def time_spent(self):
        """Возвращает фактическое время выполнения"""
        if self.started_at and self.completed_at:
            return int((self.completed_at - self.started_at).total_seconds() / 60)
        return self.actual_minutes or 0


class TaskItem(Base):
    __tablename__ = "task_items"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("florist_tasks.id"), nullable=False)
    order_item_id = Column(Integer, ForeignKey("order_items.id"), nullable=False)
    
    # Work details
    quantity = Column(Integer, nullable=False)
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime(timezone=True))
    
    # Quality check
    quality_approved = Column(Boolean)
    quality_notes = Column(String)
    
    # Relationships
    task = relationship("FloristTask", back_populates="items")
    order_item = relationship("OrderItem")