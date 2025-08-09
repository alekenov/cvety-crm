#!/usr/bin/env python3
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.order import Order, OrderStatus, DeliveryMethod
from datetime import datetime

# Create database connection
engine = create_engine('sqlite:///flower_shop.db')
Session = sessionmaker(bind=engine)
session = Session()

# Create test orders
orders_data = [
    {
        'shop_id': 1,
        'customer_phone': '+77771234567',
        'recipient_phone': '+77771234567',
        'recipient_name': 'Тестовый клиент 1',
        'address': 'ул. Абая, 150',
        'delivery_method': DeliveryMethod.delivery,
        'status': OrderStatus.new,
        'flower_sum': 25000,
        'delivery_fee': 2000,
        'total': 27000,
    },
    {
        'shop_id': 1,
        'customer_phone': '+77772345678',
        'recipient_phone': '+77772345678',
        'recipient_name': 'Тестовый клиент 2',
        'address': 'ул. Желтоксан, 200',
        'delivery_method': DeliveryMethod.delivery,
        'status': OrderStatus.paid,
        'flower_sum': 35000,
        'delivery_fee': 2000,
        'total': 37000,
    },
    {
        'shop_id': 1,
        'customer_phone': '+77773456789',
        'recipient_phone': '+77773456789',
        'recipient_name': 'Тестовый клиент 3',
        'address': 'пр. Достык, 100',
        'delivery_method': DeliveryMethod.self_pickup,
        'status': OrderStatus.assembled,
        'flower_sum': 15000,
        'delivery_fee': 0,
        'total': 15000,
    }
]

for order_data in orders_data:
    order = Order(
        **order_data,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    session.add(order)
    session.commit()
    print(f'✅ Created order #{order.id} with status {order.status.value}')

session.close()
print('\n✅ Successfully created 3 test orders!')