#!/usr/bin/env python3
import requests
import json

print("Testing products endpoint via HTTP...")

try:
    response = requests.get("http://localhost:8001/api/products/")
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    if response.status_code == 200:
        print(f"Response JSON: {json.dumps(response.json(), indent=2)}")
    else:
        print(f"Response Text: {response.text}")
except Exception as e:
    print(f"Error: {e}")

# Test with parameters
print("\n\nTesting with parameters...")
try:
    params = {
        "category": "bouquet",
        "limit": 10
    }
    response = requests.get("http://localhost:8001/api/products/", params=params)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Items count: {len(data.get('items', []))}")
        print(f"Total: {data.get('total', 0)}")
    else:
        print(f"Response Text: {response.text}")
except Exception as e:
    print(f"Error: {e}")