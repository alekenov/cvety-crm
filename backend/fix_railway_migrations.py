#!/usr/bin/env python3
"""Fix Railway database migrations manually"""

import os
import sys
import subprocess
import psycopg2
from psycopg2 import sql

def get_database_url():
    """Get DATABASE_URL from Railway environment"""
    # Try to get from Railway run environment
    result = subprocess.run(['railway', 'run', 'printenv', 'DATABASE_URL'], 
                          capture_output=True, text=True)
    if result.returncode == 0 and result.stdout.strip():
        return result.stdout.strip()
    
    # Alternative method
    result = subprocess.run(['railway', 'variables'], 
                          capture_output=True, text=True)
    if result.returncode == 0:
        lines = result.stdout.split('\n')
        for line in lines:
            if 'DATABASE_URL' in line and 'postgresql://' in line:
                # Extract URL from table format
                parts = line.split('│')
                if len(parts) >= 2:
                    url = parts[1].strip()
                    if url.startswith('postgresql://'):
                        return url
    
    print("DATABASE_URL not found in Railway environment")
    sys.exit(1)

def main():
    print("Getting Railway DATABASE_URL...")
    db_url = get_database_url()
    print(f"Connecting to database...")
    
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
                REFERENCES users(id) ON DELETE SET NULL
            """)
        
        if 'courier_id' not in existing_columns:
            print("Adding courier_id column...")
            cursor.execute("""
                ALTER TABLE orders 
                ADD COLUMN courier_id INTEGER 
                REFERENCES users(id) ON DELETE SET NULL
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
        
        # Update alembic version
        cursor.execute("SELECT version_num FROM alembic_version")
        current_version = cursor.fetchone()
        
        if current_version and current_version[0] == 'ff770d44ed65':
            print("Updating alembic version...")
            cursor.execute("UPDATE alembic_version SET version_num = '1cb156b39497'")
        
        conn.commit()
        print("Database fixes applied successfully!")
        
    except Exception as e:
        print(f"Error: {e}")
        if 'conn' in locals():
            conn.rollback()
        sys.exit(1)
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    main()