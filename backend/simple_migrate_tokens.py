#!/usr/bin/env python3
"""
Simple migration script for SQLite to update tracking tokens
"""

import sqlite3
import secrets
from datetime import datetime

def generate_9digit_token():
    return str(secrets.randbelow(900000000) + 100000000)

def migrate_sqlite_tokens():
    # Connect to SQLite database
    conn = sqlite3.connect('flower_shop.db')
    cursor = conn.cursor()
    
    try:
        # Get all orders that need migration (not 9-digit)
        cursor.execute("""
            SELECT id, tracking_token 
            FROM orders 
            WHERE tracking_token IS NOT NULL 
            AND (LENGTH(tracking_token) != 9 OR tracking_token NOT GLOB '[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]')
            ORDER BY id
        """)
        
        orders = cursor.fetchall()
        print(f"Found {len(orders)} orders to migrate")
        
        if not orders:
            print("✅ No orders need migration")
            return
        
        # Get existing 9-digit tokens to avoid duplicates
        cursor.execute("""
            SELECT tracking_token 
            FROM orders 
            WHERE tracking_token IS NOT NULL 
            AND LENGTH(tracking_token) = 9 
            AND tracking_token GLOB '[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'
        """)
        
        existing_tokens = {row[0] for row in cursor.fetchall()}
        print(f"Protected {len(existing_tokens)} existing 9-digit tokens")
        
        # Generate new tokens
        updated_count = 0
        now = datetime.now()
        
        for order_id, old_token in orders:
            # Generate unique token
            new_token = generate_9digit_token()
            while new_token in existing_tokens:
                new_token = generate_9digit_token()
            
            existing_tokens.add(new_token)
            
            # Update the order
            cursor.execute("""
                UPDATE orders 
                SET tracking_token = ?, updated_at = ?
                WHERE id = ?
            """, (new_token, now, order_id))
            
            updated_count += 1
            
            if updated_count % 100 == 0:
                print(f"   ✅ Migrated {updated_count}/{len(orders)} orders...")
        
        # Commit all changes
        conn.commit()
        print(f"\n✅ Migration completed!")
        print(f"   - Updated {updated_count} orders")
        
        # Verify results
        cursor.execute("""
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN LENGTH(tracking_token) = 9 AND tracking_token GLOB '[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]' THEN 1 END) as nine_digit
            FROM orders 
            WHERE tracking_token IS NOT NULL
        """)
        
        total, nine_digit = cursor.fetchone()
        print(f"   - Total orders: {total}")
        print(f"   - 9-digit tokens: {nine_digit}")
        
        if total == nine_digit:
            print("   ✅ All tokens are now 9-digit format!")
        else:
            print(f"   ⚠️  {total - nine_digit} orders still need migration")
        
        # Show samples
        cursor.execute("SELECT id, tracking_token FROM orders LIMIT 5")
        samples = cursor.fetchall()
        print(f"\nSample tokens:")
        for order_id, token in samples:
            print(f"  Order {order_id}: {token}")
            
    except Exception as e:
        conn.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_sqlite_tokens()