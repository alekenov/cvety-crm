from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

from app.models.production import TaskStatus, TaskPriority


# Base schemas
class TaskItemBase(BaseModel):
    order_item_id: int
    quantity: int = Field(gt=0)


class TaskItemCreate(TaskItemBase):
    pass


class TaskItemUpdate(BaseModel):
    is_completed: Optional[bool] = None
    quality_approved: Optional[bool] = None
    quality_notes: Optional[str] = None


class TaskItem(TaskItemBase):
    id: int
    task_id: int
    is_completed: bool = False
    completed_at: Optional[datetime] = None
    quality_approved: Optional[bool] = None
    quality_notes: Optional[str] = None
    
    class Config:
        from_attributes = True


# FloristTask schemas
class FloristTaskBase(BaseModel):
    order_id: int
    task_type: str = Field(default="bouquet", pattern="^(bouquet|composition|decoration)$")
    priority: TaskPriority = TaskPriority.normal
    estimated_minutes: int = Field(default=30, ge=5, le=480)
    deadline: Optional[datetime] = None
    instructions: Optional[str] = None


class FloristTaskCreate(FloristTaskBase):
    items: List[TaskItemCreate]


class FloristTaskUpdate(BaseModel):
    florist_id: Optional[int] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    deadline: Optional[datetime] = None
    instructions: Optional[str] = None
    florist_notes: Optional[str] = None
    quality_notes: Optional[str] = None
    quality_score: Optional[float] = Field(None, ge=1, le=5)
    actual_minutes: Optional[int] = Field(None, ge=0)
    work_photos: Optional[List[str]] = None
    result_photos: Optional[List[str]] = None


class FloristTaskAssign(BaseModel):
    florist_id: int


class FloristTaskStart(BaseModel):
    florist_notes: Optional[str] = None


class FloristTaskComplete(BaseModel):
    actual_minutes: Optional[int] = Field(None, ge=0)
    florist_notes: Optional[str] = None
    result_photos: Optional[List[str]] = None


class FloristTaskQualityCheck(BaseModel):
    quality_score: float = Field(ge=1, le=5)
    quality_approved: bool
    quality_notes: Optional[str] = None


class FloristTask(FloristTaskBase):
    id: int
    florist_id: Optional[int] = None
    status: TaskStatus = TaskStatus.pending
    created_at: datetime
    assigned_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    actual_minutes: Optional[int] = None
    quality_score: Optional[float] = None
    work_photos: Optional[List[str]] = None
    result_photos: Optional[List[str]] = None
    florist_notes: Optional[str] = None
    quality_notes: Optional[str] = None
    items: List[TaskItem] = []
    is_overdue: bool = False
    time_spent: int = 0
    
    class Config:
        from_attributes = True


# Statistics schemas
class FloristStats(BaseModel):
    florist_id: int
    total_tasks: int = 0
    completed_tasks: int = 0
    in_progress_tasks: int = 0
    average_quality_score: Optional[float] = None
    average_completion_time: Optional[int] = None  # в минутах
    overdue_tasks: int = 0


class TaskQueueStats(BaseModel):
    pending_tasks: int = 0
    assigned_tasks: int = 0
    in_progress_tasks: int = 0
    overdue_tasks: int = 0
    urgent_tasks: int = 0
    tasks_by_type: dict = {}  # {"bouquet": 5, "composition": 2, ...}
    tasks_by_priority: dict = {}  # {"urgent": 1, "high": 3, ...}