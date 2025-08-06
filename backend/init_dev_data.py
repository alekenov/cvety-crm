"""Initialize development database with test data"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.db.session import engine, SessionLocal
from app.models.shop import Shop
from app.models.user import User, UserRole
from app.models.customer import Customer
from app.models.product import Product
from app.models.warehouse import WarehouseItem
from app.models.settings import CompanySettings
from app.models.supply import FlowerCategory
from app.models.decorative_material import DecorativeMaterial
from datetime import datetime, timezone
import json


def init_database():
    db = SessionLocal()
    
    try:
        # Check if data already exists
        existing_shop = db.query(Shop).first()
        if existing_shop:
            print("✓ Data already exists, skipping initialization")
            return
        
        # Create default shop
        shop = Shop(
            id=1,
            name="Cvety.kz Almaty",
            phone="+77011234567",
            address="ул. Абая 150, Алматы",
            email="info@cvety.kz",
            created_at=datetime.now(timezone.utc)
        )
        db.add(shop)
        db.commit()
        print("✓ Created default shop")
        
        # Create admin user
        admin = User(
            phone="+77011234567",
            name="Admin User",
            email="admin@cvety.kz",
            role=UserRole.admin,
            is_active=True,
            shop_id=1,
            permissions={
                "orders": True,
                "warehouse": True,
                "customers": True,
                "production": True,
                "settings": True,
                "users": True
            }
        )
        db.add(admin)
        
        # Create test manager
        manager = User(
            phone="+77012345678",
            name="Manager User",
            email="manager@cvety.kz",
            role=UserRole.manager,
            is_active=True,
            shop_id=1,
            permissions={
                "orders": True,
                "warehouse": True,
                "customers": True,
                "production": True,
                "settings": True,
                "users": False
            }
        )
        db.add(manager)
        
        # Create test florist
        florist = User(
            phone="+77013456789",
            name="Florist User",
            email="florist@cvety.kz",
            role=UserRole.florist,
            is_active=True,
            shop_id=1,
            permissions={
                "orders": True,
                "warehouse": False,
                "customers": False,
                "production": True,
                "settings": False,
                "users": False
            }
        )
        db.add(florist)
        db.commit()
        print("✓ Created test users")
        
        # Create test customers
        customers = [
            Customer(
                phone="+77051234567",
                name="Иван Иванов",
                email="ivan@example.com",
                shop_id=1
            ),
            Customer(
                phone="+77052345678",
                name="Мария Петрова",
                email="maria@example.com",
                shop_id=1
            ),
            Customer(
                phone="+77053456789",
                name="Алексей Сидоров",
                shop_id=1
            )
        ]
        db.add_all(customers)
        db.commit()
        print("✓ Created test customers")
        
        # Create flower categories
        categories = [
            FlowerCategory(name="Розы", shop_id=1),
            FlowerCategory(name="Тюльпаны", shop_id=1),
            FlowerCategory(name="Хризантемы", shop_id=1),
            FlowerCategory(name="Лилии", shop_id=1),
            FlowerCategory(name="Герберы", shop_id=1),
            FlowerCategory(name="Пионы", shop_id=1),
            FlowerCategory(name="Орхидеи", shop_id=1),
            FlowerCategory(name="Гвоздики", shop_id=1)
        ]
        db.add_all(categories)
        db.commit()
        print("✓ Created flower categories")
        
        # Create decorative materials
        materials = [
            DecorativeMaterial(
                name="Лента атласная",
                unit="метр",
                price_per_unit=150,
                shop_id=1
            ),
            DecorativeMaterial(
                name="Упаковочная бумага",
                unit="лист",
                price_per_unit=200,
                shop_id=1
            ),
            DecorativeMaterial(
                name="Флористическая губка",
                unit="штука",
                price_per_unit=500,
                shop_id=1
            ),
            DecorativeMaterial(
                name="Декоративная сетка",
                unit="метр",
                price_per_unit=250,
                shop_id=1
            )
        ]
        db.add_all(materials)
        db.commit()
        print("✓ Created decorative materials")
        
        # Create test products
        products = [
            Product(
                name="Букет \"Нежность\"",
                description="Букет из 15 розовых роз",
                price=15000,
                category="bouquet",
                is_available=True,
                shop_id=1
            ),
            Product(
                name="Букет \"Весенний\"",
                description="Букет из 25 тюльпанов",
                price=12000,
                category="bouquet",
                is_available=True,
                shop_id=1
            ),
            Product(
                name="Композиция \"Радость\"",
                description="Композиция из гербер и хризантем",
                price=18000,
                category="composition",
                is_available=True,
                shop_id=1
            ),
            Product(
                name="Букет \"Элегантность\"",
                description="Букет из 7 белых лилий",
                price=20000,
                category="bouquet",
                is_available=True,
                shop_id=1
            ),
            Product(
                name="Корзина \"Праздник\"",
                description="Корзина с пионами и розами",
                price=25000,
                category="basket",
                is_available=True,
                shop_id=1
            )
        ]
        db.add_all(products)
        db.commit()
        print("✓ Created test products")
        
        # Create warehouse items
        warehouse_items = [
            WarehouseItem(
                name="Роза красная",
                category="flowers",
                quantity=100,
                unit="штука",
                purchase_price=200,
                selling_price=500,
                shop_id=1
            ),
            WarehouseItem(
                name="Тюльпан желтый",
                category="flowers",
                quantity=150,
                unit="штука",
                purchase_price=150,
                selling_price=400,
                shop_id=1
            ),
            WarehouseItem(
                name="Лента атласная красная",
                category="decorations",
                quantity=50,
                unit="метр",
                purchase_price=100,
                selling_price=200,
                shop_id=1
            ),
            WarehouseItem(
                name="Упаковочная бумага крафт",
                category="packaging",
                quantity=30,
                unit="лист",
                purchase_price=150,
                selling_price=300,
                shop_id=1
            )
        ]
        db.add_all(warehouse_items)
        db.commit()
        print("✓ Created warehouse items")
        
        # Create company settings
        settings = CompanySettings(
            company_name="Cvety.kz",
            phone="+77011234567",
            email="info@cvety.kz",
            address="ул. Абая 150, Алматы",
            working_hours="09:00 - 20:00",
            delivery_price=2000,
            free_delivery_from=15000,
            shop_id=1
        )
        db.add(settings)
        db.commit()
        print("✓ Created company settings")
        
        print("\n✅ Database initialized successfully!")
        print("\nTest accounts:")
        print("  Admin: +77011234567")
        print("  Manager: +77012345678")
        print("  Florist: +77013456789")
        print("\nIn DEBUG mode, use any 6-digit code for OTP")
        
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_database()