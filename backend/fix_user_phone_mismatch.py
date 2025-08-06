#!/usr/bin/env python3
"""
Script to fix phone number mismatches between users and their shops.
Specifically fixes User ID 1 which has +77771234567 but belongs to Shop 1 with +77015211545.
"""

import os
import sys
from sqlalchemy import create_engine, text
from datetime import datetime

def fix_user_phone_mismatch():
    # Get database URL
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        print("ERROR: DATABASE_URL not found in environment")
        sys.exit(1)
    
    # Fix postgres:// to postgresql://
    if db_url.startswith('postgres://'):
        db_url = db_url.replace('postgres://', 'postgresql://', 1)
    
    print(f"Connecting to database...")
    print(f"Database URL: {db_url[:30]}...")
    
    engine = create_engine(db_url)
    
    with engine.connect() as conn:
        print("\n=== Analyzing phone mismatches ===")
        
        # Find users whose phone doesn't match their shop's phone
        result = conn.execute(text("""
            SELECT u.id, u.name, u.phone as user_phone, 
                   u.shop_id, s.name as shop_name, s.phone as shop_phone
            FROM users u
            JOIN shops s ON s.id = u.shop_id
            WHERE u.phone != s.phone
            AND u.role = 'admin'
            ORDER BY u.id
        """))
        
        mismatches = result.fetchall()
        
        if not mismatches:
            print("✅ No phone mismatches found for admin users")
            return
        
        print(f"Found {len(mismatches)} admin users with phone mismatches:")
        for user_id, user_name, user_phone, shop_id, shop_name, shop_phone in mismatches:
            print(f"\n  User ID {user_id}: {user_name}")
            print(f"    Current phone: {user_phone}")
            print(f"    Shop {shop_id} ({shop_name}) phone: {shop_phone}")
            print(f"    Will change to: {shop_phone}")
        
        print("\n=== Fixing phone mismatches ===")
        
        for user_id, user_name, user_phone, shop_id, shop_name, shop_phone in mismatches:
            try:
                # First check if another user already has this phone in this shop
                existing = conn.execute(text("""
                    SELECT id, name FROM users 
                    WHERE shop_id = :shop_id 
                    AND phone = :shop_phone 
                    AND id != :user_id
                """), {
                    'shop_id': shop_id,
                    'shop_phone': shop_phone,
                    'user_id': user_id
                }).fetchone()
                
                if existing:
                    print(f"  ⚠️ User ID {existing[0]} ({existing[1]}) already has phone {shop_phone} in shop {shop_id}")
                    print(f"     Skipping User ID {user_id}")
                    continue
                
                # Update the user's phone to match the shop's phone
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
                
                conn.commit()
                print(f"  ✅ Fixed User ID {user_id}: {user_phone} → {shop_phone}")
                
            except Exception as e:
                print(f"  ❌ Failed to fix User ID {user_id}: {e}")
                conn.rollback()
        
        print("\n=== Verifying fix ===")
        
        # Check if Shop 3 can now work with +77771234567
        result = conn.execute(text("""
            SELECT s.id, s.name, s.phone,
                   (SELECT COUNT(*) FROM users WHERE shop_id = s.id AND phone = s.phone) as matching_users
            FROM shops s
            WHERE s.phone = '+77771234567'
        """))
        
        shop3 = result.fetchone()
        if shop3:
            print(f"\nShop 3 status:")
            print(f"  Phone: {shop3[2]}")
            print(f"  Users with matching phone: {shop3[3]}")
            
            if shop3[3] == 0:
                print("  ⚠️ Shop 3 needs an admin user, creating one...")
                try:
                    conn.execute(text("""
                        INSERT INTO users (shop_id, phone, name, email, role, is_active, created_at, updated_at)
                        VALUES (:shop_id, :phone, :name, :email, 'admin', true, :now, :now)
                    """), {
                        'shop_id': shop3[0],
                        'phone': shop3[2],
                        'name': shop3[1],
                        'email': f"admin@shop{shop3[0]}.com",
                        'now': datetime.utcnow()
                    })
                    conn.commit()
                    print("  ✅ Created admin user for Shop 3")
                except Exception as e:
                    print(f"  ❌ Failed to create admin for Shop 3: {e}")
                    conn.rollback()
        
        # Final verification
        print("\n=== Final verification ===")
        
        result = conn.execute(text("""
            SELECT s.id, s.name, s.phone,
                   COUNT(DISTINCT u.id) as user_count,
                   COUNT(DISTINCT CASE WHEN u.phone = s.phone THEN u.id END) as matching_users
            FROM shops s
            LEFT JOIN users u ON u.shop_id = s.id
            GROUP BY s.id, s.name, s.phone
            ORDER BY s.id
        """))
        
        print("\nAll shops status:")
        all_good = True
        for row in result:
            status = "✅" if row[4] > 0 else "❌"
            if row[4] == 0:
                all_good = False
            print(f"  {status} Shop {row[0]} ({row[1]}): phone={row[2]}, matching users={row[4]}")
        
        if all_good:
            print("\n✅ All shops have admin users with matching phone numbers!")
        else:
            print("\n⚠️ Some shops still need attention")
        
        # Check for conflicts
        result = conn.execute(text("""
            SELECT phone, array_agg(DISTINCT shop_id ORDER BY shop_id) as shops
            FROM users
            GROUP BY phone
            HAVING COUNT(DISTINCT shop_id) > 1
        """))
        
        conflicts = result.fetchall()
        if conflicts:
            print(f"\n⚠️ Phone conflicts found:")
            for phone, shops in conflicts:
                print(f"  {phone}: used in shops {shops}")
        else:
            print("\n✅ No phone conflicts between shops!")

if __name__ == "__main__":
    fix_user_phone_mismatch()