import os
from sqlalchemy import create_engine, text

db_url = os.environ.get('DATABASE_URL')
if db_url and db_url.startswith('postgres://'):
    db_url = db_url.replace('postgres://', 'postgresql://', 1)

print(f'Database URL: {db_url[:30]}...')

engine = create_engine(db_url)
with engine.connect() as conn:
    # Check if there are any orders
    result = conn.execute(text('SELECT COUNT(*) FROM orders')).scalar()
    print(f'Total orders in database: {result}')
    
    # Get last 5 orders with their tracking tokens
    orders = conn.execute(text('''
        SELECT id, tracking_token, status, created_at 
        FROM orders 
        ORDER BY created_at DESC 
        LIMIT 5
    ''')).fetchall()
    
    print('\nLast 5 orders:')
    for order in orders:
        print(f'ID: {order[0]}, Token: {order[1]}, Status: {order[2]}, Created: {order[3]}')
        
    # Create a test order if none exist
    if result == 0:
        print("\nNo orders found. Creating a test order...")
        conn.execute(text('''
            INSERT INTO orders (
                customer_phone, status, tracking_token, 
                recipient_name, recipient_phone, address,
                delivery_method, flower_sum, delivery_fee, total,
                created_at, updated_at, shop_id
            ) VALUES (
                '+77011234567', 'new', 'test-railway-order-123',
                'Test Customer', '+77011234567', 'Test Address 123',
                'delivery', 15000, 2000, 17000,
                NOW(), NOW(), 1
            )
        '''))
        conn.commit()
        print("Test order created with token: test-railway-order-123")