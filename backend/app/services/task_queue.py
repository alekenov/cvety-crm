from typing import List, Optional, Dict
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func

from app import crud
from app.models.production import FloristTask, TaskStatus, TaskPriority
from app.models.order import Order, OrderStatus


class TaskQueueService:
    """Сервис для управления очередью задач и их распределением"""
    
    @staticmethod
    def create_tasks_from_order(db: Session, order_id: int) -> List[FloristTask]:
        """Создать задачи для заказа"""
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            return []
        
        tasks = []
        
        # Определяем приоритет на основе времени доставки
        priority = TaskPriority.normal
        deadline = None
        
        if order.delivery_window:
            # delivery_window is JSON like {"from": "2024-01-26T14:00:00", "to": "2024-01-26T16:00:00"}
            if isinstance(order.delivery_window, dict) and "from" in order.delivery_window:
                deadline = datetime.fromisoformat(order.delivery_window["from"].replace("Z", "+00:00"))
                hours_until_delivery = (deadline - datetime.now(timezone.utc)).total_seconds() / 3600
                if hours_until_delivery < 2:
                    priority = TaskPriority.urgent
                elif hours_until_delivery < 4:
                    priority = TaskPriority.high
        
        # Группируем позиции заказа по типу (букеты, композиции, оформление)
        bouquet_items = []
        composition_items = []
        decoration_items = []
        
        for item in order.items:
            if item.product:
                # Простая классификация по названию продукта
                product_name = item.product.name.lower()
                if "композиц" in product_name or "корзин" in product_name:
                    composition_items.append(item)
                elif "оформлен" in product_name or "декор" in product_name:
                    decoration_items.append(item)
                else:
                    bouquet_items.append(item)
        
        # Создаем задачи для каждого типа
        if bouquet_items:
            from app.schemas.production import FloristTaskCreate
            task = crud.florist_task.create_with_items(
                db=db,
                obj_in=FloristTaskCreate(
                    order_id=order_id,
                    task_type="bouquet",
                    priority=priority,
                    estimated_minutes=len(bouquet_items) * 20,  # 20 минут на букет
                    deadline=deadline,
                    instructions=order.issue_comment,  # Using issue_comment as notes
                    items=[{"order_item_id": item.id, "quantity": item.quantity} for item in bouquet_items]
                )
            )
            tasks.append(task)
        
        if composition_items:
            task = crud.florist_task.create_with_items(
                db=db,
                obj_in=FloristTaskCreate(
                    order_id=order_id,
                    task_type="composition",
                    priority=priority,
                    estimated_minutes=len(composition_items) * 40,  # 40 минут на композицию
                    deadline=deadline,
                    instructions=order.issue_comment,  # Using issue_comment as notes
                    items=[{"order_item_id": item.id, "quantity": item.quantity} for item in composition_items]
                )
            )
            tasks.append(task)
        
        if decoration_items:
            task = crud.florist_task.create_with_items(
                db=db,
                obj_in=FloristTaskCreate(
                    order_id=order_id,
                    task_type="decoration",
                    priority=priority,
                    estimated_minutes=len(decoration_items) * 15,  # 15 минут на оформление
                    deadline=deadline,
                    instructions=order.issue_comment,  # Using issue_comment as notes
                    items=[{"order_item_id": item.id, "quantity": item.quantity} for item in decoration_items]
                )
            )
            tasks.append(task)
        
        return tasks
    
    @staticmethod
    def get_next_task_for_florist(db: Session, florist_id: int) -> Optional[FloristTask]:
        """Получить следующую задачу для флориста"""
        # Проверяем, нет ли у флориста активной задачи
        active_task = db.query(FloristTask).filter(
            and_(
                FloristTask.florist_id == florist_id,
                FloristTask.status.in_([TaskStatus.assigned, TaskStatus.in_progress])
            )
        ).first()
        
        if active_task:
            return None  # У флориста уже есть активная задача
        
        # Получаем статистику флориста для определения его специализации
        stats = crud.florist_task.get_florist_stats(db=db, florist_id=florist_id)
        
        # Ищем подходящую задачу с учетом приоритета
        task = db.query(FloristTask).filter(
            FloristTask.status == TaskStatus.pending
        ).order_by(
            FloristTask.priority.desc(),
            FloristTask.created_at
        ).first()
        
        if task:
            # Назначаем задачу флористу
            return crud.florist_task.assign_to_florist(
                db=db, task_id=task.id, florist_id=florist_id
            )
        
        return None
    
    @staticmethod
    def distribute_pending_tasks(db: Session) -> Dict[str, int]:
        """Распределить ожидающие задачи между свободными флористами"""
        distributed = 0
        skipped = 0
        
        # Получаем все ожидающие задачи
        pending_tasks = crud.florist_task.get_pending_tasks(db=db, limit=100)
        
        # Для демонстрации - простое распределение
        # В реальности здесь должна быть логика получения списка активных флористов
        available_florists = [1, 2, 3]  # Заглушка - ID доступных флористов
        
        for task in pending_tasks:
            # Находим флориста без активных задач
            assigned = False
            for florist_id in available_florists:
                active_task = db.query(FloristTask).filter(
                    and_(
                        FloristTask.florist_id == florist_id,
                        FloristTask.status.in_([TaskStatus.assigned, TaskStatus.in_progress])
                    )
                ).first()
                
                if not active_task:
                    # Назначаем задачу
                    crud.florist_task.assign_to_florist(
                        db=db, task_id=task.id, florist_id=florist_id
                    )
                    distributed += 1
                    assigned = True
                    break
            
            if not assigned:
                skipped += 1
        
        return {
            "distributed": distributed,
            "skipped": skipped,
            "total_pending": len(pending_tasks)
        }
    
    @staticmethod
    def check_and_update_overdue_tasks(db: Session) -> int:
        """Проверить и обновить просроченные задачи"""
        overdue_tasks = crud.florist_task.get_overdue_tasks(db=db, limit=100)
        updated = 0
        
        for task in overdue_tasks:
            # Повышаем приоритет просроченных задач
            if task.priority != TaskPriority.urgent:
                task.priority = TaskPriority.urgent
                db.add(task)
                updated += 1
        
        db.commit()
        return updated
    
    @staticmethod
    def get_workload_by_florist(db: Session) -> Dict[int, Dict]:
        """Получить загрузку флористов"""
        # В реальности здесь должен быть список всех флористов из таблицы users
        florist_ids = [1, 2, 3]  # Заглушка
        
        workload = {}
        for florist_id in florist_ids:
            # Активные задачи
            active_tasks = db.query(FloristTask).filter(
                and_(
                    FloristTask.florist_id == florist_id,
                    FloristTask.status.in_([TaskStatus.assigned, TaskStatus.in_progress])
                )
            ).all()
            
            # Завершенные сегодня
            today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
            completed_today = db.query(FloristTask).filter(
                and_(
                    FloristTask.florist_id == florist_id,
                    FloristTask.status == TaskStatus.completed,
                    FloristTask.completed_at >= today_start
                )
            ).count()
            
            # Расчет загрузки
            total_minutes = sum(task.estimated_minutes or 30 for task in active_tasks)
            
            workload[florist_id] = {
                "active_tasks": len(active_tasks),
                "completed_today": completed_today,
                "estimated_minutes_remaining": total_minutes,
                "current_task": active_tasks[0].id if active_tasks else None
            }
        
        return workload