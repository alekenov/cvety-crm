import os
import random
import string
from datetime import datetime, timedelta
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
    
    # Create date 1 hour ago
    old_date = datetime.now() - timedelta(hours=1)
    
    print(f'Creating older test order with tracking token: {tracking_token}')
    
    # Create a test order with older date
    result = conn.execute(text('''
        INSERT INTO orders (
            customer_phone, status, tracking_token, 
            recipient_name, recipient_phone, address,
            delivery_method, flower_sum, delivery_fee, total,
            created_at, updated_at, shop_id
        ) VALUES (
            '+77051234567', 'paid', :token,
            'Айгуль Нурланова', '+77051234567', 'ул. Достык 89, офис 301',
            'delivery', 35000, 0, 35000,
            :created_at, :updated_at, 1
        ) RETURNING id
    '''), {
        'token': tracking_token,
        'created_at': old_date,
        'updated_at': old_date
    })
    
    order_id = result.scalar()
    conn.commit()
    
    print(f'✅ Older test order created successfully!')
    print(f'Order ID: {order_id}')
    print(f'Tracking Token: {tracking_token}')
    print(f'Created at: {old_date}')
    print(f'\n📱 View the order at:')
    print(f'https://cvety-kz-production.up.railway.app/status/{tracking_token}')