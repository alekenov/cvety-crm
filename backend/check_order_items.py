#!/usr/bin/env python3
"""Check order_items table structure on Railway"""

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
        
        # Check order_items columns
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'order_items'
            ORDER BY ordinal_position
        """)
        print("order_items columns:")
        for col_name, data_type in cursor.fetchall():
            print(f"  {col_name}: {data_type}")
        
        # Check if products table has required columns
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'products'
            AND column_name IN ('name', 'category')
        """)
        product_cols = [row[0] for row in cursor.fetchall()]
        print(f"\nProducts has columns: {product_cols}")
        
        # Check sample data
        cursor.execute("""
            SELECT oi.*, p.name, p.category
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
            LIMIT 1
        """)
        if cursor.rowcount > 0:
            print("\nSample order item:")
            row = cursor.fetchone()
            cols = [desc[0] for desc in cursor.description]
            for i, col in enumerate(cols):
                print(f"  {col}: {row[i]}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    main()