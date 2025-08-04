#!/usr/bin/env python3
"""Fix missing columns in Railway database"""

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
        
        # Check existing columns in orders table
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'orders'
            ORDER BY ordinal_position
        """)
        
        existing_columns = [row[0] for row in cursor.fetchall()]
        print(f"Existing columns in orders table: {existing_columns}")
        
        # List of columns to add
        columns_to_add = [
            ('courier_phone', 'VARCHAR'),
            ('assigned_florist_id', 'INTEGER'),
            ('courier_id', 'INTEGER'),
            ('shop_id', 'INTEGER DEFAULT 1 NOT NULL'),
            ('address_needs_clarification', 'BOOLEAN DEFAULT FALSE')
        ]
        
        # Add missing columns
        for col_name, col_type in columns_to_add:
            if col_name not in existing_columns:
                print(f"Adding column {col_name}...")
                try:
                    cursor.execute(f"ALTER TABLE orders ADD COLUMN {col_name} {col_type}")
                    conn.commit()
                    print(f"✅ Column {col_name} added successfully")
                except Exception as e:
                    conn.rollback()
                    print(f"❌ Failed to add column {col_name}: {e}")
            else:
                print(f"✓ Column {col_name} already exists")
        
        # Add foreign key constraints if they don't exist
        cursor.execute("""
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'orders' 
            AND constraint_type = 'FOREIGN KEY'
        """)
        
        existing_fks = [row[0] for row in cursor.fetchall()]
        print(f"\nExisting foreign keys: {existing_fks}")
        
        # Add foreign key for assigned_florist_id if column exists
        if 'assigned_florist_id' in existing_columns or 'assigned_florist_id' in [col[0] for col in columns_to_add]:
            fk_name = 'orders_assigned_florist_id_fkey'
            if fk_name not in existing_fks:
                try:
                    cursor.execute("""
                        ALTER TABLE orders 
                        ADD CONSTRAINT orders_assigned_florist_id_fkey 
                        FOREIGN KEY (assigned_florist_id) REFERENCES users(id)
                    """)
                    conn.commit()
                    print(f"✅ Foreign key for assigned_florist_id added")
                except Exception as e:
                    conn.rollback()
                    print(f"⚠️  Could not add FK for assigned_florist_id: {e}")
        
        # Add foreign key for courier_id if column exists
        if 'courier_id' in existing_columns or 'courier_id' in [col[0] for col in columns_to_add]:
            fk_name = 'orders_courier_id_fkey'
            if fk_name not in existing_fks:
                try:
                    cursor.execute("""
                        ALTER TABLE orders 
                        ADD CONSTRAINT orders_courier_id_fkey 
                        FOREIGN KEY (courier_id) REFERENCES users(id)
                    """)
                    conn.commit()
                    print(f"✅ Foreign key for courier_id added")
                except Exception as e:
                    conn.rollback()
                    print(f"⚠️  Could not add FK for courier_id: {e}")
        
        # Add foreign key for shop_id if column exists
        if 'shop_id' in existing_columns or 'shop_id' in [col[0] for col in columns_to_add]:
            fk_name = 'orders_shop_id_fkey'
            if fk_name not in existing_fks:
                try:
                    cursor.execute("""
                        ALTER TABLE orders 
                        ADD CONSTRAINT orders_shop_id_fkey 
                        FOREIGN KEY (shop_id) REFERENCES shops(id)
                    """)
                    conn.commit()
                    print(f"✅ Foreign key for shop_id added")
                except Exception as e:
                    conn.rollback()
                    print(f"⚠️  Could not add FK for shop_id: {e}")
        
        # Verify final state
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'orders'
            AND column_name IN ('courier_phone', 'assigned_florist_id', 'courier_id', 'shop_id', 'address_needs_clarification')
            ORDER BY ordinal_position
        """)
        
        print("\n✅ Final state of order columns:")
        for row in cursor.fetchall():
            print(f"  - {row[0]}: {row[1]} (nullable: {row[2]}, default: {row[3]})")
        
        # Test query
        print("\n🧪 Testing query...")
        cursor.execute("""
            SELECT id, courier_phone, assigned_florist_id, courier_id, shop_id
            FROM orders
            LIMIT 1
        """)
        
        result = cursor.fetchone()
        if result:
            print(f"✅ Test query successful: {result}")
        else:
            print("✅ Test query successful (no orders in database)")
        
        print("\n✅ Database fix completed successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    main()