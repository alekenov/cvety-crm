#!/usr/bin/env python3
"""Test JWT authentication on all protected endpoints"""

import requests

BASE_URL = "http://localhost:8000/api"

def test_endpoint(name, url, method="GET"):
    """Test if endpoint requires authentication"""
    if method == "GET":
        response = requests.get(url)
    else:
        response = requests.request(method, url, json={})
    
    if response.status_code in [401, 403]:
        print(f"✅ {name}: Protected (status {response.status_code})")
        return True
    else:
        print(f"❌ {name}: NOT protected (status {response.status_code})")
        return False

def main():
    print("Testing JWT Protection on All Endpoints\n" + "="*50)
    
    endpoints = [
        # Orders
        ("Orders List", f"{BASE_URL}/orders/"),
        ("Orders Get", f"{BASE_URL}/orders/1"),
        
        # Customers  
        ("Customers List", f"{BASE_URL}/customers/"),
        ("Customers Get", f"{BASE_URL}/customers/1"),
        
        # Products
        ("Products List", f"{BASE_URL}/products/"),
        ("Products Get", f"{BASE_URL}/products/1"),
        ("Products Create", f"{BASE_URL}/products/", "POST"),
        
        # Warehouse
        ("Warehouse List", f"{BASE_URL}/warehouse/"),
        ("Warehouse Get", f"{BASE_URL}/warehouse/1"),
        
        # Production
        ("Production Tasks", f"{BASE_URL}/production/tasks/"),
        ("Production Florists", f"{BASE_URL}/production/florists"),
        
        # Settings
        ("Settings Get", f"{BASE_URL}/settings/"),
        ("Settings Zones", f"{BASE_URL}/settings/delivery-zones"),
        
        # Public endpoints (should NOT require auth)
        ("Tracking", f"{BASE_URL}/tracking/ABC123"),
        ("Auth Request OTP", f"{BASE_URL}/auth/request-otp", "POST"),
    ]
    
    protected_count = 0
    total_protected = 0
    
    print("\nProtected Endpoints:")
    for name, url, *method in endpoints:
        if "Tracking" in name or "Auth" in name:
            continue
        m = method[0] if method else "GET"
        if test_endpoint(name, url, m):
            protected_count += 1
        total_protected += 1
    
    print("\nPublic Endpoints (should work without auth):")
    for name, url, *method in endpoints:
        if "Tracking" not in name and "Auth" not in name:
            continue
        m = method[0] if method else "GET"
        response = requests.request(m, url, json={"phone": "+77001234567"} if m == "POST" else None)
        if response.status_code < 400:
            print(f"✅ {name}: Public access OK (status {response.status_code})")
        else:
            print(f"⚠️  {name}: Status {response.status_code}")
    
    print(f"\n" + "="*50)
    print(f"Protected: {protected_count}/{total_protected} endpoints")
    print("Authentication setup completed!" if protected_count == total_protected else "Some endpoints still need protection!")

if __name__ == "__main__":
    main()