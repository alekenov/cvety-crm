#!/usr/bin/env python3
"""Check Railway orders data in detail"""

import os
import psycopg2
import json

def main():
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        print("DATABASE_URL not found")
        return
    
    try:
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()
        
        # Check shop with phone +77771234567
        cursor.execute("""
            SELECT id, name, phone, address 
            FROM shops 
            WHERE phone = '+77771234567'
        """)
        
        print("Shop with phone +77771234567:")
        shop = cursor.fetchone()
        if shop:
            print(f"  ID: {shop[0]}")
            print(f"  Name: {shop[1]}")
            print(f"  Phone: {shop[2]}")
            print(f"  Address: {shop[3]}")
        else:
            print("  NOT FOUND!")
            
        # Check all shops
        cursor.execute("SELECT id, name, phone FROM shops ORDER BY id")
        print("\nAll shops:")
        for row in cursor.fetchall():
            print(f"  Shop {row[0]}: {row[1]} - {row[2]}")
        
        # Check orders with details
        cursor.execute("""
            SELECT o.id, o.shop_id, o.status, o.customer_id, 
                   o.customer_phone, o.assigned_florist_id,
                   c.name as customer_name,
                   u.name as florist_name
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            LEFT JOIN users u ON o.assigned_florist_id = u.id
            ORDER BY o.id
        """)
        
        print("\nAll orders with details:")
        for row in cursor.fetchall():
            print(f"\nOrder {row[0]}:")
            print(f"  shop_id: {row[1]}")
            print(f"  status: {row[2]}")
            print(f"  customer_id: {row[3]} ({row[6]})")
            print(f"  customer_phone: {row[4]}")
            print(f"  florist_id: {row[5]} ({row[7]})")
        
        # Check order items
        cursor.execute("""
            SELECT oi.order_id, oi.product_id, oi.product_name, 
                   oi.product_category, oi.quantity, oi.price
            FROM order_items oi
            ORDER BY oi.order_id, oi.id
        """)
        
        print("\nOrder items:")
        current_order = None
        for row in cursor.fetchall():
            if current_order != row[0]:
                current_order = row[0]
                print(f"\n  Order {current_order} items:")
            print(f"    - {row[2]} ({row[3]}) x{row[4]} @ {row[5]} each")
        
        # Check if order_items have all required fields
        cursor.execute("""
            SELECT COUNT(*) FROM order_items 
            WHERE product_name IS NULL OR product_category IS NULL
        """)
        missing_count = cursor.fetchone()[0]
        if missing_count > 0:
            print(f"\n⚠️ WARNING: {missing_count} order items missing product_name or product_category!")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    main()