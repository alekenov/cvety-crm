#!/usr/bin/env python3
"""Test Alembic migrations setup"""

import subprocess
import sys

def run_command(cmd):
    """Run a command and return output"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return result.returncode, result.stdout, result.stderr
    except Exception as e:
        return -1, "", str(e)

def test_alembic():
    print("Testing Alembic Migrations Setup\n" + "="*50)
    
    # Test 1: Check current migration
    print("\n1. Current migration:")
    code, stdout, stderr = run_command("alembic current")
    if code == 0:
        print(f"✅ Current migration: {stdout.strip()}")
    else:
        print(f"❌ Error: {stderr}")
    
    # Test 2: Check migration history
    print("\n2. Migration history:")
    code, stdout, stderr = run_command("alembic history --verbose")
    if code == 0:
        print("✅ Migration history:")
        for line in stdout.strip().split('\n'):
            print(f"  {line}")
    else:
        print(f"❌ Error: {stderr}")
    
    # Test 3: Check if migrations are up to date
    print("\n3. Check for pending migrations:")
    code, stdout, stderr = run_command("alembic check")
    if code == 0:
        if "No new upgrade operations detected" in stderr or not stderr:
            print("✅ Database is up to date with models")
        else:
            print(f"⚠️  {stderr}")
    else:
        print(f"❌ Error: {stderr}")
    
    # Test 4: Verify database tables
    print("\n4. Database tables:")
    from app.db.session import get_engine
    from sqlalchemy import inspect
    
    engine = get_engine()
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    print(f"✅ Found {len(tables)} tables:")
    for table in sorted(tables):
        print(f"  - {table}")
    
    # Test 5: Check alembic_version table
    if 'alembic_version' in tables:
        print("\n5. Alembic version table:")
        with engine.connect() as conn:
            result = conn.execute("SELECT version_num FROM alembic_version")
            version = result.fetchone()
            if version:
                print(f"✅ Current version in DB: {version[0]}")
            else:
                print("⚠️  No version recorded")
    
    print("\n" + "="*50)
    print("Alembic test completed!")

if __name__ == "__main__":
    # Add parent directory to path
    import os
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    
    test_alembic()