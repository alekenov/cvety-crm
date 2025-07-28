#!/usr/bin/env python3
"""Setup Railway database - run this after adding PostgreSQL in Railway dashboard"""

import os
import subprocess
import sys
import json

def run_command(cmd, cwd=None):
    """Run shell command and return output"""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=cwd)
    return result.returncode, result.stdout, result.stderr

def main():
    print("🚀 Railway Database Setup for Cvety.kz")
    print("=" * 40)
    
    # Check Railway CLI
    code, _, _ = run_command("which railway")
    if code != 0:
        print("❌ Railway CLI not found. Install with: npm install -g @railway/cli")
        sys.exit(1)
    
    # Check login
    code, stdout, _ = run_command("railway whoami")
    if code != 0:
        print("❌ Not logged in to Railway. Run: railway login")
        sys.exit(1)
    print(f"✅ Logged in as: {stdout.strip()}")
    
    # Check project
    code, stdout, _ = run_command("railway status")
    if code != 0:
        print("❌ No Railway project linked. Run: railway link")
        sys.exit(1)
    print(f"✅ Project: {stdout.strip()}")
    
    # Get DATABASE_URL
    print("\n📥 Getting DATABASE_URL from Railway...")
    code, stdout, stderr = run_command("railway variables --json")
    
    if code != 0:
        print(f"❌ Failed to get variables: {stderr}")
        print("\n⚠️  Please add PostgreSQL to your Railway project:")
        print("1. Open https://railway.app")
        print("2. Go to your project")
        print("3. Click 'New' → 'Database' → 'Add PostgreSQL'")
        print("4. Wait for it to deploy")
        print("5. Run this script again")
        sys.exit(1)
    
    try:
        variables = json.loads(stdout)
        database_url = variables.get('DATABASE_URL')
        
        if not database_url:
            print("❌ No DATABASE_URL found in Railway variables")
            print("\n⚠️  Please add PostgreSQL to your Railway project (see instructions above)")
            sys.exit(1)
            
    except json.JSONDecodeError:
        print("❌ Failed to parse Railway variables")
        sys.exit(1)
    
    # Save to .env
    backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
    env_path = os.path.join(backend_dir, '.env')
    
    print(f"\n💾 Saving DATABASE_URL to {env_path}")
    with open(env_path, 'w') as f:
        f.write(f"DATABASE_URL={database_url}\n")
        f.write("SECRET_KEY=your-secret-key-here-change-in-production\n")
    
    # Run migrations
    print("\n🗄️  Running database migrations...")
    os.chdir(backend_dir)
    
    code, stdout, stderr = run_command("railway run alembic upgrade head")
    if code != 0:
        print(f"⚠️  Alembic failed: {stderr}")
        print("Creating tables directly...")
        
        # Try direct table creation
        code, stdout, stderr = run_command("""railway run python -c "
from app.db.base import Base
from app.core.config import settings
from sqlalchemy import create_engine
engine = create_engine(settings.DATABASE_URL)
Base.metadata.create_all(bind=engine)
print('✅ Tables created!')
"
""")
        if code != 0:
            print(f"❌ Failed to create tables: {stderr}")
            sys.exit(1)
    
    # Import data
    print("\n📊 Importing data...")
    if os.path.exists('sqlite_export.json'):
        print("Found sqlite_export.json, importing...")
        code, stdout, stderr = run_command("railway run python import_to_postgres.py")
        if code != 0:
            print(f"⚠️  Import failed: {stderr}")
            print("You can try running: railway run python init_database.py")
    else:
        print("No sqlite_export.json found, creating sample data...")
        code, stdout, stderr = run_command("railway run python init_database.py")
        if code != 0:
            print(f"❌ Failed to create sample data: {stderr}")
    
    # Check database
    print("\n🔍 Checking database...")
    code, stdout, stderr = run_command("railway run python check_railway_db.py")
    if code == 0:
        print(stdout)
    else:
        print(f"⚠️  Check failed: {stderr}")
    
    print("\n✅ Database setup complete!")
    print("\nNext steps:")
    print("1. Go to project root: cd ..")
    print("2. Deploy app: railway up")
    print("3. Open your app: railway open")

if __name__ == "__main__":
    main()