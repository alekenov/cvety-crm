#!/usr/bin/env python3
"""Add missing orders and warehouse items to Railway database"""

from datetime import datetime, timedelta
import random
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.db.base import Base
from app.models.customer import Customer
from app.models.product import Product
from app.models.warehouse import WarehouseItem
from app.models.order import Order, OrderItem, OrderStatus, DeliveryMethod

def add_missing_data():
    """Add orders and warehouse items"""
    engine = create_engine(settings.DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # Get existing customers and products
        customers = session.query(Customer).all()
        products = session.query(Product).all()
        
        print(f"Found {len(customers)} customers and {len(products)} products")
        
        # Add warehouse items for flower products
        flower_products = [p for p in products if p.category == 'flowers']
        warehouse_items = []
        
        for i, product in enumerate(flower_products[:2]):
            item = WarehouseItem(
                sku=f"FL{2000+i}",
                batch_code=f"BATCH{2024100+i}",
                variety=product.name,
                height_cm=random.randint(50, 80),
                farm="Tambuzi Roses" if i == 0 else "Dutch Flower Group",
                supplier="Поставщик 1",
                delivery_date=datetime.now() - timedelta(days=random.randint(1, 5)),
                currency="USD",
                rate=450.0,
                cost=random.uniform(200, 400),
                recommended_price=product.retail_price or 1000,
                price=product.retail_price or 1000,
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
        print(f"Added {len(warehouse_items)} warehouse items")
        
        # Add sample orders
        for i in range(5):
            customer = random.choice(customers[:5])  # Use first 5 customers
            order = Order(
                customer_id=customer.id,
                customer_phone=customer.phone,
                recipient_phone=customer.phone,
                recipient_name=customer.name,
                address="ул. Абая 150, офис 505",
                delivery_method=DeliveryMethod.delivery,
                delivery_window={
                    "from": (datetime.now() + timedelta(days=1)).replace(hour=14, minute=0).isoformat(),
                    "to": (datetime.now() + timedelta(days=1)).replace(hour=16, minute=0).isoformat()
                },
                flower_sum=random.uniform(5000, 20000),
                delivery_fee=2000 if random.random() > 0.5 else 0,
                total=0,  # Will calculate
                status=random.choice([OrderStatus.new, OrderStatus.paid, OrderStatus.assembled]),
                tracking_token=f"TRK{datetime.now().strftime('%Y%m%d')}{2000+i}"
            )
            order.total = order.flower_sum + order.delivery_fee
            session.add(order)
            session.flush()
            
            # Add order items
            selected_products = random.sample(products, k=min(2, len(products)))
            for product in selected_products:
                item = OrderItem(
                    order_id=order.id,
                    product_id=product.id,
                    product_name=product.name,
                    product_category=product.category,
                    quantity=random.randint(1, 3),
                    price=product.retail_price or 1000,
                    total=0
                )
                item.total = item.price * item.quantity
                session.add(item)
        
        session.commit()
        print(f"Added 5 sample orders")
        
        # Final check
        order_count = session.query(Order).count()
        warehouse_count = session.query(WarehouseItem).count()
        
        print(f"\n✅ Database now contains:")
        print(f"   - {order_count} orders")
        print(f"   - {warehouse_count} warehouse items")
        
    except Exception as e:
        session.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        session.close()

if __name__ == "__main__":
    add_missing_data()