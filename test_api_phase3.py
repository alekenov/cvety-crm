#!/usr/bin/env python3
"""
API Test Script - Phase 3 verification
Tests all endpoints after fixing status codes
"""

import requests
import json
from datetime import datetime, timedelta
import random
import sys

API_URL = "https://cvety-kz-production.up.railway.app/api"

def test_endpoint(method, endpoint, data=None, expected_status=None):
    """Test a single endpoint"""
    url = f"{API_URL}{endpoint}"
    
    try:
        if method == "GET":
            response = requests.get(url)
        elif method == "POST":
            response = requests.post(url, json=data)
        elif method == "PATCH":
            response = requests.patch(url, json=data)
        elif method == "PUT":
            response = requests.put(url, json=data)
        elif method == "DELETE":
            response = requests.delete(url)
        else:
            return False, f"Unknown method: {method}"
        
        # Check expected status
        if expected_status and response.status_code != expected_status:
            return False, f"Expected {expected_status}, got {response.status_code}"
        
        # For successful responses, return the data
        if response.status_code in [200, 201]:
            return True, response.json()
        elif response.status_code == 204:
            return True, None
        else:
            return False, f"Status: {response.status_code}, Response: {response.text[:200]}"
            
    except Exception as e:
        return False, str(e)

def run_tests():
    """Run comprehensive API tests"""
    results = []
    test_data = {}
    
    print("🧪 Running API Tests - Phase 3 Verification")
    print("=" * 50)
    
    # Test 1: Create customer (should return 201)
    print("1. Testing customer creation...")
    success, data = test_endpoint("POST", "/customers/", {
        "name": f"Test Customer {random.randint(1000, 9999)}",
        "phone": f"+7700{random.randint(1000000, 9999999)}"
    }, expected_status=201)
    results.append(("POST /customers/", success, data if not success else "✓"))
    if success:
        test_data['customer_id'] = data['id']
    
    # Test 2: Get customers
    print("2. Testing customer list...")
    success, data = test_endpoint("GET", "/customers/", expected_status=200)
    results.append(("GET /customers/", success, "✓" if success else data))
    
    # Test 3: Create order (should return 201)
    print("3. Testing order creation...")
    if 'customer_id' in test_data:
        success, data = test_endpoint("POST", "/orders/", {
            "customer_id": test_data['customer_id'],
            "customer_name": "Test Customer",
            "customer_phone": "+77001234567",
            "delivery_address": "Test Address",
            "delivery_type": "delivery",
            "delivery_window": {
                "from": datetime.now().isoformat(),
                "to": (datetime.now() + timedelta(hours=2)).isoformat()
            },
            "flower_sum": 10000,
            "delivery_fee": 1000,
            "total": 11000,
            "products": "Test bouquet"
        }, expected_status=201)
        results.append(("POST /orders/", success, data if not success else "✓"))
        if success:
            test_data['order_id'] = data['id']
            test_data['tracking_token'] = data.get('tracking_token')
    
    # Test 4: Get orders
    print("4. Testing order list...")
    success, data = test_endpoint("GET", "/orders/", expected_status=200)
    results.append(("GET /orders/", success, "✓" if success else data))
    
    # Test 5: Test tracking
    print("5. Testing order tracking...")
    if 'tracking_token' in test_data:
        success, data = test_endpoint("GET", f"/tracking/{test_data['tracking_token']}", expected_status=200)
        results.append(("GET /tracking/{token}", success, "✓" if success else data))
    
    # Test 6: Create warehouse item (should return 201)
    print("6. Testing warehouse item creation...")
    success, data = test_endpoint("POST", "/warehouse/", {
        "sku": f"TEST-{random.randint(1000, 9999)}",
        "batch_code": f"BATCH-{datetime.now().strftime('%Y%m%d')}",
        "variety": "Freedom",
        "height_cm": 50,
        "farm": "Test Farm",
        "supplier": "Test Supplier",
        "delivery_date": datetime.now().isoformat(),
        "currency": "USD",
        "rate": 450,
        "cost": 0.5,
        "markup_pct": 100,
        "qty": 100
    }, expected_status=201)
    results.append(("POST /warehouse/", success, data if not success else "✓"))
    
    # Test 7: Get warehouse items
    print("7. Testing warehouse list...")
    success, data = test_endpoint("GET", "/warehouse/", expected_status=200)
    results.append(("GET /warehouse/", success, "✓" if success else data))
    
    # Test 8: Create product (should return 201)
    print("8. Testing product creation...")
    success, data = test_endpoint("POST", "/products/", {
        "name": f"Test Product {random.randint(1000, 9999)}",
        "category": "bouquet",
        "cost_price": 500,
        "retail_price": 1000,
        "description": "Test product"
    }, expected_status=201)
    results.append(("POST /products/", success, data if not success else "✓"))
    
    # Test 9: Get products
    print("9. Testing product list...")
    success, data = test_endpoint("GET", "/products/", expected_status=200)
    results.append(("GET /products/", success, "✓" if success else data))
    
    # Test 10: Test production endpoints
    print("10. Testing production endpoints...")
    success, data = test_endpoint("GET", "/production/tasks/", expected_status=200)
    results.append(("GET /production/tasks/", success, "✓" if success else data))
    
    # Test 11: Test settings endpoint
    print("11. Testing settings endpoints...")
    success, data = test_endpoint("GET", "/settings/", expected_status=200)
    results.append(("GET /settings/", success, "✓" if success else data))
    
    # Print results
    print("\n" + "=" * 50)
    print("📊 TEST RESULTS")
    print("=" * 50)
    
    passed = 0
    failed = 0
    
    for endpoint, success, message in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {endpoint}")
        if not success:
            print(f"     → {message}")
        if success:
            passed += 1
        else:
            failed += 1
    
    print("\n" + "=" * 50)
    print(f"Total: {len(results)} | Passed: {passed} | Failed: {failed}")
    print(f"Success Rate: {(passed/len(results)*100):.1f}%")
    
    return passed == len(results)

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)