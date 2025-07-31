#!/usr/bin/env python3
"""Add shop_id columns to Railway database"""

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
        
        # Get first shop ID
        cursor.execute("SELECT id FROM shops ORDER BY id LIMIT 1")
        shop_id = cursor.fetchone()[0]
        print(f"Using shop ID: {shop_id}")
        
        # Add shop_id columns to tables that need them
        tables_to_update = ['orders', 'customers', 'products']
        
        for table in tables_to_update:
            # Check if column exists
            cursor.execute(f"""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = '{table}' 
                AND column_name = 'shop_id'
            """)
            
            if not cursor.fetchone():
                print(f"Adding shop_id to {table} table...")
                cursor.execute(f"""
                    ALTER TABLE {table} 
                    ADD COLUMN shop_id INTEGER DEFAULT {shop_id} NOT NULL
                """)
                cursor.execute(f"""
                    ALTER TABLE {table}
                    ADD CONSTRAINT fk_{table}_shop
                    FOREIGN KEY (shop_id) REFERENCES shops(id)
                """)
        
        conn.commit()
        print("Shop ID columns added successfully!")
        
        # Verify
        for table in tables_to_update:
            cursor.execute(f"SELECT COUNT(*) FROM {table} WHERE shop_id IS NOT NULL")
            count = cursor.fetchone()[0]
            print(f"{table} with shop_id: {count}")
        
    except Exception as e:
        print(f"Error: {e}")
        if 'conn' in locals():
            conn.rollback()
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    main()