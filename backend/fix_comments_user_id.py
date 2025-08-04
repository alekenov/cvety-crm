#!/usr/bin/env python3
"""
Fix comments table to make user_id nullable for customer comments.
SQLite doesn't support ALTER COLUMN, so we need to recreate the table.
"""

import sqlite3
import os

# Database path
db_path = "flower_shop.db"

def fix_comments_table():
    """Fix comments table to make user_id nullable"""
    
    if not os.path.exists(db_path):
        print(f"❌ Database file {db_path} not found!")
        return False
    
    print(f"🔄 Fixing comments table in {db_path}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # 1. Create new table with correct schema
        print("📝 Creating new comments table...")
        cursor.execute("""
            CREATE TABLE comments_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                user_id INTEGER,  -- Now nullable
                text TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                author_type TEXT DEFAULT 'staff' CHECK (author_type IN ('staff', 'customer')),
                customer_name TEXT,
                FOREIGN KEY (order_id) REFERENCES orders (id),
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        """)
        
        # 2. Copy existing data
        print("📋 Copying existing data...")
        cursor.execute("""
            INSERT INTO comments_new (id, order_id, user_id, text, created_at, updated_at, author_type, customer_name)
            SELECT id, order_id, user_id, text, created_at, updated_at, author_type, customer_name
            FROM comments
        """)
        
        # 3. Drop old table and rename new one
        print("🔄 Replacing old table...")
        cursor.execute("DROP TABLE comments")
        cursor.execute("ALTER TABLE comments_new RENAME TO comments")
        
        # 4. Recreate index
        cursor.execute("CREATE INDEX ix_comments_order_id ON comments (order_id)")
        
        # 5. Check result
        cursor.execute("SELECT COUNT(*) FROM comments")
        count = cursor.fetchone()[0]
        
        # Commit changes
        conn.commit()
        
        print(f"✅ Comments table fixed successfully!")
        print(f"📊 Preserved {count} existing comments")
        
        # Verify structure
        cursor.execute("PRAGMA table_info(comments)")
        columns = cursor.fetchall()
        for col in columns:
            if col[1] == 'user_id':
                nullable = "NULL" if col[3] == 0 else "NOT NULL"
                print(f"✅ user_id column is now {nullable}")
        
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
    success = fix_comments_table()
    exit(0 if success else 1)