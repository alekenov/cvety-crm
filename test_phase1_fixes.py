#!/usr/bin/env python3
"""
Test script for Phase 1 fixes
"""
import requests
import json
import sys

BASE_URL = "http://localhost:8001/api"

def test_products_api():
    """Test products API returns correct format"""
    print("\n1. Testing Products API...")
    
    response = requests.get(f"{BASE_URL}/products/")
    
    if response.status_code == 200:
        data = response.json()
        if isinstance(data, dict) and 'items' in data and 'total' in data:
            print("   ✅ Products API returns correct format")
            print(f"   Found {len(data['items'])} products, total: {data['total']}")
            return True
        else:
            print("   ❌ Products API returns wrong format (array instead of {items, total})")
            print(f"   Got: {type(data)}")
            return False
    else:
        print(f"   ❌ Products API returned {response.status_code}")
        return False

def test_production_tasks_api():
    """Test production tasks API"""
    print("\n2. Testing Production Tasks API...")
    
    # Test with trailing slash (required)
    response = requests.get(f"{BASE_URL}/production/tasks/")
    
    if response.status_code == 200:
        data = response.json()
        if isinstance(data, dict) and 'items' in data and 'total' in data:
            print("   ✅ Production tasks API works")
            print(f"   Found {len(data['items'])} tasks, total: {data['total']}")
            return True
        else:
            print("   ❌ Production tasks API returns wrong format")
            return False
    else:
        print(f"   ❌ Production tasks API returned {response.status_code}")
        return False

def test_customer_addresses():
    """Test customer address saving"""
    print("\n3. Testing Customer Address Saving...")
    
    # First get a customer
    response = requests.get(f"{BASE_URL}/customers/")
    if response.status_code != 200:
        print("   ❌ Could not get customers")
        return False
    
    customers = response.json()
    if not customers['items']:
        print("   ❌ No customers found for testing")
        return False
    
    customer_id = customers['items'][0]['id']
    print(f"   Testing with customer ID: {customer_id}")
    
    # Update customer with addresses
    update_data = {
        "name": "Test Customer with Addresses",
        "addresses": [
            {
                "address": "ул. Тестовая 123",
                "label": "Дом",
                "is_primary": True
            },
            {
                "address": "пр. Рабочий 456",
                "label": "Офис",
                "is_primary": False
            }
        ],
        "important_dates": [
            {
                "date": "12-25",
                "description": "Новый год",
                "remind_days_before": 5
            }
        ]
    }
    
    response = requests.put(
        f"{BASE_URL}/customers/{customer_id}",
        json=update_data
    )
    
    if response.status_code == 200:
        data = response.json()
        if len(data['addresses']) == 2 and len(data['important_dates']) == 1:
            print("   ✅ Customer addresses and dates saved successfully")
            print(f"   Addresses: {len(data['addresses'])}, Important dates: {len(data['important_dates'])}")
            return True
        else:
            print("   ❌ Customer addresses/dates not saved properly")
            print(f"   Addresses: {len(data['addresses'])}, Important dates: {len(data['important_dates'])}")
            return False
    else:
        print(f"   ❌ Customer update returned {response.status_code}")
        print(f"   Error: {response.text}")
        return False

def main():
    print("Testing Phase 1 Fixes")
    print("=" * 50)
    
    results = []
    
    # Test 1: Products API
    results.append(test_products_api())
    
    # Test 2: Production Tasks API
    results.append(test_production_tasks_api())
    
    # Test 3: Customer Addresses
    results.append(test_customer_addresses())
    
    # Summary
    print("\n" + "=" * 50)
    print("Summary:")
    passed = sum(results)
    total = len(results)
    
    if passed == total:
        print(f"✅ All {total} tests passed!")
        return 0
    else:
        print(f"❌ {passed}/{total} tests passed, {total-passed} failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())