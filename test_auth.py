#!/usr/bin/env python3
"""Test JWT authentication on protected endpoints"""

import requests

BASE_URL = "http://localhost:8000/api"

def test_without_token():
    """Test access without token - should fail"""
    print("1. Testing without token:")
    response = requests.get(f"{BASE_URL}/customers/")
    print(f"Status: {response.status_code}")
    if response.status_code == 401:
        print("✅ Correctly rejected - no token")
    else:
        print("❌ ERROR: Should have been rejected!")
        print(f"Response: {response.text[:200]}...")

def test_with_invalid_token():
    """Test access with invalid token - should fail"""
    print("\n2. Testing with invalid token:")
    headers = {"Authorization": "Bearer invalid_token_12345"}
    response = requests.get(f"{BASE_URL}/customers/", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 401:
        print("✅ Correctly rejected - invalid token")
    else:
        print("❌ ERROR: Should have been rejected!")

def test_get_valid_token():
    """Get a valid token via auth endpoint"""
    print("\n3. Getting valid token via OTP:")
    
    # First request OTP
    otp_response = requests.post(f"{BASE_URL}/auth/request-otp", 
                                json={"phone": "+77001234567"})
    print(f"OTP request status: {otp_response.status_code}")
    
    if otp_response.status_code == 200:
        print("✅ OTP sent (or mock OTP in dev mode)")
        # In dev mode, OTP might be in response
        otp_data = otp_response.json()
        if "otp" in otp_data:
            print(f"Dev mode OTP: {otp_data['otp']}")
    
    # For testing, we'll skip actual OTP verification
    return None

def test_orders_endpoint():
    """Test orders endpoint protection"""
    print("\n4. Testing orders endpoint:")
    response = requests.get(f"{BASE_URL}/orders/")
    print(f"Status: {response.status_code}")
    if response.status_code == 401:
        print("✅ Orders endpoint is protected")
    else:
        print("❌ Orders endpoint is NOT protected!")

if __name__ == "__main__":
    print("Testing JWT Authentication\n" + "="*50)
    
    test_without_token()
    test_with_invalid_token()
    test_get_valid_token()
    test_orders_endpoint()
    
    print("\n" + "="*50)
    print("Authentication test completed!")