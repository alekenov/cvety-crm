#!/usr/bin/env python3
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from fastapi import Query
from typing import Optional

# Test what happens with Query objects
print("Testing FastAPI Query behavior...")

# Create a Query object like in the endpoint
category = Query(None, description="Filter by category")
print(f"category type: {type(category)}")
print(f"category value: {category}")
print(f"category repr: {repr(category)}")

# Try to access the default value
try:
    print(f"category.default: {category.default}")
except AttributeError as e:
    print(f"No default attribute: {e}")

# Check if it's the Query object itself being passed
print(f"\nIs category None? {category is None}")
print(f"Is category equal to None? {category == None}")

# Import the endpoint and inspect
from app.api.endpoints.products import read_products
import inspect
sig = inspect.signature(read_products)
print(f"\nEndpoint signature:")
for name, param in sig.parameters.items():
    print(f"  {name}: {param.annotation} = {param.default}")