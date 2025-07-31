#!/usr/bin/env python3
"""Fix Railway database directly"""

import os
import psycopg2

def main():
    # Get DATABASE_URL from environment (set by railway run)
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        print("DATABASE_URL not found in environment")
        return
    
    print("Connecting to Railway database...")
    
    try:
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()
        
        # Check if columns already exist
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'orders' 
            AND column_name IN ('assigned_florist_id', 'courier_id')
        """)
        existing_columns = [row[0] for row in cursor.fetchall()]
        
        # Add missing columns
        if 'assigned_florist_id' not in existing_columns:
            print("Adding assigned_florist_id column...")
            cursor.execute("""
                ALTER TABLE orders 
                ADD COLUMN assigned_florist_id INTEGER
            """)
        
        if 'courier_id' not in existing_columns:
            print("Adding courier_id column...")
            cursor.execute("""
                ALTER TABLE orders 
                ADD COLUMN courier_id INTEGER
            """)
        
        # Check if users table exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'users'
            )
        """)
        if not cursor.fetchone()[0]:
            print("Creating users table...")
            cursor.execute("""
                CREATE TABLE users (
                    id SERIAL PRIMARY KEY,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    name VARCHAR(255) NOT NULL,
                    phone VARCHAR(20),
                    email VARCHAR(255),
                    role VARCHAR(20) NOT NULL DEFAULT 'florist',
                    is_active BOOLEAN DEFAULT TRUE
                )
            """)
        
        # Check if order_history table exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'order_history'
            )
        """)
        if not cursor.fetchone()[0]:
            print("Creating order_history table...")
            cursor.execute("""
                CREATE TABLE order_history (
                    id SERIAL PRIMARY KEY,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
                    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                    event_type VARCHAR(50) NOT NULL,
                    old_status VARCHAR(50),
                    new_status VARCHAR(50),
                    comment TEXT
                )
            """)
            cursor.execute("CREATE INDEX idx_order_history_order_id ON order_history(order_id)")
        
        # Add foreign key constraints if they don't exist
        cursor.execute("""
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'orders' 
            AND constraint_type = 'FOREIGN KEY'
            AND constraint_name IN ('fk_orders_assigned_florist', 'fk_orders_courier')
        """)
        existing_constraints = [row[0] for row in cursor.fetchall()]
        
        if 'fk_orders_assigned_florist' not in existing_constraints:
            print("Adding foreign key for assigned_florist_id...")
            cursor.execute("""
                ALTER TABLE orders 
                ADD CONSTRAINT fk_orders_assigned_florist 
                FOREIGN KEY (assigned_florist_id) 
                REFERENCES users(id) ON DELETE SET NULL
            """)
        
        if 'fk_orders_courier' not in existing_constraints:
            print("Adding foreign key for courier_id...")
            cursor.execute("""
                ALTER TABLE orders 
                ADD CONSTRAINT fk_orders_courier
                FOREIGN KEY (courier_id) 
                REFERENCES users(id) ON DELETE SET NULL
            """)
        
        # Update alembic version
        cursor.execute("SELECT version_num FROM alembic_version")
        current_version = cursor.fetchone()
        
        if current_version and current_version[0] == 'ff770d44ed65':
            print("Updating alembic version to latest...")
            cursor.execute("UPDATE alembic_version SET version_num = '1cb156b39497'")
        
        conn.commit()
        print("Database fixes applied successfully!")
        
        # Show current state
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        print(f"Users in database: {user_count}")
        
        cursor.execute("SELECT COUNT(*) FROM orders WHERE assigned_florist_id IS NOT NULL")
        assigned_count = cursor.fetchone()[0]
        print(f"Orders with assigned florists: {assigned_count}")
        
    except Exception as e:
        print(f"Error: {e}")
        if 'conn' in locals():
            conn.rollback()
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    main()