#!/usr/bin/env python3
"""Test Railway deployment functionality"""

import requests
import time

BASE_URL = "https://cvety-kz-production.up.railway.app"

def test_railway_deployment():
    """Test Railway deployment endpoints"""
    print("Testing Railway Deployment\n" + "="*50)
    
    # 1. Health check
    print("\n1. Testing health check...")
    try:
        response = requests.get(f"{BASE_URL}/", timeout=30)
        if response.status_code == 200:
            print("✅ Health check passed")
            try:
                print(f"   Response: {response.json()}")
            except:
                print(f"   Response: {response.text}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return
    except Exception as e:
        print(f"❌ Failed to connect to Railway: {str(e)}")
        return

    # 2. API health check
    print("\n2. Testing API health...")
    try:
        response = requests.get(f"{BASE_URL}/api/health/db", timeout=30)
        if response.status_code == 200:
            print("✅ Database health check passed")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Database health failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Database health check error: {str(e)}")

    # 3. Test auth endpoint (should work without token)
    print("\n3. Testing auth endpoint...")
    try:
        auth_data = {"phone": "+77001234567"}
        response = requests.post(f"{BASE_URL}/api/auth/request-otp", json=auth_data, timeout=30)
        if response.status_code == 201:
            print("✅ Auth endpoint working")
            result = response.json()
            if "otp" in result:  # DEBUG mode
                print(f"   OTP: {result['otp']} (DEBUG mode)")
                return result['otp']
            else:
                print("   OTP sent (PRODUCTION mode)")
        else:
            print(f"❌ Auth endpoint failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Auth endpoint error: {str(e)}")
    
    return None

def test_protected_endpoints(otp_code=None):
    """Test protected endpoints if OTP is available"""
    if not otp_code:
        print("\n4. Skipping protected endpoint tests (no OTP available)")
        return
    
    print(f"\n4. Testing protected endpoints with OTP: {otp_code}...")
    
    try:
        # Verify OTP to get token
        verify_data = {"phone": "+77001234567", "otp_code": otp_code}
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json=verify_data, timeout=30)
        
        if response.status_code == 200:
            token = response.json().get("access_token")
            print("✅ Authentication successful")
            
            headers = {"Authorization": f"Bearer {token}"}
            
            # Test products endpoint
            products_response = requests.get(f"{BASE_URL}/api/products/", headers=headers, timeout=30)
            if products_response.status_code == 200:
                products = products_response.json()
                print(f"✅ Products API working ({products.get('total', 0)} products)")
            else:
                print(f"❌ Products API failed: {products_response.status_code}")
            
            # Test warehouse endpoint
            warehouse_response = requests.get(f"{BASE_URL}/api/warehouse/", headers=headers, timeout=30)
            if warehouse_response.status_code == 200:
                warehouse = warehouse_response.json()
                print(f"✅ Warehouse API working ({warehouse.get('total', 0)} items)")
            else:
                print(f"❌ Warehouse API failed: {warehouse_response.status_code}")
                print(f"   Response: {warehouse_response.text}")
            
            # Test upload endpoint with a small test file
            print("\n5. Testing image upload...")
            try:
                from io import BytesIO
                # Create minimal image data
                test_image = b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb'
                files = {'file': ('test.jpg', BytesIO(test_image), 'image/jpeg')}
                upload_response = requests.post(f"{BASE_URL}/api/upload/image", files=files, headers=headers, timeout=30)
                
                if upload_response.status_code == 201:
                    print("✅ Image upload working")
                    print(f"   Uploaded: {upload_response.json().get('url', 'N/A')}")
                else:
                    print(f"❌ Image upload failed: {upload_response.status_code}")
                    print(f"   Response: {upload_response.text}")
            except Exception as e:
                print(f"❌ Image upload test error: {str(e)}")
                
        else:
            print(f"❌ Authentication failed: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Protected endpoints test error: {str(e)}")

def main():
    print("Railway Deployment Test")
    print(f"Testing: {BASE_URL}")
    
    otp_code = test_railway_deployment()
    test_protected_endpoints(otp_code)
    
    print("\n" + "="*50)
    print("Railway deployment test completed!")

if __name__ == "__main__":
    main()