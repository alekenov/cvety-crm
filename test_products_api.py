#!/usr/bin/env python3
"""Test Products API to check for 500 errors"""

import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_products_api():
    print("Testing Products API...")
    
    # Test 1: Get all products
    print("\n1. GET /products/")
    try:
        response = requests.get(f"{BASE_URL}/products/")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success! Found {data['total']} products")
            print(f"Items count: {len(data['items'])}")
        else:
            print(f"❌ Error: {response.text}")
    except Exception as e:
        print(f"❌ Exception: {e}")
    
    # Test 2: Get products with filters
    print("\n2. GET /products/ with filters")
    params = {
        "category": "bouquet",
        "is_popular": True,
        "min_price": 1000,
        "max_price": 10000
    }
    try:
        response = requests.get(f"{BASE_URL}/products/", params=params)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success! Found {data['total']} products with filters")
        else:
            print(f"❌ Error: {response.text}")
    except Exception as e:
        print(f"❌ Exception: {e}")
    
    # Test 3: Get single product
    print("\n3. GET /products/1")
    try:
        response = requests.get(f"{BASE_URL}/products/1")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            product = response.json()
            print(f"✅ Success! Product: {product['name']}")
        else:
            print(f"❌ Error: {response.text}")
    except Exception as e:
        print(f"❌ Exception: {e}")
    
    # Test 4: Create product
    print("\n4. POST /products/")
    new_product = {
        "name": "Тестовый букет",
        "category": "bouquet",
        "description": "Тестовое описание",
        "cost_price": 2000,
        "retail_price": 4000,
        "sale_price": None,
        "is_active": True,
        "is_popular": False,
        "is_new": True
    }
    try:
        response = requests.post(f"{BASE_URL}/products/", json=new_product)
        print(f"Status: {response.status_code}")
        if response.status_code == 201:
            product = response.json()
            print(f"✅ Success! Created product ID: {product['id']}")
            
            # Clean up - delete the test product
            delete_response = requests.delete(f"{BASE_URL}/products/{product['id']}")
            if delete_response.status_code == 200:
                print("✅ Test product deleted")
        else:
            print(f"❌ Error: {response.text}")
    except Exception as e:
        print(f"❌ Exception: {e}")
    
    print("\n" + "="*50)
    print("Products API test completed!")

if __name__ == "__main__":
    test_products_api()