#!/usr/bin/env python3
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.api.endpoints.products import read_products
from app.api.deps import get_db
from app.db.session import SessionLocal

print("Testing products endpoint with no parameters...")

# Create a database session
db = SessionLocal()

try:
    # Call the endpoint function directly with explicit None values
    result = read_products(
        db=db,
        skip=0,
        limit=100,
        category=None,
        search=None,
        is_popular=None,
        is_new=None,
        min_price=None,
        max_price=None,
        on_sale=None
    )
    print(f"Success! Result: {result}")
except Exception as e:
    print(f"Error occurred: {type(e).__name__}: {str(e)}")
    import traceback
    traceback.print_exc()
finally:
    db.close()