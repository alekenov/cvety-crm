#!/usr/bin/env python3
"""
Final comprehensive API test
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
        if expected_status:
            if response.status_code != expected_status:
                return False, f"Expected {expected_status}, got {response.status_code}"
        
        # For successful responses, return the data
        if response.status_code in [200, 201]:
            return True, response.json()
        elif response.status_code == 204:
            return True, None
        else:
            return False, f"Status: {response.status_code}"
            
    except Exception as e:
        return False, str(e)

def run_final_tests():
    """Run final comprehensive tests"""
    results = []
    
    print("🏁 FINAL API TESTING")
    print("=" * 60)
    
    # Customer endpoints
    print("\n📋 CUSTOMER ENDPOINTS")
    success, _ = test_endpoint("POST", "/customers/", {
        "name": f"Final Test {random.randint(1000, 9999)}",
        "phone": f"+7777{random.randint(1000000, 9999999)}"
    }, expected_status=201)
    results.append(("POST /customers/", success))
    
    success, _ = test_endpoint("GET", "/customers/", expected_status=200)
    results.append(("GET /customers/", success))
    
    success, _ = test_endpoint("GET", "/customers/?search=Test", expected_status=200)
    results.append(("GET /customers/?search=Test", success))
    
    # Order endpoints
    print("\n📦 ORDER ENDPOINTS")
    success, _ = test_endpoint("POST", "/orders/", {
        "customer_phone": "+77771234567",
        "delivery_method": "delivery",
        "address": "Test Address, Almaty",
        "delivery_window": {
            "from_time": "2025-07-30T14:00:00",
            "to_time": "2025-07-30T16:00:00"
        },
        "flower_sum": 15000,
        "delivery_fee": 1500,
        "total": 16500
    }, expected_status=201)
    results.append(("POST /orders/", success))
    
    success, _ = test_endpoint("GET", "/orders/", expected_status=200)
    results.append(("GET /orders/", success))
    
    # Warehouse endpoints
    print("\n📦 WAREHOUSE ENDPOINTS")
    success, _ = test_endpoint("POST", "/warehouse/", {
        "sku": f"FINAL-{random.randint(1000, 9999)}",
        "batch_code": f"BATCH-FINAL-{datetime.now().strftime('%Y%m%d')}",
        "variety": "Premium Rose",
        "height_cm": 60,
        "farm": "Final Test Farm",
        "supplier": "Final Test Supplier",
        "delivery_date": datetime.now().isoformat(),
        "currency": "USD",
        "rate": 480,
        "cost": 0.75,
        "markup_pct": 150,
        "qty": 200
    }, expected_status=201)
    results.append(("POST /warehouse/", success))
    
    success, _ = test_endpoint("GET", "/warehouse/", expected_status=200)
    results.append(("GET /warehouse/", success))
    
    success, _ = test_endpoint("GET", "/warehouse/deliveries", expected_status=200)
    results.append(("GET /warehouse/deliveries", success))
    
    # Product endpoints
    print("\n🌸 PRODUCT ENDPOINTS")
    success, _ = test_endpoint("POST", "/products/", {
        "name": f"Final Product {random.randint(1000, 9999)}",
        "category": "bouquet",
        "cost_price": 1000,
        "retail_price": 2500,
        "description": "Final test product"
    }, expected_status=201)
    results.append(("POST /products/", success))
    
    success, _ = test_endpoint("GET", "/products/", expected_status=200)
    results.append(("GET /products/", success))
    
    success, _ = test_endpoint("GET", "/products/?category=bouquet", expected_status=200)
    results.append(("GET /products/?category=bouquet", success))
    
    # Production endpoints
    print("\n🏭 PRODUCTION ENDPOINTS")
    success, _ = test_endpoint("GET", "/production/tasks/", expected_status=200)
    results.append(("GET /production/tasks/", success))
    
    success, _ = test_endpoint("GET", "/production/florists", expected_status=200)
    results.append(("GET /production/florists", success))
    
    # Settings endpoints
    print("\n⚙️ SETTINGS ENDPOINTS")
    success, _ = test_endpoint("GET", "/settings/", expected_status=200)
    results.append(("GET /settings/", success))
    
    success, _ = test_endpoint("GET", "/settings/delivery-zones", expected_status=200)
    results.append(("GET /settings/delivery-zones", success))
    
    # Print results
    print("\n" + "=" * 60)
    print("📊 FINAL TEST RESULTS")
    print("=" * 60)
    
    passed = sum(1 for _, success in results if success)
    failed = len(results) - passed
    
    for endpoint, success in results:
        status = "✅" if success else "❌"
        print(f"{status} {endpoint}")
    
    print("\n" + "=" * 60)
    print(f"Total: {len(results)} | Passed: {passed} | Failed: {failed}")
    print(f"Success Rate: {(passed/len(results)*100):.1f}%")
    
    if passed == len(results):
        print("\n🎉 ALL TESTS PASSED! API is production ready!")
    else:
        print(f"\n⚠️  {failed} tests failed. Please review.")
    
    return passed == len(results)

if __name__ == "__main__":
    success = run_final_tests()
    sys.exit(0 if success else 1)