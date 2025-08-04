#!/usr/bin/env python3
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from app.crud.order import order as crud_order
from app.schemas.order import OrderCreateWithItems, OrderItemCreate, DeliveryWindow
from datetime import datetime

# Test data
test_data = {
    'customer_phone': '+77018888888',
    'recipient_phone': '+77018888888',
    'recipient_name': 'Тестовый Клиент',
    'address': 'г. Алматы, ул. Абая 100, кв. 15',
    'delivery_method': 'delivery',
    'delivery_fee': 1500,
    'items': [
        OrderItemCreate(product_id=1, quantity=1, price=15000)
    ],
    'delivery_window': DeliveryWindow(
        from_time=datetime.fromisoformat('2025-08-05T15:00:00'),
        to_time=datetime.fromisoformat('2025-08-05T17:00:00')
    )
}

try:
    print("Creating OrderCreateWithItems object...")
    order_in = OrderCreateWithItems(**test_data)
    print(f"Order object created: {order_in}")
    
    print("\nCreating database session...")
    db = SessionLocal()
    
    print("\nCalling create_with_items...")
    order_data = order_in.dict()
    order_data['shop_id'] = 1
    order_data['items'] = [item.dict() for item in order_in.items]
    
    print(f"Order data for CRUD: {order_data}")
    
    new_order = crud_order.create_with_items(db, order_data=order_data)
    print(f"\n✅ Order created successfully! Order ID: {new_order.id}")
    
    db.close()
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()