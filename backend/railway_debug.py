#!/usr/bin/env python3
"""Debug Railway database state"""

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
        
        # Check shops
        cursor.execute("SELECT COUNT(*) FROM shops")
        shop_count = cursor.fetchone()[0]
        print(f"Shops in database: {shop_count}")
        
        if shop_count == 0:
            print("Creating default shop...")
            cursor.execute("""
                INSERT INTO shops (name, phone, address, is_active) 
                VALUES ('Cvety.kz', '+77771234567', 'Алматы, Казахстан', true)
                RETURNING id
            """)
            shop_id = cursor.fetchone()[0]
            print(f"Created shop with ID: {shop_id}")
            
            # Update all orders to belong to this shop
            cursor.execute("UPDATE orders SET shop_id = %s WHERE shop_id IS NULL", (shop_id,))
            cursor.execute("UPDATE customers SET shop_id = %s WHERE shop_id IS NULL", (shop_id,))
            cursor.execute("UPDATE products SET shop_id = %s WHERE shop_id IS NULL", (shop_id,))
            
            conn.commit()
        
        # Show table counts
        tables = ['shops', 'users', 'orders', 'customers', 'products', 'order_history']
        print("\nTable counts:")
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"  {table}: {count}")
        
        # Check column existence
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'orders' 
            AND column_name IN ('shop_id', 'assigned_florist_id', 'courier_id')
        """)
        columns = [row[0] for row in cursor.fetchall()]
        print(f"\nOrders table columns found: {columns}")
        
    except Exception as e:
        print(f"Error: {e}")
        if 'conn' in locals():
            conn.rollback()
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    main()