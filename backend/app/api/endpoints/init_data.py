from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import logging

from app.api import deps
from app.models.product import Product
from app.models.customer import Customer, CustomerAddress
from app.models.settings import CompanySettings
from app.models.warehouse import WarehouseItem
from app.models.order import Order, OrderItem, OrderStatus, DeliveryMethod
from app.models.production import FloristTask, TaskStatus, TaskPriority, TaskItem
import secrets

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/initialize")
def initialize_test_data(
    db: Session = Depends(deps.get_db),
    force: bool = False
):
    """
    Initialize database with test data.
    Set force=true to overwrite existing data.
    """
    try:
        # Check if data already exists
        existing_products = db.query(Product).count()
        if existing_products > 0 and not force:
            return {
                "status": "skipped",
                "message": "Database already contains data. Use force=true to overwrite.",
                "counts": {
                    "products": existing_products,
                    "customers": db.query(Customer).count(),
                    "warehouse_items": db.query(WarehouseItem).count(),
                    "orders": db.query(Order).count(),
                    "florist_tasks": db.query(FloristTask).count()
                }
            }
        
        # Clear existing data if force=true
        if force:
            # Delete in correct order to handle foreign key constraints
            db.query(TaskItem).delete()
            db.query(FloristTask).delete()
            db.query(OrderItem).delete()
            db.query(Order).delete()
            db.query(CustomerAddress).delete()
            db.query(Customer).delete()
            db.query(WarehouseItem).delete()
            db.query(Product).delete()
            db.query(CompanySettings).delete()
            db.commit()
            logger.info("Cleared existing data")
        
        # Create test products based on actual model structure
        products = [
            Product(
                name="Роза красная",
                category="bouquet",
                description="Классическая красная роза",
                cost_price=200,
                retail_price=500,
                is_active=True
            ),
            Product(
                name="Роза белая",
                category="bouquet",
                description="Элегантная белая роза",
                cost_price=200,
                retail_price=500,
                is_active=True
            ),
            Product(
                name="Тюльпан желтый",
                category="bouquet",
                description="Весенний желтый тюльпан",
                cost_price=120,
                retail_price=300,
                is_active=True
            ),
            Product(
                name="Лилия розовая",
                category="composition",
                description="Ароматная розовая лилия",
                cost_price=300,
                retail_price=700,
                is_active=True
            ),
            Product(
                name="Букет \"Весенний\"",
                category="composition",
                description="Готовый весенний букет из тюльпанов и нарциссов",
                cost_price=1500,
                retail_price=3500,
                is_active=True
            )
        ]
        
        for product in products:
            db.add(product)
        db.commit()
        logger.info(f"Created {len(products)} products")
        
        # Create test customers
        customers = [
            Customer(
                name="Иван Иванов",
                phone="+7 777 123 4567",
                email="ivan@example.com",
                notes="Постоянный клиент",
                source="phone"
            ),
            Customer(
                name="Мария Петрова",
                phone="+7 777 234 5678",
                email="maria@example.com",
                notes="Предпочитает розы",
                preferences="Розы, светлые тона",
                source="instagram"
            ),
            Customer(
                name="Алексей Сидоров",
                phone="+7 777 345 6789",
                email="alexey@example.com",
                notes="Корпоративный клиент",
                source="website"
            )
        ]
        
        for customer in customers:
            db.add(customer)
        db.commit()
        
        # Add addresses for customers
        customer1 = customers[0]
        address1 = CustomerAddress(
            customer_id=customer1.id,
            address="ул. Абая 150, кв 25, г. Алматы",
            label="Дом"
        )
        db.add(address1)
        
        customer2 = customers[1]
        address2 = CustomerAddress(
            customer_id=customer2.id,
            address="пр. Достык 89, офис 305, г. Алматы",
            label="Офис"
        )
        db.add(address2)
        db.commit()
        logger.info(f"Created {len(customers)} customers with addresses")
        
        # Create warehouse items based on actual model structure
        warehouse_items = [
            WarehouseItem(
                sku="ROSE-RED-001",
                batch_code="BATCH-2024-001",
                variety="Роза красная Freedom",
                height_cm=60,
                farm="EcuaFlor",
                supplier="FlowerImport KZ",
                delivery_date=datetime.now(),
                currency="USD",
                rate=450.0,
                cost=0.45,
                recommended_price=500,
                qty=100,
                reserved_qty=0,
                price=500
            ),
            WarehouseItem(
                sku="ROSE-WHITE-001",
                batch_code="BATCH-2024-002",
                variety="Роза белая Avalanche",
                height_cm=70,
                farm="EcuaFlor",
                supplier="FlowerImport KZ",
                delivery_date=datetime.now(),
                currency="USD",
                rate=450.0,
                cost=0.50,
                recommended_price=550,
                qty=80,
                reserved_qty=0,
                price=550
            ),
            WarehouseItem(
                sku="TULIP-YELLOW-001",
                batch_code="BATCH-2024-003",
                variety="Тюльпан желтый Strong Gold",
                height_cm=45,
                farm="Holland Flowers",
                supplier="EuroFlora",
                delivery_date=datetime.now(),
                currency="EUR",
                rate=500.0,
                cost=0.25,
                recommended_price=300,
                qty=200,
                reserved_qty=0,
                price=300
            )
        ]
        
        for item in warehouse_items:
            db.add(item)
        db.commit()
        logger.info(f"Created {len(warehouse_items)} warehouse items")
        
        # Create company settings
        settings = CompanySettings(
            name="Cvety.kz",
            phones=["+7 777 100 2030", "+7 727 100 2030"],
            email="info@cvety.kz",
            address="г. Алматы, ул. Розыбакиева 247",
            working_hours={"from": "09:00", "to": "20:00"},
            delivery_zones=[
                {
                    "name": "Центр города",
                    "price": 1000,
                    "min_order": 5000,
                    "description": "Алмалинский, Медеуский районы"
                },
                {
                    "name": "Окраины",
                    "price": 2000,
                    "min_order": 7000,
                    "description": "Наурызбайский, Алатауский районы"
                }
            ]
        )
        db.add(settings)
        db.commit()
        logger.info("Created company settings")
        
        # Create test orders
        orders = []
        
        # Order 1: New order with urgent priority
        order1 = Order(
            customer_id=customers[0].id,
            customer_phone=customers[0].phone,
            recipient_phone=customers[0].phone,
            recipient_name=customers[0].name,
            address="ул. Абая 150, кв 25, г. Алматы",
            delivery_method=DeliveryMethod.delivery,
            delivery_window={
                "from": (datetime.now() + timedelta(hours=3)).isoformat(),
                "to": (datetime.now() + timedelta(hours=5)).isoformat()
            },
            flower_sum=7000,
            delivery_fee=1000,
            total=8000,
            status=OrderStatus.new,
            tracking_token=secrets.token_urlsafe(16)
        )
        db.add(order1)
        db.flush()
        
        # Add items to order 1
        order1_item1 = OrderItem(
            order_id=order1.id,
            product_id=products[0].id,  # Роза красная
            product_name=products[0].name,
            product_category=products[0].category,
            quantity=7,
            price=500,
            total=3500,
            warehouse_item_id=warehouse_items[0].id
        )
        order1_item2 = OrderItem(
            order_id=order1.id,
            product_id=products[4].id,  # Букет "Весенний"
            product_name=products[4].name,
            product_category=products[4].category,
            quantity=1,
            price=3500,
            total=3500,
            warehouse_item_id=None
        )
        db.add(order1_item1)
        db.add(order1_item2)
        orders.append(order1)
        
        # Order 2: Paid order, ready for production
        order2 = Order(
            customer_id=customers[1].id,
            customer_phone=customers[1].phone,
            recipient_phone="+7 777 999 8888",
            recipient_name="Анна Сергеева",
            address="пр. Достык 89, офис 305, г. Алматы",
            delivery_method=DeliveryMethod.delivery,
            delivery_window={
                "from": (datetime.now() + timedelta(hours=5)).isoformat(),
                "to": (datetime.now() + timedelta(hours=7)).isoformat()
            },
            flower_sum=10000,
            delivery_fee=1000,
            total=11000,
            status=OrderStatus.paid,
            tracking_token=secrets.token_urlsafe(16)
        )
        db.add(order2)
        db.flush()
        
        # Add items to order 2
        order2_item1 = OrderItem(
            order_id=order2.id,
            product_id=products[1].id,  # Роза белая
            product_name=products[1].name,
            product_category=products[1].category,
            quantity=10,
            price=500,
            total=5000,
            warehouse_item_id=warehouse_items[1].id
        )
        order2_item2 = OrderItem(
            order_id=order2.id,
            product_id=products[3].id,  # Лилия розовая
            product_name=products[3].name,
            product_category=products[3].category,
            quantity=7,
            price=700,
            total=4900,
            warehouse_item_id=None
        )
        db.add(order2_item1)
        db.add(order2_item2)
        orders.append(order2)
        
        # Order 3: Self-pickup order
        order3 = Order(
            customer_id=customers[2].id,
            customer_phone=customers[2].phone,
            recipient_phone=customers[2].phone,
            recipient_name=customers[2].name,
            address="Самовывоз",
            delivery_method=DeliveryMethod.self_pickup,
            delivery_window={
                "from": (datetime.now() + timedelta(hours=2)).isoformat(),
                "to": (datetime.now() + timedelta(hours=3)).isoformat()
            },
            flower_sum=15000,
            delivery_fee=0,
            total=15000,
            status=OrderStatus.paid,
            tracking_token=secrets.token_urlsafe(16)
        )
        db.add(order3)
        db.flush()
        
        # Add items to order 3
        order3_item1 = OrderItem(
            order_id=order3.id,
            product_id=products[2].id,  # Тюльпан желтый
            product_name=products[2].name,
            product_category=products[2].category,
            quantity=25,
            price=300,
            total=7500,
            warehouse_item_id=warehouse_items[2].id
        )
        order3_item2 = OrderItem(
            order_id=order3.id,
            product_id=products[4].id,  # Букет "Весенний"
            product_name=products[4].name,
            product_category=products[4].category,
            quantity=2,
            price=3500,
            total=7000,
            warehouse_item_id=None
        )
        db.add(order3_item1)
        db.add(order3_item2)
        orders.append(order3)
        
        db.commit()
        logger.info(f"Created {len(orders)} orders")
        
        # Create production tasks for paid orders
        tasks = []
        
        # Task 1: Urgent task for order 2
        task1 = FloristTask(
            order_id=order2.id,
            task_type="bouquet",
            status=TaskStatus.pending,
            priority=TaskPriority.urgent,
            deadline=datetime.now() + timedelta(hours=2),
            estimated_minutes=45,
            instructions="Букет для офиса. Клиент предпочитает светлые тона. Упаковать в крафт-бумагу."
        )
        db.add(task1)
        db.flush()
        
        # Add task items for task 1
        for item in [order2_item1, order2_item2]:
            task_item = TaskItem(
                task_id=task1.id,
                order_item_id=item.id,
                quantity=item.quantity
            )
            db.add(task_item)
        tasks.append(task1)
        
        # Task 2: High priority task for order 3 (self-pickup)
        task2 = FloristTask(
            order_id=order3.id,
            task_type="composition",
            status=TaskStatus.assigned,
            priority=TaskPriority.high,
            florist_id=1,  # Assigned to florist ID 1
            assigned_at=datetime.now() - timedelta(minutes=30),
            deadline=datetime.now() + timedelta(hours=1, minutes=30),
            estimated_minutes=60,
            instructions="Большая композиция с тюльпанами. Клиент заберет лично. Добавить декоративную зелень."
        )
        db.add(task2)
        db.flush()
        
        # Add task items for task 2
        for item in [order3_item1, order3_item2]:
            task_item = TaskItem(
                task_id=task2.id,
                order_item_id=item.id,
                quantity=item.quantity
            )
            db.add(task_item)
        tasks.append(task2)
        
        # Task 3: In progress task
        task3 = FloristTask(
            order_id=order1.id,
            task_type="bouquet",
            status=TaskStatus.in_progress,
            priority=TaskPriority.normal,
            florist_id=2,  # Assigned to florist ID 2
            assigned_at=datetime.now() - timedelta(hours=1),
            started_at=datetime.now() - timedelta(minutes=20),
            deadline=datetime.now() + timedelta(hours=2),
            estimated_minutes=30,
            instructions="Классический букет из красных роз. Добавить гипсофилу.",
            florist_notes="Начал работу. Розы в отличном состоянии."
        )
        db.add(task3)
        db.flush()
        
        # Add task items for task 3
        for item in [order1_item1, order1_item2]:
            task_item = TaskItem(
                task_id=task3.id,
                order_item_id=item.id,
                quantity=item.quantity
            )
            db.add(task_item)
        tasks.append(task3)
        
        # Task 4: Completed task (for demo)
        completed_order = Order(
            customer_id=customers[0].id,
            customer_phone=customers[0].phone,
            recipient_phone="+7 777 555 4444",
            recipient_name="Тест Завершенный",
            address="ул. Тестовая 1",
            delivery_method=DeliveryMethod.delivery,
            delivery_window={
                "from": (datetime.now() - timedelta(hours=3)).isoformat(),
                "to": (datetime.now() - timedelta(hours=1)).isoformat()
            },
            flower_sum=5000,
            delivery_fee=1000,
            total=6000,
            status=OrderStatus.assembled,
            tracking_token=secrets.token_urlsafe(16)
        )
        db.add(completed_order)
        db.flush()
        
        task4 = FloristTask(
            order_id=completed_order.id,
            task_type="bouquet",
            status=TaskStatus.completed,
            priority=TaskPriority.normal,
            florist_id=1,
            assigned_at=datetime.now() - timedelta(hours=4),
            started_at=datetime.now() - timedelta(hours=3, minutes=30),
            completed_at=datetime.now() - timedelta(hours=2),
            deadline=datetime.now() - timedelta(hours=1),
            estimated_minutes=30,
            actual_minutes=25,
            quality_score=4.8,
            instructions="Букет для дня рождения",
            florist_notes="Выполнено согласно требованиям",
            quality_notes="Отличная работа, аккуратная упаковка"
        )
        db.add(task4)
        tasks.append(task4)
        
        # Task 5: Quality check task
        quality_order = Order(
            customer_id=customers[1].id,
            customer_phone=customers[1].phone,
            recipient_phone=customers[1].phone,
            recipient_name=customers[1].name,
            address="ул. Качества 10",
            delivery_method=DeliveryMethod.delivery,
            delivery_window={
                "from": (datetime.now() + timedelta(hours=1)).isoformat(),
                "to": (datetime.now() + timedelta(hours=3)).isoformat()
            },
            flower_sum=8000,
            delivery_fee=1000,
            total=9000,
            status=OrderStatus.assembled,
            tracking_token=secrets.token_urlsafe(16)
        )
        db.add(quality_order)
        db.flush()
        
        task5 = FloristTask(
            order_id=quality_order.id,
            task_type="composition",
            status=TaskStatus.quality_check,
            priority=TaskPriority.normal,
            florist_id=3,
            assigned_at=datetime.now() - timedelta(hours=2),
            started_at=datetime.now() - timedelta(hours=1, minutes=30),
            completed_at=datetime.now() - timedelta(minutes=15),
            deadline=datetime.now() + timedelta(hours=1),
            estimated_minutes=45,
            actual_minutes=40,
            instructions="Композиция для юбилея. Использовать розы и лилии.",
            florist_notes="Выполнено с использованием свежих цветов",
            result_photos=["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"]
        )
        db.add(task5)
        tasks.append(task5)
        
        db.commit()
        logger.info(f"Created {len(tasks)} production tasks")
        
        return {
            "status": "success",
            "message": "Test data initialized successfully",
            "counts": {
                "products": len(products),
                "customers": len(customers),
                "warehouse_items": len(warehouse_items),
                "orders": len(orders) + 2,  # +2 for completed and quality check orders
                "florist_tasks": len(tasks),
                "settings": 1
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to initialize test data: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
def get_data_status(db: Session = Depends(deps.get_db)):
    """Get current data counts in the database"""
    try:
        return {
            "products": db.query(Product).count(),
            "customers": db.query(Customer).count(),
            "warehouse_items": db.query(WarehouseItem).count(),
            "orders": db.query(Order).count(),
            "florist_tasks": db.query(FloristTask).count(),
            "company_settings": db.query(CompanySettings).count()
        }
    except Exception as e:
        logger.error(f"Failed to get data status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))