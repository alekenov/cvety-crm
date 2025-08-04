#!/usr/bin/env python3
"""Check Railway database structure"""

import os
import psycopg2
from psycopg2 import sql

def main():
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        print("DATABASE_URL not found")
        return
    
    try:
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()
        
        # Check orders table columns
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'orders'
            ORDER BY ordinal_position
        """)
        
        print("Orders table columns:")
        columns = [row[0] for row in cursor.fetchall()]
        for col in columns:
            print(f"  - {col}")
        
        # Check if specific columns exist
        required_columns = ['assigned_florist_id', 'courier_id', 'shop_id']
        missing = [col for col in required_columns if col not in columns]
        
        if missing:
            print(f"\nMissing columns in orders table: {missing}")
        else:
            print("\nAll required columns exist in orders table")
        
        # Check order_items columns
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'order_items'
            ORDER BY ordinal_position
        """)
        
        print("\nOrder_items table columns:")
        item_columns = [row[0] for row in cursor.fetchall()]
        for col in item_columns:
            print(f"  - {col}")
        
        # Check if order_history table exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'order_history'
            )
        """)
        
        has_history = cursor.fetchone()[0]
        print(f"\nOrder_history table exists: {has_history}")
        
        # Check sample order data
        cursor.execute("SELECT COUNT(*) FROM orders")
        order_count = cursor.fetchone()[0]
        print(f"\nTotal orders: {order_count}")
        
        # Check sample order with joins
        cursor.execute("""
            SELECT o.id, o.shop_id, o.assigned_florist_id, o.courier_id,
                   COUNT(oi.id) as item_count
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            GROUP BY o.id
            LIMIT 5
        """)
        
        print("\nSample orders:")
        for row in cursor.fetchall():
            print(f"  Order {row[0]}: shop_id={row[1]}, florist_id={row[2]}, courier_id={row[3]}, items={row[4]}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    main()