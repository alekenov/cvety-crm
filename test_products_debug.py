#!/usr/bin/env python3
"""Debug products API issue"""
import sys
sys.path.insert(0, 'backend')

from app.crud.product import product

# Check if count_active method exists
if hasattr(product, 'count_active'):
    print("✅ count_active method exists")
else:
    print("❌ count_active method NOT found")
    print(f"Available methods: {[m for m in dir(product) if not m.startswith('_')]}")