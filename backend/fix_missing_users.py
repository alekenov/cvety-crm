#!/usr/bin/env python3
"""
Script to fix shops without admin users in the database.
This ensures every shop has at least one admin user.
"""

import os
import sys
from sqlalchemy import create_engine, text
from datetime import datetime

def fix_missing_users():
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
        # Find shops without users
        result = conn.execute(text("""
            SELECT s.id, s.name, s.phone
            FROM shops s
            LEFT JOIN users u ON u.shop_id = s.id
            WHERE u.id IS NULL
            ORDER BY s.id
        """))
        
        shops_without_users = result.fetchall()
        
        if not shops_without_users:
            print("✅ All shops have users. Nothing to fix.")
            return
        
        print(f"Found {len(shops_without_users)} shops without users:")
        for shop in shops_without_users:
            print(f"  - Shop ID {shop[0]}: {shop[1]} ({shop[2]})")
        
        print("\nCreating admin users for these shops...")
        
        for shop_id, shop_name, shop_phone in shops_without_users:
            # Check if user with this phone already exists
            existing = conn.execute(text("""
                SELECT id, shop_id FROM users WHERE phone = :phone
            """), {'phone': shop_phone}).fetchone()
            
            if existing:
                # Update existing user to belong to this shop if they don't have a shop
                if existing[1] is None:
                    conn.execute(text("""
                        UPDATE users SET shop_id = :shop_id WHERE id = :user_id
                    """), {'shop_id': shop_id, 'user_id': existing[0]})
                    print(f"  ✅ Updated existing user (ID {existing[0]}) to shop ID {shop_id}")
                else:
                    # Create user with modified phone (add shop_id suffix)
                    modified_phone = f"{shop_phone}_shop{shop_id}"
                    email = f"admin@shop{shop_id}.com"
                    
                    result = conn.execute(text("""
                        INSERT INTO users (shop_id, phone, name, email, role, is_active, created_at, updated_at)
                        VALUES (:shop_id, :phone, :name, :email, 'admin', true, :created_at, :updated_at)
                        RETURNING id
                    """), {
                        'shop_id': shop_id,
                        'phone': modified_phone,
                        'name': shop_name,
                        'email': email,
                        'created_at': datetime.utcnow(),
                        'updated_at': datetime.utcnow()
                    })
                    
                    user_id = result.scalar()
                    print(f"  ✅ Created admin user (ID {user_id}) for shop ID {shop_id} with modified phone")
            else:
                # Create new user with original phone
                email = f"admin@{shop_phone[1:]}.com"
                
                result = conn.execute(text("""
                    INSERT INTO users (shop_id, phone, name, email, role, is_active, created_at, updated_at)
                    VALUES (:shop_id, :phone, :name, :email, 'admin', true, :created_at, :updated_at)
                    RETURNING id
                """), {
                    'shop_id': shop_id,
                    'phone': shop_phone,
                    'name': shop_name,
                    'email': email,
                    'created_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                })
                
                user_id = result.scalar()
                print(f"  ✅ Created admin user (ID {user_id}) for shop ID {shop_id}")
        
        conn.commit()
        print("\n✅ Successfully fixed all shops without users!")
        
        # Verify the fix
        result = conn.execute(text("""
            SELECT s.id, s.name, 
                   (SELECT COUNT(*) FROM users u WHERE u.shop_id = s.id) as user_count
            FROM shops s
            ORDER BY s.id
        """))
        
        print("\nFinal shop user counts:")
        for row in result:
            print(f"  - Shop ID {row[0]} ({row[1]}): {row[2]} users")

if __name__ == "__main__":
    fix_missing_users()