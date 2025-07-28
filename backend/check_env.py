#!/usr/bin/env python3
"""Check environment variables in Railway"""

import os
import sys

print("=== Environment Variables Check ===")
print(f"DATABASE_URL: {os.environ.get('DATABASE_URL', 'NOT SET')[:50]}...")
print(f"SECRET_KEY: {os.environ.get('SECRET_KEY', 'NOT SET')[:20]}...")
print(f"PORT: {os.environ.get('PORT', 'NOT SET')}")
print(f"RAILWAY_ENVIRONMENT: {os.environ.get('RAILWAY_ENVIRONMENT', 'NOT SET')}")

# Test config loading
try:
    sys.path.insert(0, os.path.dirname(__file__))
    from app.core.config import settings
    print("\n=== Config Settings ===")
    print(f"DATABASE_URL from config: {settings.DATABASE_URL[:50]}...")
    print(f"SECRET_KEY from config: {settings.SECRET_KEY[:20]}...")
    print(f"PORT from config: {settings.PORT}")
except Exception as e:
    print(f"\nError loading config: {e}")