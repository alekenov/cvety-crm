from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import logging

from app.api import deps
from app.models.product import Product
from app.models.customer import Customer, CustomerAddress
from app.models.settings import CompanySettings
from app.models.warehouse import WarehouseItem

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
                    "warehouse_items": db.query(WarehouseItem).count()
                }
            }
        
        # Clear existing data if force=true
        if force:
            db.query(Product).delete()
            db.query(Customer).delete()
            db.query(WarehouseItem).delete()
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
                quantity=100,
                reserved=0,
                status="in_stock"
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
                quantity=80,
                reserved=0,
                status="in_stock"
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
                quantity=200,
                reserved=0,
                status="in_stock"
            )
        ]
        
        for item in warehouse_items:
            db.add(item)
        db.commit()
        logger.info(f"Created {len(warehouse_items)} warehouse items")
        
        # Create company settings
        settings = CompanySettings(
            company_name="Cvety.kz",
            phone="+7 777 100 2030",
            email="info@cvety.kz",
            address="г. Алматы, ул. Розыбакиева 247",
            working_hours={
                "monday": {"open": "09:00", "close": "20:00"},
                "tuesday": {"open": "09:00", "close": "20:00"},
                "wednesday": {"open": "09:00", "close": "20:00"},
                "thursday": {"open": "09:00", "close": "20:00"},
                "friday": {"open": "09:00", "close": "20:00"},
                "saturday": {"open": "10:00", "close": "18:00"},
                "sunday": {"open": "10:00", "close": "18:00"}
            },
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
            ],
            order_prefix="ORD",
            currency="KZT",
            tax_rate=12.0
        )
        db.add(settings)
        db.commit()
        logger.info("Created company settings")
        
        return {
            "status": "success",
            "message": "Test data initialized successfully",
            "counts": {
                "products": len(products),
                "customers": len(customers),
                "warehouse_items": len(warehouse_items),
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
            "company_settings": db.query(CompanySettings).count()
        }
    except Exception as e:
        logger.error(f"Failed to get data status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))