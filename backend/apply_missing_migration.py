#!/usr/bin/env python3
"""
Apply missing permissions column migration to Railway database
"""

from sqlalchemy import create_engine, text
import json

# Railway database connection
DATABASE_URL = "postgresql://postgres:vfCzyEUTxBOMWGUPygbySfGnlNNzBASf@yamanote.proxy.rlwy.net:15004/railway"

def apply_migration():
    """Apply the missing permissions column migration"""
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        try:
            # Start transaction
            trans = conn.begin()
            
            print("🔧 Applying migration: Add permissions column to users table")
            
            # Add permissions column
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS permissions JSON
            """))
            print("✅ Added permissions column")
            
            # Set default permissions for existing users based on their role
            
            # Admin gets all permissions
            conn.execute(text("""
                UPDATE users 
                SET permissions = '{"orders": true, "warehouse": true, "customers": true, "production": true, "settings": true, "users": true}'::json
                WHERE role = 'admin' AND permissions IS NULL
            """))
            print("✅ Set permissions for admin users")
            
            # Manager gets most permissions except users
            conn.execute(text("""
                UPDATE users 
                SET permissions = '{"orders": true, "warehouse": true, "customers": true, "production": true, "settings": true, "users": false}'::json
                WHERE role = 'manager' AND permissions IS NULL
            """))
            print("✅ Set permissions for manager users")
            
            # Florist gets orders and production
            conn.execute(text("""
                UPDATE users 
                SET permissions = '{"orders": true, "warehouse": false, "customers": false, "production": true, "settings": false, "users": false}'::json
                WHERE role = 'florist' AND permissions IS NULL
            """))
            print("✅ Set permissions for florist users")
            
            # Courier gets only orders
            conn.execute(text("""
                UPDATE users 
                SET permissions = '{"orders": true, "warehouse": false, "customers": false, "production": false, "settings": false, "users": false}'::json
                WHERE role = 'courier' AND permissions IS NULL
            """))
            print("✅ Set permissions for courier users")
            
            # Update alembic version
            conn.execute(text("""
                UPDATE alembic_version 
                SET version_num = '0fad4fe9421a'
                WHERE version_num = 'daf1f17ffd0d'
            """))
            print("✅ Updated alembic version to 0fad4fe9421a")
            
            # Commit transaction
            trans.commit()
            print("\n✅ Migration applied successfully!")
            
            # Verify the change
            result = conn.execute(text("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'users' 
                AND column_name = 'permissions'
            """))
            
            column = result.fetchone()
            if column:
                print(f"✅ Verified: permissions column exists ({column[1]})")
            
            # Check current alembic version
            result = conn.execute(text("SELECT version_num FROM alembic_version"))
            version = result.scalar()
            print(f"✅ Current migration version: {version}")
            
            # Show sample user with permissions
            result = conn.execute(text("""
                SELECT id, phone, role, permissions 
                FROM users 
                WHERE role = 'admin'
                LIMIT 1
            """))
            
            user = result.fetchone()
            if user:
                print(f"\n📊 Sample admin user:")
                print(f"   ID: {user[0]}")
                print(f"   Phone: {user[1]}")
                print(f"   Role: {user[2]}")
                print(f"   Permissions: {user[3]}")
            
        except Exception as e:
            trans.rollback()
            print(f"❌ Error applying migration: {e}")
            raise


if __name__ == "__main__":
    apply_migration()