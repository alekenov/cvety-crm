#!/usr/bin/env python3
"""Fix customer columns on Railway database"""

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
        
        # Check what columns exist in customers table
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'customers'
            ORDER BY ordinal_position
        """)
        columns = [row[0] for row in cursor.fetchall()]
        print(f"Current customer columns: {columns}")
        
        # Add missing columns
        columns_to_add = {
            'orders_count': 'INTEGER DEFAULT 0',
            'total_spent': 'DECIMAL(12,2) DEFAULT 0'
        }
        
        for col_name, col_def in columns_to_add.items():
            if col_name not in columns:
                print(f"Adding {col_name} column...")
                cursor.execute(f"ALTER TABLE customers ADD COLUMN {col_name} {col_def}")
        
        # Update customer statistics
        print("Updating customer statistics...")
        cursor.execute("""
            UPDATE customers c
            SET orders_count = (
                SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id
            ),
            total_spent = (
                SELECT COALESCE(SUM(o.total), 0) FROM orders o WHERE o.customer_id = c.id
            )
        """)
        
        conn.commit()
        print("Customer table fixed successfully!")
        
        # Verify
        cursor.execute("SELECT COUNT(*) FROM customers WHERE orders_count > 0")
        count = cursor.fetchone()[0]
        print(f"Customers with orders: {count}")
        
    except Exception as e:
        print(f"Error: {e}")
        if 'conn' in locals():
            conn.rollback()
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    main()