#!/usr/bin/env python3
"""Check Railway PostgreSQL connection and data"""

import os
from sqlalchemy import create_engine, text
from app.core.config import settings

def check_railway_db():
    """Check connection to Railway PostgreSQL"""
    print("🔍 Checking Railway PostgreSQL connection...")
    print(f"DATABASE_URL: {settings.DATABASE_URL[:30]}...")
    
    try:
        engine = create_engine(settings.DATABASE_URL)
        
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version()"))
            version = result.scalar()
            print(f"✅ Connected to PostgreSQL: {version}")
            
            # Check tables
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name
            """))
            tables = [row[0] for row in result]
            
            if not tables:
                print("⚠️  No tables found. Run 'alembic upgrade head' first!")
                return
            
            print(f"\n📊 Found {len(tables)} tables:")
            for table in tables:
                print(f"   - {table}")
            
            # Check data counts
            print("\n📈 Data counts:")
            for table in ['customers', 'orders', 'products', 'warehouse_items']:
                if table in tables:
                    result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                    count = result.scalar()
                    print(f"   - {table}: {count} records")
            
            # Check if we need to initialize data
            result = conn.execute(text("SELECT COUNT(*) FROM customers"))
            if result.scalar() == 0:
                print("\n⚠️  Database is empty. Run one of these commands:")
                print("   - python import_to_postgres.py  (if you have sqlite_export.json)")
                print("   - python init_database.py       (to create sample data)")
            else:
                print("\n✅ Database contains data and is ready!")
                
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\n💡 Tips:")
        print("1. Make sure DATABASE_URL is set in .env file")
        print("2. Check if Railway PostgreSQL is running")
        print("3. Verify DATABASE_URL format (should start with postgresql://)")

if __name__ == "__main__":
    check_railway_db()