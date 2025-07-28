#!/usr/bin/env python3
"""Initialize empty database with test data"""

from datetime import datetime, timedelta
import random
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.db.base import Base
from app.models.customer import Customer, CustomerAddress
from app.models.product import Product
from app.models.warehouse import WarehouseItem
from app.models.order import Order, OrderItem, OrderStatus, DeliveryMethod
from app.models.settings import CompanySettings

def init_database():
    """Initialize database with sample data"""
    engine = create_engine(settings.DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✅ Tables created")
        
        # Check if data already exists
        if session.query(Customer).count() > 0:
            print("ℹ️  Database already contains data, skipping initialization")
            return
        
        # Create company settings
        settings_data = CompanySettings(
            company_name="Cvety.kz",
            phone="+7 (777) 123-45-67",
            email="info@cvety.kz",
            address="г. Алматы, ул. Абая 150",
            delivery_price=2000.0,
            free_delivery_from=15000.0,
            working_hours="Ежедневно с 9:00 до 21:00"
        )
        session.add(settings_data)
        
        # Create sample customers
        customers = []
        for i in range(5):
            customer = Customer(
                name=f"Клиент {i+1}",
                phone=f"+7 (777) {100+i:03d}-{10+i:02d}-{20+i:02d}",
                email=f"customer{i+1}@example.com",
                total_orders=random.randint(1, 10),
                total_spent=random.uniform(5000, 50000),
                notes="Постоянный клиент" if i < 2 else None
            )
            session.add(customer)
            customers.append(customer)
        
        session.flush()
        
        # Add addresses for customers
        addresses = [
            "ул. Достык, 89",
            "пр. Аль-Фараби, 77",
            "ул. Сатпаева, 22",
            "мкр. Самал-2, д. 58",
            "ул. Жандосова, 98"
        ]
        
        for i, customer in enumerate(customers):
            addr = CustomerAddress(
                customer_id=customer.id,
                address=addresses[i],
                is_primary=True
            )
            session.add(addr)
        
        # Create sample products
        products = []
        product_data = [
            {"name": "Роза Red Naomi", "category": "flowers", "description": "Премиум розы из Эквадора", "price": 800},
            {"name": "Тюльпан", "category": "flowers", "description": "Голландские тюльпаны", "price": 300},
            {"name": "Букет 'Весенний'", "category": "bouquets", "description": "Микс из тюльпанов и ирисов", "price": 7500},
            {"name": "Корзина фруктов", "category": "gifts", "description": "Ассорти из сезонных фруктов", "price": 12000},
        ]
        
        for pd in product_data:
            product = Product(**pd, is_active=True)
            session.add(product)
            products.append(product)
        
        session.flush()
        
        # Create warehouse items
        warehouse_items = []
        for i, product in enumerate(products[:2]):  # Only flowers
            item = WarehouseItem(
                sku=f"FL{1000+i}",
                batch_code=f"BATCH{2024001+i}",
                variety=product.name,
                height_cm=random.randint(50, 80),
                farm="Tambuzi" if i == 0 else "Dutch Flower Group",
                supplier="Поставщик 1",
                delivery_date=datetime.now() - timedelta(days=random.randint(1, 5)),
                currency="USD",
                rate=450.0,
                cost=random.uniform(200, 400),
                recommended_price=product.price,
                price=product.price,
                markup_pct=150.0,
                qty=random.randint(50, 200),
                reserved_qty=0,
                on_showcase=True,
                to_write_off=False,
                hidden=False
            )
            session.add(item)
            warehouse_items.append(item)
        
        session.flush()
        
        # Create sample orders
        for i in range(3):
            customer = random.choice(customers)
            order = Order(
                customer_id=customer.id,
                customer_phone=customer.phone,
                recipient_phone=customer.phone,
                recipient_name=customer.name,
                address=addresses[customers.index(customer)],
                delivery_method=DeliveryMethod.delivery,
                delivery_window={
                    "from": (datetime.now() + timedelta(days=1)).replace(hour=14, minute=0).isoformat(),
                    "to": (datetime.now() + timedelta(days=1)).replace(hour=16, minute=0).isoformat()
                },
                flower_sum=random.uniform(5000, 20000),
                delivery_fee=2000 if random.random() > 0.5 else 0,
                total=0,  # Will calculate
                status=random.choice([OrderStatus.new, OrderStatus.paid, OrderStatus.assembled]),
                tracking_token=f"TRK{datetime.now().strftime('%Y%m%d')}{1000+i}"
            )
            order.total = order.flower_sum + order.delivery_fee
            session.add(order)
            session.flush()
            
            # Add order items
            selected_products = random.sample(products, k=random.randint(1, 2))
            for product in selected_products:
                item = OrderItem(
                    order_id=order.id,
                    product_id=product.id,
                    product_name=product.name,
                    product_category=product.category,
                    quantity=random.randint(1, 3),
                    price=product.price,
                    total=0  # Will calculate
                )
                item.total = item.price * item.quantity
                session.add(item)
        
        session.commit()
        print("✅ Sample data created successfully!")
        
        # Print summary
        print("\nDatabase initialized with:")
        print(f"- {len(customers)} customers")
        print(f"- {len(products)} products") 
        print(f"- {len(warehouse_items)} warehouse items")
        print(f"- 3 orders")
        
    except Exception as e:
        session.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        session.close()

if __name__ == "__main__":
    init_database()