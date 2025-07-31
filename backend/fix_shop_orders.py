#!/usr/bin/env python3
"""Fix shop orders on Railway"""

import os
import psycopg2

def main():
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        print("DATABASE_URL not found")
        return
    
    try:
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()
        
        # Check which shop has phone +77771234567
        cursor.execute("""
            SELECT id, name, phone 
            FROM shops 
            WHERE phone LIKE '%4567%' OR id = 3
            ORDER BY id
        """)
        print("Shops with phone ending in 4567 or id=3:")
        for row in cursor.fetchall():
            print(f"  Shop {row[0]}: {row[1]} - {row[2]}")
        
        # Move some orders to shop_id=3
        print("\nMoving half of orders to shop_id=3...")
        cursor.execute("""
            UPDATE orders 
            SET shop_id = 3 
            WHERE id IN (SELECT id FROM orders ORDER BY id LIMIT 3)
        """)
        
        # Also move corresponding customers
        cursor.execute("""
            UPDATE customers 
            SET shop_id = 3 
            WHERE id IN (SELECT DISTINCT customer_id FROM orders WHERE shop_id = 3)
        """)
        
        # Move some products too
        cursor.execute("""
            UPDATE products 
            SET shop_id = 3 
            WHERE id IN (SELECT id FROM products ORDER BY id LIMIT 4)
        """)
        
        conn.commit()
        
        # Verify
        cursor.execute("SELECT shop_id, COUNT(*) FROM orders GROUP BY shop_id")
        print("\nOrders by shop:")
        for row in cursor.fetchall():
            print(f"  Shop {row[0]}: {row[1]} orders")
        
        cursor.execute("SELECT shop_id, COUNT(*) FROM customers GROUP BY shop_id")
        print("\nCustomers by shop:")
        for row in cursor.fetchall():
            print(f"  Shop {row[0]}: {row[1]} customers")
        
    except Exception as e:
        print(f"Error: {e}")
        if 'conn' in locals():
            conn.rollback()
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    main()