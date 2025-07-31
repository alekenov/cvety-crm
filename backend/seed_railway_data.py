#!/usr/bin/env python3
"""Seed Railway database with test data"""

import os
import psycopg2
from datetime import datetime, timedelta
import random

def main():
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        print("DATABASE_URL not found in environment")
        return
    
    print("Seeding Railway database...")
    
    try:
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()
        
        # Create users
        users_data = [
            ('Айгуль Жанибекова', '+77771234567', 'aigul@cvety.kz', 'admin'),
            ('Марат Сериков', '+77772345678', 'marat@cvety.kz', 'manager'),
            ('Гульнара Есенова', '+77773456789', 'gulnara@cvety.kz', 'florist'),
            ('Нурлан Ахметов', '+77774567890', 'nurlan@cvety.kz', 'florist'),
            ('Асель Жумабаева', '+77775678901', 'asel@cvety.kz', 'florist'),
            ('Бауржан Касымов', '+77776789012', 'baurzhan@cvety.kz', 'courier'),
            ('Ержан Мухтаров', '+77777890123', 'erzhan@cvety.kz', 'courier'),
        ]
        
        print("Creating users...")
        user_ids = {}
        for name, phone, email, role in users_data:
            cursor.execute("""
                INSERT INTO users (name, phone, email, role) 
                VALUES (%s, %s, %s, %s) 
                RETURNING id
            """, (name, phone, email, role))
            user_id = cursor.fetchone()[0]
            user_ids[role] = user_ids.get(role, []) + [user_id]
            print(f"Created {role}: {name}")
        
        # Update existing orders with florists
        cursor.execute("SELECT id FROM orders ORDER BY id")
        order_ids = [row[0] for row in cursor.fetchall()]
        
        florist_ids = user_ids.get('florist', [])
        if florist_ids and order_ids:
            print(f"\nAssigning florists to {len(order_ids)} orders...")
            for i, order_id in enumerate(order_ids):
                florist_id = florist_ids[i % len(florist_ids)]
                cursor.execute("""
                    UPDATE orders 
                    SET assigned_florist_id = %s 
                    WHERE id = %s
                """, (florist_id, order_id))
                
                # Add history entry
                cursor.execute("""
                    INSERT INTO order_history 
                    (order_id, user_id, event_type, comment) 
                    VALUES (%s, %s, 'florist_assigned', %s)
                """, (order_id, florist_id, f'Назначен флорист'))
        
        # Add some couriers to delivery orders
        cursor.execute("SELECT id FROM orders WHERE delivery_method = 'delivery' ORDER BY id")
        delivery_order_ids = [row[0] for row in cursor.fetchall()]
        
        courier_ids = user_ids.get('courier', [])
        if courier_ids and delivery_order_ids:
            print(f"\nAssigning couriers to {len(delivery_order_ids)} delivery orders...")
            for i, order_id in enumerate(delivery_order_ids):
                courier_id = courier_ids[i % len(courier_ids)]
                cursor.execute("""
                    UPDATE orders 
                    SET courier_id = %s 
                    WHERE id = %s
                """, (courier_id, order_id))
                
                # Add history entry
                cursor.execute("""
                    INSERT INTO order_history 
                    (order_id, user_id, event_type, comment) 
                    VALUES (%s, %s, 'courier_assigned', %s)
                """, (order_id, courier_id, f'Назначен курьер'))
        
        # Add some status change history
        print("\nAdding order history...")
        status_flow = {
            'new': 'paid',
            'paid': 'assembled',
            'assembled': 'delivery',
            'delivery': 'delivered'
        }
        
        cursor.execute("SELECT id, status FROM orders WHERE status != 'new' ORDER BY id")
        orders_with_status = cursor.fetchall()
        
        for order_id, current_status in orders_with_status:
            # Add creation history
            cursor.execute("""
                INSERT INTO order_history 
                (order_id, event_type, new_status, comment, created_at) 
                VALUES (%s, 'created', 'new', 'Заказ создан', %s)
            """, (order_id, datetime.now() - timedelta(days=random.randint(1, 7))))
            
            # Add status changes up to current status
            prev_status = 'new'
            for old_status, new_status in status_flow.items():
                if prev_status == current_status:
                    break
                    
                cursor.execute("""
                    INSERT INTO order_history 
                    (order_id, event_type, old_status, new_status, comment, created_at) 
                    VALUES (%s, 'status_changed', %s, %s, %s, %s)
                """, (
                    order_id, 
                    old_status, 
                    new_status,
                    f'Статус изменен: {old_status} → {new_status}',
                    datetime.now() - timedelta(hours=random.randint(1, 48))
                ))
                
                prev_status = new_status
                if new_status == current_status:
                    break
        
        conn.commit()
        print("\nDatabase seeded successfully!")
        
        # Show stats
        cursor.execute("SELECT COUNT(*) FROM users")
        print(f"\nTotal users: {cursor.fetchone()[0]}")
        
        cursor.execute("SELECT role, COUNT(*) FROM users GROUP BY role")
        for role, count in cursor.fetchall():
            print(f"  {role}: {count}")
        
        cursor.execute("SELECT COUNT(*) FROM orders WHERE assigned_florist_id IS NOT NULL")
        print(f"\nOrders with florists: {cursor.fetchone()[0]}")
        
        cursor.execute("SELECT COUNT(*) FROM orders WHERE courier_id IS NOT NULL")
        print(f"Orders with couriers: {cursor.fetchone()[0]}")
        
        cursor.execute("SELECT COUNT(*) FROM order_history")
        print(f"Order history entries: {cursor.fetchone()[0]}")
        
    except Exception as e:
        print(f"Error: {e}")
        if 'conn' in locals():
            conn.rollback()
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    main()