#!/usr/bin/env python3
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.api.endpoints.products import read_products
from app.api.deps import get_db
from app.db.session import SessionLocal

print("Testing products endpoint function directly...")

# Create a database session
db = SessionLocal()

try:
    # Call the endpoint function directly
    result = read_products(db=db)
    print(f"Success! Result: {result}")
except Exception as e:
    print(f"Error occurred: {type(e).__name__}: {str(e)}")
    import traceback
    traceback.print_exc()
finally:
    db.close()