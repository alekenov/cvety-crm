from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import crud, schemas
from app.api import deps
from app.models.production import TaskStatus, TaskPriority
from app.models.shop import Shop
from app.services.task_queue import TaskQueueService

router = APIRouter()


@router.post("/tasks/", response_model=schemas.FloristTask, status_code=201)
def create_task(
    *,
    db: Session = Depends(deps.get_db),
    task_in: schemas.FloristTaskCreate
):
    """
    Создать новую задачу для флориста.
    """
    return crud.florist_task.create_with_items(db=db, obj_in=task_in)


@router.get("/tasks/")
def read_tasks(
    db: Session = Depends(deps.get_db),
    _: Shop = Depends(deps.get_current_shop),  # Require auth
    skip: int = 0,
    limit: int = 100,
    status: Optional[TaskStatus] = None,
    priority: Optional[TaskPriority] = None,
    florist_id: Optional[int] = None,
    order_id: Optional[int] = None
):
    """
    Получить список задач с фильтрацией.
    """
    query = db.query(crud.florist_task.model)
    
    if status:
        query = query.filter(crud.florist_task.model.status == status)
    if priority:
        query = query.filter(crud.florist_task.model.priority == priority)
    if florist_id:
        query = query.filter(crud.florist_task.model.florist_id == florist_id)
    if order_id:
        query = query.filter(crud.florist_task.model.order_id == order_id)
    
    # Get total count before pagination
    total = query.count()
    
    # Get paginated items
    items = query.order_by(
        crud.florist_task.model.priority.desc(),
        crud.florist_task.model.created_at
    ).offset(skip).limit(limit).all()
    
    # Return in the expected format
    return {
        "items": items,
        "total": total
    }


@router.get("/tasks/pending")
def read_pending_tasks(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100
):
    """
    Получить список ожидающих задач.
    """
    items = crud.florist_task.get_pending_tasks(db=db, skip=skip, limit=limit)
    return {
        "items": items,
        "total": len(items)
    }


@router.get("/tasks/overdue", response_model=List[schemas.FloristTask])
def read_overdue_tasks(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100
):
    """
    Получить список просроченных задач.
    """
    return crud.florist_task.get_overdue_tasks(db=db, skip=skip, limit=limit)


@router.get("/tasks/{task_id}", response_model=schemas.FloristTask)
def read_task(
    *,
    db: Session = Depends(deps.get_db),
    task_id: int
):
    """
    Получить задачу по ID.
    """
    task = crud.florist_task.get(db=db, id=task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.put("/tasks/{task_id}", response_model=schemas.FloristTask)
def update_task(
    *,
    db: Session = Depends(deps.get_db),
    task_id: int,
    task_in: schemas.FloristTaskUpdate
):
    """
    Обновить задачу.
    """
    task = crud.florist_task.get(db=db, id=task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return crud.florist_task.update(db=db, db_obj=task, obj_in=task_in)


@router.post("/tasks/{task_id}/assign", response_model=schemas.FloristTask, status_code=201)
def assign_task(
    *,
    db: Session = Depends(deps.get_db),
    task_id: int,
    assign_in: schemas.FloristTaskAssign
):
    """
    Назначить задачу флористу.
    """
    task = crud.florist_task.assign_to_florist(
        db=db, task_id=task_id, florist_id=assign_in.florist_id
    )
    if not task:
        raise HTTPException(
            status_code=400, 
            detail="Task cannot be assigned (not found or wrong status)"
        )
    return task


@router.post("/tasks/{task_id}/start", response_model=schemas.FloristTask, status_code=201)
def start_task(
    *,
    db: Session = Depends(deps.get_db),
    task_id: int,
    start_in: schemas.FloristTaskStart
):
    """
    Начать выполнение задачи.
    """
    task = crud.florist_task.start_task(
        db=db, task_id=task_id, florist_notes=start_in.florist_notes
    )
    if not task:
        raise HTTPException(
            status_code=400,
            detail="Task cannot be started (not found or wrong status)"
        )
    return task


@router.post("/tasks/{task_id}/complete", response_model=schemas.FloristTask, status_code=201)
def complete_task(
    *,
    db: Session = Depends(deps.get_db),
    task_id: int,
    complete_in: schemas.FloristTaskComplete
):
    """
    Завершить задачу.
    """
    task = crud.florist_task.complete_task(
        db=db,
        task_id=task_id,
        actual_minutes=complete_in.actual_minutes,
        florist_notes=complete_in.florist_notes,
        result_photos=complete_in.result_photos
    )
    if not task:
        raise HTTPException(
            status_code=400,
            detail="Task cannot be completed (not found or wrong status)"
        )
    return task


@router.post("/tasks/{task_id}/quality-check", response_model=schemas.FloristTask, status_code=201)
def quality_check_task(
    *,
    db: Session = Depends(deps.get_db),
    task_id: int,
    quality_in: schemas.FloristTaskQualityCheck
):
    """
    Проверить качество выполненной задачи.
    """
    task = crud.florist_task.quality_check(
        db=db,
        task_id=task_id,
        quality_score=quality_in.quality_score,
        quality_approved=quality_in.quality_approved,
        quality_notes=quality_in.quality_notes
    )
    if not task:
        raise HTTPException(
            status_code=400,
            detail="Task cannot be quality checked (not found or wrong status)"
        )
    return task


@router.post("/tasks/{task_id}/cancel", response_model=schemas.FloristTask, status_code=201)
def cancel_task(
    *,
    db: Session = Depends(deps.get_db),
    task_id: int
):
    """
    Отменить задачу.
    """
    task = crud.florist_task.cancel_task(db=db, task_id=task_id)
    if not task:
        raise HTTPException(
            status_code=400,
            detail="Task cannot be cancelled (not found or already completed)"
        )
    return task


@router.get("/florists/{florist_id}/stats", response_model=schemas.FloristStats)
def get_florist_stats(
    *,
    db: Session = Depends(deps.get_db),
    florist_id: int
):
    """
    Получить статистику флориста.
    """
    return crud.florist_task.get_florist_stats(db=db, florist_id=florist_id)


@router.get("/queue/stats", response_model=schemas.TaskQueueStats)
def get_queue_stats(
    *,
    db: Session = Depends(deps.get_db)
):
    """
    Получить статистику очереди задач.
    """
    return crud.florist_task.get_queue_stats(db=db)


# Task items endpoints
@router.get("/tasks/{task_id}/items", response_model=List[schemas.TaskItem])
def read_task_items(
    *,
    db: Session = Depends(deps.get_db),
    task_id: int
):
    """
    Получить позиции задачи.
    """
    return crud.task_item.get_by_task(db=db, task_id=task_id)


@router.put("/task-items/{item_id}", response_model=schemas.TaskItem)
def update_task_item(
    *,
    db: Session = Depends(deps.get_db),
    item_id: int,
    item_in: schemas.TaskItemUpdate
):
    """
    Обновить позицию задачи.
    """
    item = crud.task_item.get(db=db, id=item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Task item not found")
    return crud.task_item.update(db=db, db_obj=item, obj_in=item_in)


@router.post("/task-items/{item_id}/complete", response_model=schemas.TaskItem, status_code=201)
def complete_task_item(
    *,
    db: Session = Depends(deps.get_db),
    item_id: int,
    quality_approved: Optional[bool] = None,
    quality_notes: Optional[str] = None
):
    """
    Отметить позицию как выполненную.
    """
    item = crud.task_item.complete_item(
        db=db,
        item_id=item_id,
        quality_approved=quality_approved,
        quality_notes=quality_notes
    )
    if not item:
        raise HTTPException(status_code=404, detail="Task item not found")
    return item


# Task queue endpoints
@router.post("/queue/create-from-order/{order_id}", response_model=List[schemas.FloristTask], status_code=201)
def create_tasks_from_order(
    *,
    db: Session = Depends(deps.get_db),
    order_id: int
):
    """
    Создать задачи для заказа.
    """
    tasks = TaskQueueService.create_tasks_from_order(db=db, order_id=order_id)
    if not tasks:
        raise HTTPException(status_code=404, detail="Order not found or no items to process")
    return tasks


@router.post("/queue/get-next-task/{florist_id}", response_model=Optional[schemas.FloristTask], status_code=201)
def get_next_task(
    *,
    db: Session = Depends(deps.get_db),
    florist_id: int
):
    """
    Получить следующую задачу для флориста.
    """
    task = TaskQueueService.get_next_task_for_florist(db=db, florist_id=florist_id)
    if not task:
        return None
    return task


@router.post("/queue/distribute", status_code=201)
def distribute_tasks(
    *,
    db: Session = Depends(deps.get_db)
):
    """
    Распределить ожидающие задачи между флористами.
    """
    return TaskQueueService.distribute_pending_tasks(db=db)


@router.post("/queue/check-overdue", status_code=201)
def check_overdue_tasks(
    *,
    db: Session = Depends(deps.get_db)
):
    """
    Проверить и обновить просроченные задачи.
    """
    updated = TaskQueueService.check_and_update_overdue_tasks(db=db)
    return {"updated_tasks": updated}


@router.get("/queue/workload")
def get_workload(
    *,
    db: Session = Depends(deps.get_db)
):
    """
    Получить загрузку флористов.
    """
    return TaskQueueService.get_workload_by_florist(db=db)


@router.get("/florists")
def get_florists(
    *,
    db: Session = Depends(deps.get_db),
    _: Shop = Depends(deps.get_current_shop)  # Require auth
):
    """
    Получить список флористов.
    """
    # For now, return a static list of florists
    # In the future, this should come from a users table with role=florist
    return {
        "items": [
            {"id": 1, "name": "Марина", "status": "active", "current_tasks": 0},
            {"id": 2, "name": "Алия", "status": "active", "current_tasks": 0},
            {"id": 3, "name": "Светлана", "status": "active", "current_tasks": 0},
            {"id": 4, "name": "Гульнара", "status": "active", "current_tasks": 0}
        ],
        "total": 4
    }