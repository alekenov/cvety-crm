#!/usr/bin/env python3
"""
Debug script to test authentication flow on production
"""

import requests
import json
import time

BASE_URL = "https://cvety-kz-production.up.railway.app/api"
PHONE = "+77771234567"

print("🔍 Testing authentication flow on production")
print("=" * 50)

# Step 1: Request OTP
print("\n1. Requesting OTP...")
response = requests.post(
    f"{BASE_URL}/auth/request-otp",
    json={"phone": PHONE}
)

print(f"   Status: {response.status_code}")
if response.status_code == 201:
    data = response.json()
    print(f"   Response: {json.dumps(data, indent=2)}")
    otp = data.get("otp")
    
    if otp:
        print(f"\n   ✅ Got OTP: {otp}")
        
        # Small delay to ensure OTP is saved
        time.sleep(1)
        
        # Step 2: Verify OTP
        print("\n2. Verifying OTP...")
        verify_response = requests.post(
            f"{BASE_URL}/auth/verify-otp",
            json={"phone": PHONE, "otp_code": otp}
        )
        
        print(f"   Status: {verify_response.status_code}")
        
        if verify_response.status_code == 200:
            verify_data = verify_response.json()
            print(f"   ✅ Authentication successful!")
            print(f"   Token: {verify_data.get('access_token', 'N/A')[:50]}...")
            print(f"   Shop ID: {verify_data.get('shop_id')}")
            print(f"   Shop Name: {verify_data.get('shop_name')}")
        else:
            print(f"   ❌ Verification failed")
            print(f"   Response: {verify_response.text}")
            
            # Try with wrong OTP to see different error
            print("\n3. Testing with wrong OTP...")
            wrong_response = requests.post(
                f"{BASE_URL}/auth/verify-otp",
                json={"phone": PHONE, "otp_code": "000000"}
            )
            print(f"   Status: {wrong_response.status_code}")
            print(f"   Response: {wrong_response.text}")
    else:
        print("   ⚠️ OTP not returned (production mode?)")
else:
    print(f"   ❌ Request failed")
    print(f"   Response: {response.text}")

print("\n" + "=" * 50)
print("Test complete")