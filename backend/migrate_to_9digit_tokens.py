#!/usr/bin/env python3
"""
Migration script to update existing tracking tokens to new 9-digit format.
This script will:
1. Find all orders with old tracking tokens
2. Generate new secure 9-digit tokens
3. Update the database while preserving order history

Usage:
python migrate_to_9digit_tokens.py [--dry-run]
"""

import os
import sys
import secrets
import argparse
from sqlalchemy import create_engine, text
from datetime import datetime

def generate_9digit_token(used_tokens=None):
    """Generate a secure 9-digit tracking token"""
    if used_tokens is None:
        used_tokens = set()
    
    max_attempts = 100
    for _ in range(max_attempts):
        # Generate a secure 9-digit number (100000000 to 999999999)
        token = str(secrets.randbelow(900000000) + 100000000)
        if token not in used_tokens:
            used_tokens.add(token)
            return token
    
    raise ValueError("Could not generate unique 9-digit token after maximum attempts")

def migrate_tokens(db_url, dry_run=False):
    """Migrate all existing tokens to new 9-digit format"""
    
    # Handle postgres:// vs postgresql:// URL format
    if db_url and db_url.startswith('postgres://'):
        db_url = db_url.replace('postgres://', 'postgresql://', 1)
    
    print(f"Connecting to database...")
    if dry_run:
        print("🔍 DRY RUN MODE - No changes will be made")
    
    engine = create_engine(db_url)
    
    with engine.connect() as conn:
        # Get all existing orders with their tracking tokens
        print("📊 Analyzing existing orders...")
        
        result = conn.execute(text("""
            SELECT id, tracking_token, created_at 
            FROM orders 
            WHERE tracking_token IS NOT NULL
            ORDER BY id
        """))
        
        orders = result.fetchall()
        print(f"Found {len(orders)} orders with tracking tokens")
        
        if not orders:
            print("✅ No orders found. Migration not needed.")
            return
        
        # Analyze current token formats
        old_format_count = 0
        new_format_count = 0
        
        for order in orders:
            token = order[1]  # tracking_token
            if token and len(token) == 9 and token.isdigit():
                new_format_count += 1
            else:
                old_format_count += 1
        
        print(f"📈 Token analysis:")
        print(f"   - Old format tokens: {old_format_count}")
        print(f"   - New format tokens: {new_format_count}")
        
        if old_format_count == 0:
            print("✅ All tokens are already in new format. Migration not needed.")
            return
        
        # Collect all existing 9-digit tokens to avoid duplicates
        existing_9digit_tokens = set()
        for order in orders:
            token = order[1]
            if token and len(token) == 9 and token.isdigit():
                existing_9digit_tokens.add(token)
        
        print(f"🔒 Protected {len(existing_9digit_tokens)} existing 9-digit tokens from duplication")
        
        # Generate migration map
        migration_map = []
        
        for order in orders:
            order_id = order[0]
            old_token = order[1]
            created_at = order[2]
            
            # Skip if already in new format
            if old_token and len(old_token) == 9 and old_token.isdigit():
                continue
            
            # Generate new token
            new_token = generate_9digit_token(existing_9digit_tokens)
            migration_map.append((order_id, old_token, new_token, created_at))
        
        print(f"🔄 Prepared {len(migration_map)} token migrations")
        
        if dry_run:
            print("\n📋 Migration preview:")
            for i, (order_id, old_token, new_token, created_at) in enumerate(migration_map[:10]):
                print(f"   Order {order_id}: {old_token} → {new_token}")
            
            if len(migration_map) > 10:
                print(f"   ... and {len(migration_map) - 10} more")
            
            print(f"\n🔍 To execute the migration, run without --dry-run flag")
            return
        
        # Execute migration
        print(f"\n🚀 Starting migration...")
        
        try:
            with conn.begin():
                updated_count = 0
                
                for order_id, old_token, new_token, created_at in migration_map:
                    # Update the tracking token
                    conn.execute(text("""
                        UPDATE orders 
                        SET tracking_token = :new_token, updated_at = :updated_at
                        WHERE id = :order_id
                    """), {
                        'new_token': new_token,
                        'order_id': order_id,
                        'updated_at': datetime.now()
                    })
                    
                    updated_count += 1
                    
                    if updated_count % 50 == 0:
                        print(f"   ✅ Migrated {updated_count}/{len(migration_map)} orders...")
                
                print(f"   ✅ Committing {updated_count} token updates...")
            
            print(f"\n✅ Migration completed successfully!")
            print(f"   - Updated {updated_count} orders")
            print(f"   - All tokens are now 9-digit secure format")
            
            # Verify migration
            print(f"\n🔍 Verifying migration...")
            verification = conn.execute(text("""
                SELECT 
                    COUNT(*) as total_orders,
                    COUNT(CASE WHEN LENGTH(tracking_token) = 9 AND tracking_token GLOB '[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]' THEN 1 END) as new_format_count
                FROM orders 
                WHERE tracking_token IS NOT NULL
            """)).fetchone()
            
            total = verification[0]
            new_format = verification[1]
            
            if total == new_format:
                print(f"   ✅ Verification passed: {new_format}/{total} orders have new format tokens")
            else:
                print(f"   ⚠️  Warning: {new_format}/{total} orders have new format tokens")
            
        except Exception as e:
            print(f"❌ Migration failed: {e}")
            raise
        
        print(f"\n🎉 Migration completed successfully!")
        print(f"All tracking tokens are now unified 9-digit numbers.")

def main():
    parser = argparse.ArgumentParser(description='Migrate tracking tokens to 9-digit format')
    parser.add_argument('--dry-run', action='store_true', 
                       help='Preview changes without executing them')
    args = parser.parse_args()
    
    # Get database URL from environment
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        print("❌ Error: DATABASE_URL environment variable not set")
        print("   Set it like: export DATABASE_URL='postgresql://user:pass@host:port/dbname'")
        sys.exit(1)
    
    try:
        migrate_tokens(db_url, dry_run=args.dry_run)
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()