#!/usr/bin/env python3
"""
Script to fix users with modified phone numbers after changing uniqueness constraint.
This updates users who have modified phones (like +77771234567_shop3) back to original phones.
"""

import os
import sys
from sqlalchemy import create_engine, text
from datetime import datetime

def fix_phone_duplicates():
    # Get database URL
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        print("ERROR: DATABASE_URL not found in environment")
        sys.exit(1)
    
    # Fix postgres:// to postgresql://
    if db_url.startswith('postgres://'):
        db_url = db_url.replace('postgres://', 'postgresql://', 1)
    
    print(f"Connecting to database...")
    engine = create_engine(db_url)
    
    with engine.connect() as conn:
        # Find users with modified phones
        result = conn.execute(text("""
            SELECT u.id, u.phone, u.shop_id, s.phone as shop_phone
            FROM users u
            JOIN shops s ON s.id = u.shop_id
            WHERE u.phone LIKE '%_shop%' OR u.phone LIKE '%_admin%'
            ORDER BY u.shop_id
        """))
        
        users_to_fix = result.fetchall()
        
        if not users_to_fix:
            print("✅ No users with modified phones found. Nothing to fix.")
            return
        
        print(f"Found {len(users_to_fix)} users with modified phones:")
        for user in users_to_fix:
            print(f"  - User ID {user[0]}: phone={user[1]} (shop phone={user[3]})")
        
        print("\nFixing phone numbers...")
        
        for user_id, old_phone, shop_id, shop_phone in users_to_fix:
            # Update user phone to match shop phone
            conn.execute(text("""
                UPDATE users 
                SET phone = :new_phone, 
                    updated_at = :updated_at
                WHERE id = :user_id
            """), {
                'new_phone': shop_phone,
                'updated_at': datetime.utcnow(),
                'user_id': user_id
            })
            
            print(f"  ✅ Updated user ID {user_id}: {old_phone} → {shop_phone}")
        
        conn.commit()
        print("\n✅ Successfully fixed all modified phone numbers!")
        
        # Verify the fix
        result = conn.execute(text("""
            SELECT u.id, u.phone, u.shop_id, s.phone as shop_phone
            FROM users u
            JOIN shops s ON s.id = u.shop_id
            WHERE u.role = 'admin'
            ORDER BY u.shop_id
            LIMIT 10
        """))
        
        print("\nAdmin users after fix:")
        for row in result:
            match = "✅" if row[1] == row[3] else "❌"
            print(f"  {match} User ID {row[0]}: phone={row[1]}, shop_phone={row[3]}")

if __name__ == "__main__":
    fix_phone_duplicates()