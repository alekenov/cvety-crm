#!/usr/bin/env python3
"""
Quick API Testing Script for Cvety.kz
Быстрое тестирование основных API endpoints
"""

import requests
import json
from datetime import datetime, timedelta
import random

# Configuration
API_URL = "https://cvety-kz-production.up.railway.app/api"

def test_api():
    """Run quick API tests"""
    print("🚀 Starting Quick API Tests")
    print(f"URL: {API_URL}")
    print("-" * 50)
    
    results = []
    
    # Test 1: Check API availability
    print("\n1️⃣ Checking API availability...")
    try:
        response = requests.get(API_URL + "/health/db")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API is accessible - {data.get('database_type', 'unknown')} database")
            results.append(("API Health", True))
        else:
            print(f"❌ API returned status: {response.status_code}")
            results.append(("API Health", False))
    except Exception as e:
        print(f"❌ Cannot connect to API: {e}")
        results.append(("API Health", False))
        return
    
    # Test 2: Customers endpoint
    print("\n2️⃣ Testing Customers API...")
    try:
        response = requests.get(API_URL + "/customers/")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Customers loaded: {data.get('total', 0)} customers")
            results.append(("GET /customers/", True))
        else:
            print(f"❌ Failed to load customers: {response.status_code}")
            results.append(("GET /customers/", False))
    except Exception as e:
        print(f"❌ Error: {e}")
        results.append(("GET /customers/", False))
    
    # Test 3: Orders endpoint
    print("\n3️⃣ Testing Orders API...")
    try:
        response = requests.get(API_URL + "/orders/")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Orders loaded: {data.get('total', 0)} orders")
            results.append(("GET /orders/", True))
        else:
            print(f"❌ Failed to load orders: {response.status_code}")
            results.append(("GET /orders/", False))
    except Exception as e:
        print(f"❌ Error: {e}")
        results.append(("GET /orders/", False))
    
    # Test 4: Warehouse endpoint
    print("\n4️⃣ Testing Warehouse API...")
    try:
        response = requests.get(API_URL + "/warehouse/")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Warehouse loaded: {data.get('total', 0)} items")
            results.append(("GET /warehouse/", True))
        else:
            print(f"❌ Failed to load warehouse: {response.status_code}")
            results.append(("GET /warehouse/", False))
    except Exception as e:
        print(f"❌ Error: {e}")
        results.append(("GET /warehouse/", False))
    
    # Test 5: Products endpoint (catalog)
    print("\n5️⃣ Testing Products API...")
    try:
        response = requests.get(API_URL + "/products/")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Products loaded: {data.get('total', 0)} products")
            results.append(("GET /products/", True))
        else:
            print(f"❌ Failed to load products: {response.status_code}")
            results.append(("GET /products/", False))
    except Exception as e:
        print(f"❌ Error: {e}")
        results.append(("GET /products/", False))
    
    # Test 6: Create test customer
    print("\n6️⃣ Testing Customer Creation...")
    customer_data = {
        "name": f"API Test {random.randint(1000, 9999)}",
        "phone": f"+7777{random.randint(1000000, 9999999)}",
        "email": f"test{random.randint(1000, 9999)}@example.com"
    }
    try:
        response = requests.post(API_URL + "/customers/", json=customer_data)
        if response.status_code in [200, 201]:  # Some APIs return 200 instead of 201
            customer = response.json()
            print(f"✅ Customer created with ID: {customer['id']}")
            results.append(("POST /customers/", True))
            
            # Try to delete the test customer
            delete_response = requests.delete(API_URL + f"/customers/{customer['id']}")
            if delete_response.status_code in [200, 204]:
                print("   🗑️  Test customer deleted")
        else:
            print(f"❌ Failed to create customer: {response.status_code}")
            if response.text:
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Response: {response.text[:200]}")
            results.append(("POST /customers/", False))
    except Exception as e:
        print(f"❌ Error: {e}")
        results.append(("POST /customers/", False))
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for test, success in results:
        status = "✅" if success else "❌"
        print(f"{status} {test}")
    
    print("\n" + "-" * 50)
    print(f"Total: {total} tests")
    print(f"Passed: {passed}")
    print(f"Failed: {total - passed}")
    print(f"Success Rate: {passed/total*100:.0f}%")
    
    if total - passed > 0:
        print("\n⚠️  Some tests failed. Check the Railway logs for more details.")
        print("   Run: railway logs")

if __name__ == "__main__":
    test_api()