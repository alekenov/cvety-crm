import os
import random
import string
from datetime import datetime
from sqlalchemy import create_engine, text

def generate_tracking_token():
    """Generate a unique tracking token"""
    return ''.join(random.choices(string.digits, k=12))

db_url = os.environ.get('DATABASE_URL')
if db_url and db_url.startswith('postgres://'):
    db_url = db_url.replace('postgres://', 'postgresql://', 1)

print(f'Connecting to database...')

engine = create_engine(db_url)
with engine.connect() as conn:
    # Generate a unique tracking token
    tracking_token = generate_tracking_token()
    
    print(f'Creating test order with tracking token: {tracking_token}')
    
    # Create a test order
    result = conn.execute(text('''
        INSERT INTO orders (
            customer_phone, status, tracking_token, 
            recipient_name, recipient_phone, address,
            delivery_method, flower_sum, delivery_fee, total,
            created_at, updated_at, shop_id
        ) VALUES (
            '+77771234567', 'new', :token,
            'Тестовый Клиент', '+77771234567', 'ул. Абая 150, кв. 25',
            'delivery', 25000, 2000, 27000,
            NOW(), NOW(), 1
        ) RETURNING id
    '''), {'token': tracking_token})
    
    order_id = result.scalar()
    conn.commit()
    
    print(f'✅ Test order created successfully!')
    print(f'Order ID: {order_id}')
    print(f'Tracking Token: {tracking_token}')
    print(f'\n📱 View the order at:')
    print(f'https://cvety-kz-production.up.railway.app/status/{tracking_token}')