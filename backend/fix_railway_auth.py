#!/usr/bin/env python3
"""
Comprehensive script to fix authentication issues on Railway:
1. Fix database constraints
2. Fix modified phone numbers
3. Ensure all shops have admin users
"""

import os
import sys
from sqlalchemy import create_engine, text
from datetime import datetime

def fix_railway_auth():
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
        print("\n=== STEP 1: Check current constraints ===")
        
        # Check existing constraints
        result = conn.execute(text("""
            SELECT conname, contype
            FROM pg_constraint 
            WHERE conrelid = 'users'::regclass
            AND conname IN ('ix_users_phone', 'uq_users_shop_phone')
        """))
        
        constraints = {row[0]: row[1] for row in result}
        print(f"Found constraints: {constraints}")
        
        # Check indexes
        result = conn.execute(text("""
            SELECT indexname 
            FROM pg_indexes 
            WHERE tablename = 'users' 
            AND indexname LIKE '%phone%'
        """))
        
        indexes = [row[0] for row in result]
        print(f"Found indexes: {indexes}")
        
        print("\n=== STEP 2: Fix constraints if needed ===")
        
        # Fix constraints if needed
        if 'ix_users_phone' in indexes:
            try:
                print("Dropping old unique index ix_users_phone...")
                conn.execute(text("DROP INDEX IF EXISTS ix_users_phone CASCADE"))
                conn.commit()
                print("  ✅ Dropped old unique index")
            except Exception as e:
                print(f"  ⚠️ Could not drop index: {e}")
                conn.rollback()
        
        # Create composite unique constraint if not exists
        if 'uq_users_shop_phone' not in constraints:
            try:
                print("Creating composite unique constraint...")
                conn.execute(text("""
                    ALTER TABLE users 
                    ADD CONSTRAINT uq_users_shop_phone 
                    UNIQUE (shop_id, phone)
                """))
                conn.commit()
                print("  ✅ Created composite unique constraint")
            except Exception as e:
                print(f"  ⚠️ Constraint might already exist: {e}")
                conn.rollback()
        
        # Create performance index if not exists
        if 'ix_users_phone_perf' not in indexes:
            try:
                conn.execute(text("CREATE INDEX ix_users_phone_perf ON users(phone)"))
                conn.commit()
                print("  ✅ Created performance index")
            except Exception as e:
                print(f"  ⚠️ Index might already exist: {e}")
                conn.rollback()
        
        print("\n=== STEP 3: Fix modified phone numbers ===")
        
        # Find users with modified phones
        result = conn.execute(text("""
            SELECT u.id, u.phone, u.shop_id, s.phone as shop_phone, u.name
            FROM users u
            JOIN shops s ON s.id = u.shop_id
            WHERE u.phone LIKE '%_shop%' OR u.phone LIKE '%_admin%'
            ORDER BY u.shop_id
        """))
        
        users_to_fix = result.fetchall()
        
        if users_to_fix:
            print(f"Found {len(users_to_fix)} users with modified phones:")
            for user in users_to_fix:
                print(f"  - User ID {user[0]} ({user[4]}): {user[1]} → {user[3]}")
            
            for user_id, old_phone, shop_id, shop_phone, name in users_to_fix:
                try:
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
                    print(f"  ✅ Fixed user ID {user_id}")
                except Exception as e:
                    print(f"  ❌ Failed to fix user ID {user_id}: {e}")
                    conn.rollback()
        else:
            print("  ✅ No users with modified phones found")
        
        print("\n=== STEP 4: Ensure all shops have admin users ===")
        
        # Find shops without admin users
        result = conn.execute(text("""
            SELECT s.id, s.name, s.phone, 
                   (SELECT COUNT(*) FROM users u WHERE u.shop_id = s.id) as user_count,
                   (SELECT COUNT(*) FROM users u WHERE u.shop_id = s.id AND u.role = 'admin') as admin_count
            FROM shops s
            ORDER BY s.id
        """))
        
        shops = result.fetchall()
        
        print(f"Found {len(shops)} shops:")
        for shop in shops:
            status = "✅" if shop[4] > 0 else "⚠️"
            print(f"  {status} Shop ID {shop[0]} ({shop[1]}): {shop[3]} users, {shop[4]} admins")
        
        # Create admin users for shops without them
        shops_needing_admin = [s for s in shops if s[4] == 0]
        
        if shops_needing_admin:
            print(f"\nCreating admin users for {len(shops_needing_admin)} shops...")
            
            for shop_id, shop_name, shop_phone, user_count, admin_count in shops_needing_admin:
                try:
                    # Create admin user with same phone as shop
                    conn.execute(text("""
                        INSERT INTO users (shop_id, phone, name, email, role, is_active, created_at, updated_at)
                        VALUES (:shop_id, :phone, :name, :email, 'admin', true, :now, :now)
                    """), {
                        'shop_id': shop_id,
                        'phone': shop_phone,
                        'name': shop_name or f"Admin {shop_id}",
                        'email': f"admin@shop{shop_id}.com",
                        'now': datetime.utcnow()
                    })
                    conn.commit()
                    print(f"  ✅ Created admin for shop ID {shop_id}")
                except Exception as e:
                    print(f"  ❌ Failed to create admin for shop ID {shop_id}: {e}")
                    conn.rollback()
        
        print("\n=== STEP 5: Final verification ===")
        
        # Verify all shops have proper users
        result = conn.execute(text("""
            SELECT s.id, s.name, s.phone,
                   COUNT(DISTINCT u.id) as user_count,
                   COUNT(DISTINCT CASE WHEN u.role = 'admin' THEN u.id END) as admin_count,
                   COUNT(DISTINCT CASE WHEN u.phone = s.phone THEN u.id END) as matching_phone_count
            FROM shops s
            LEFT JOIN users u ON u.shop_id = s.id
            GROUP BY s.id, s.name, s.phone
            ORDER BY s.id
        """))
        
        print("\nFinal shop status:")
        all_good = True
        for row in result:
            if row[4] > 0 and row[5] > 0:
                status = "✅"
            else:
                status = "❌"
                all_good = False
            
            print(f"  {status} Shop ID {row[0]} ({row[1]}): {row[3]} users, {row[4]} admins, {row[5]} with matching phone")
        
        if all_good:
            print("\n✅ All shops are properly configured!")
        else:
            print("\n⚠️ Some shops still need attention")
        
        # Check for duplicate phones across shops
        print("\n=== STEP 6: Check for phone conflicts ===")
        
        result = conn.execute(text("""
            SELECT phone, COUNT(DISTINCT shop_id) as shop_count, array_agg(DISTINCT shop_id) as shops
            FROM users
            GROUP BY phone
            HAVING COUNT(DISTINCT shop_id) > 1
        """))
        
        conflicts = result.fetchall()
        if conflicts:
            print(f"⚠️ Found {len(conflicts)} phone numbers used across multiple shops:")
            for phone, count, shops in conflicts:
                print(f"  - {phone}: used in shops {shops}")
        else:
            print("✅ No phone conflicts found")

if __name__ == "__main__":
    fix_railway_auth()