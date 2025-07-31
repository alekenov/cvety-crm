#!/usr/bin/env python3
"""Test Railway API endpoints"""

import requests
import json

# Test login
base_url = "https://cvety-kz-production.up.railway.app"

print("1. Testing login...")
login_response = requests.post(
    f"{base_url}/api/auth/request-otp",
    json={"phone": "+77771234567"}
)
print(f"Request OTP: {login_response.status_code}")
if login_response.status_code == 201:
    print(f"OTP response: {login_response.json()}")

# Get OTP from response
otp = login_response.json().get("otp", "123456")
verify_response = requests.post(
    f"{base_url}/api/auth/verify-otp",
    json={"phone": "+77771234567", "otp_code": otp}
)
print(f"Verify OTP: {verify_response.status_code}")
if verify_response.status_code != 200:
    print(f"Verify error: {verify_response.text}")

if verify_response.status_code == 200:
    token = verify_response.json().get("access_token")
    print(f"Got token: {token[:20]}...")
    
    # Test orders endpoint
    print("\n2. Testing orders endpoint...")
    headers = {"Authorization": f"Bearer {token}"}
    
    orders_response = requests.get(
        f"{base_url}/api/orders/",
        headers=headers,
        params={"page": 1, "limit": 5}
    )
    print(f"Orders endpoint: {orders_response.status_code}")
    
    if orders_response.status_code != 200:
        print(f"Error response: {orders_response.text[:500]}")
        
        # Try a specific order
        print("\n2a. Testing specific order endpoint...")
        order_response = requests.get(
            f"{base_url}/api/orders/1",
            headers=headers
        )
        print(f"Order 1 endpoint: {order_response.status_code}")
        if order_response.status_code != 200:
            print(f"Order error: {order_response.text[:500]}")
    else:
        data = orders_response.json()
        print(f"Orders found: {data.get('total', 0)}")
        print(f"Sample order: {json.dumps(data.get('items', [])[0] if data.get('items') else {}, indent=2)[:500]}")

# Test health endpoint
print("\n3. Testing health endpoint...")
health_response = requests.get(f"{base_url}/health")
print(f"Health check: {health_response.status_code}")
if health_response.status_code == 200:
    print(f"Health response: {health_response.json()}")