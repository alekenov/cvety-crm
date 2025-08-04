#!/usr/bin/env python3
"""Fix shop IDs on Railway to match authenticated user"""

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
        
        # Move all orders to shop_id=3
        print("Moving all orders to shop_id=3...")
        cursor.execute("UPDATE orders SET shop_id = 3")
        orders_updated = cursor.rowcount
        
        # Move all customers to shop_id=3
        cursor.execute("UPDATE customers SET shop_id = 3")
        customers_updated = cursor.rowcount
        
        # Move all products to shop_id=3
        cursor.execute("UPDATE products SET shop_id = 3")
        products_updated = cursor.rowcount
        
        # Check if users table has shop_id column
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'shop_id'
        """)
        if cursor.fetchone():
            cursor.execute("UPDATE users SET shop_id = 3")
            users_updated = cursor.rowcount
        else:
            users_updated = 0
            print("Note: users table doesn't have shop_id column")
        
        conn.commit()
        
        print(f"Updated:")
        print(f"  - {orders_updated} orders")
        print(f"  - {customers_updated} customers")
        print(f"  - {products_updated} products")
        print(f"  - {users_updated} users")
        
        # Verify
        cursor.execute("SELECT shop_id, COUNT(*) FROM orders GROUP BY shop_id")
        print("\nOrders by shop:")
        for row in cursor.fetchall():
            print(f"  Shop {row[0]}: {row[1]} orders")
        
    except Exception as e:
        print(f"Error: {e}")
        if 'conn' in locals():
            conn.rollback()
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    main()