#!/usr/bin/env python3
"""Debug Railway orders issue"""

import os
import psycopg2
import traceback

def main():
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        print("DATABASE_URL not found")
        return
    
    try:
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()
        
        # Check orders for shop_id=3
        print("=== Checking orders for shop_id=3 ===")
        cursor.execute("SELECT COUNT(*) FROM orders WHERE shop_id = 3")
        count = cursor.fetchone()[0]
        print(f"Orders for shop_id=3: {count}")
        
        # Check all orders with shop_id
        cursor.execute("SELECT id, shop_id, customer_id, assigned_florist_id FROM orders ORDER BY id")
        print("\nAll orders:")
        for row in cursor.fetchall():
            print(f"  Order {row[0]}: shop_id={row[1]}, customer_id={row[2]}, florist_id={row[3]}")
        
        # Check if order_items exist
        cursor.execute("SELECT COUNT(*) FROM order_items")
        item_count = cursor.fetchone()[0]
        print(f"\nTotal order items: {item_count}")
        
        # Test the join query that might be failing
        print("\n=== Testing order query with joins ===")
        try:
            cursor.execute("""
                SELECT 
                    o.id, o.status, o.customer_id, o.assigned_florist_id,
                    c.name as customer_name, c.phone as customer_phone,
                    u.name as florist_name
                FROM orders o
                LEFT JOIN customers c ON o.customer_id = c.id
                LEFT JOIN users u ON o.assigned_florist_id = u.id
                WHERE o.shop_id = 3
                LIMIT 1
            """)
            if cursor.rowcount > 0:
                row = cursor.fetchone()
                print(f"Sample order: {row}")
            else:
                print("No orders found for shop_id=3")
        except Exception as e:
            print(f"Query error: {e}")
            traceback.print_exc()
        
        # Check if all required columns exist
        print("\n=== Checking table columns ===")
        tables = ['orders', 'customers', 'users', 'order_items']
        for table in tables:
            cursor.execute(f"""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = '{table}'
                ORDER BY ordinal_position
            """)
            cols = [row[0] for row in cursor.fetchall()]
            print(f"{table}: {', '.join(cols[:10])}{'...' if len(cols) > 10 else ''}")
        
    except Exception as e:
        print(f"Error: {e}")
        traceback.print_exc()
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    main()