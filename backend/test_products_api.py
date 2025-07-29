#!/usr/bin/env python3
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from fastapi.testclient import TestClient
from app.main import app
import logging

# Enable logging to see the error
logging.basicConfig(level=logging.DEBUG)

client = TestClient(app)

print("Testing /api/products/ endpoint...")
try:
    response = client.get("/api/products/")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    if response.status_code != 200:
        print(f"Headers: {response.headers}")
except Exception as e:
    print(f"Exception occurred: {type(e).__name__}: {str(e)}")
    import traceback
    traceback.print_exc()