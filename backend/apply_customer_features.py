#!/usr/bin/env python3
"""
Apply customer interaction features to SQLite database.
This script manually applies the changes that Alembic migration couldn't handle.
"""

import sqlite3
import os
from datetime import datetime

# Database path
db_path = "flower_shop.db"

def run_migration():
    """Apply the customer features migration"""
    
    if not os.path.exists(db_path):
        print(f"❌ Database file {db_path} not found!")
        return False
    
    print(f"🔄 Applying customer features migration to {db_path}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # 1. Create order_photos table
        print("📸 Creating order_photos table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS order_photos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                photo_url TEXT NOT NULL,
                photo_type TEXT NOT NULL CHECK (photo_type IN ('pre_delivery', 'completion', 'process')),
                description TEXT,
                uploaded_by_user_id INTEGER NOT NULL,
                customer_feedback TEXT CHECK (customer_feedback IN ('like', 'dislike')),
                feedback_comment TEXT,
                feedback_date DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (order_id) REFERENCES orders (id),
                FOREIGN KEY (uploaded_by_user_id) REFERENCES users (id)
            )
        """)
        
        # Create index for order_photos 
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_order_photos_order_id ON order_photos (order_id)")
        
        # 2. Check if author_type column exists in comments table
        cursor.execute("PRAGMA table_info(comments)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'author_type' not in columns:
            print("💬 Adding author_type column to comments table...")
            cursor.execute("ALTER TABLE comments ADD COLUMN author_type TEXT DEFAULT 'staff' CHECK (author_type IN ('staff', 'customer'))")
        
        if 'customer_name' not in columns:
            print("👤 Adding customer_name column to comments table...")  
            cursor.execute("ALTER TABLE comments ADD COLUMN customer_name TEXT")
        
        # 3. Update existing comments to have author_type = 'staff'
        print("🔄 Updating existing comments with author_type...")
        cursor.execute("UPDATE comments SET author_type = 'staff' WHERE author_type IS NULL")
        
        # 4. Check current structure
        cursor.execute("SELECT COUNT(*) FROM order_photos")
        photos_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM comments WHERE author_type = 'staff'")
        staff_comments = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM comments WHERE author_type = 'customer'") 
        customer_comments = cursor.fetchone()[0]
        
        # Commit changes
        conn.commit()
        
        print(f"✅ Migration completed successfully!")
        print(f"📊 Database state:")
        print(f"   📸 Order photos: {photos_count}")
        print(f"   💬 Staff comments: {staff_comments}")
        print(f"   🗨️ Customer comments: {customer_comments}")
        
        return True
        
    except sqlite3.Error as e:
        print(f"❌ SQLite error: {e}")
        conn.rollback()
        return False
        
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        conn.rollback()
        return False
        
    finally:
        conn.close()

if __name__ == "__main__":
    success = run_migration()
    exit(0 if success else 1)