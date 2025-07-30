#!/usr/bin/env python3
"""
Test all backend endpoints
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000/api"

def test_endpoint(method, endpoint, data=None, params=None):
    """Test a single endpoint"""
    url = f"{BASE_URL}{endpoint}"
    print(f"\n{'='*60}")
    print(f"{method} {endpoint}")
    print(f"{'='*60}")
    
    try:
        if method == "GET":
            response = requests.get(url, params=params)
        elif method == "POST":
            response = requests.post(url, json=data)
        elif method == "PUT":
            response = requests.put(url, json=data)
        elif method == "PATCH":
            response = requests.patch(url, json=data)
        elif method == "DELETE":
            response = requests.delete(url)
        
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response
    except Exception as e:
        print(f"Error: {str(e)}")
        return None

def test_orders():
    """Test Orders endpoints"""
    print("\n\n" + "="*80)
    print("TESTING ORDERS ENDPOINTS")
    print("="*80)
    
    # Get all orders
    test_endpoint("GET", "/orders")
    
    # Create new order
    order_data = {
        "customer_id": 1,
        "total_amount": 15000,
        "status": "new",
        "delivery_method": "delivery",
        "address": "Test Address",
        "phone": "+77001234567",
        "recipient_name": "Test Recipient",
        "delivery_date": datetime.now().isoformat(),
        "delivery_time": "10:00-12:00",
        "order_items": [
            {
                "product_id": 1,
                "quantity": 2,
                "price": 5000
            }
        ]
    }
    response = test_endpoint("POST", "/orders", data=order_data)
    
    if response and response.status_code == 200:
        order_id = response.json()["id"]
        
        # Get single order
        test_endpoint("GET", f"/orders/{order_id}")
        
        # Update order status
        test_endpoint("PATCH", f"/orders/{order_id}/status", data={"status": "paid"})
        
        # Add issue
        test_endpoint("POST", f"/orders/{order_id}/issue", data={"reason": "Test issue"})

def test_products():
    """Test Products endpoints"""
    print("\n\n" + "="*80)
    print("TESTING PRODUCTS ENDPOINTS")
    print("="*80)
    
    # Get all products
    test_endpoint("GET", "/products")
    
    # Create new product
    product_data = {
        "name": "Test Bouquet",
        "description": "Test description",
        "base_price": 10000,
        "category": "bouquet",
        "is_active": True
    }
    response = test_endpoint("POST", "/products", data=product_data)
    
    if response and response.status_code == 200:
        product_id = response.json()["id"]
        
        # Get single product
        test_endpoint("GET", f"/products/{product_id}")
        
        # Update product
        test_endpoint("PUT", f"/products/{product_id}", data={**product_data, "base_price": 12000})
        
        # Delete product
        test_endpoint("DELETE", f"/products/{product_id}")

def test_customers():
    """Test Customers endpoints"""
    print("\n\n" + "="*80)
    print("TESTING CUSTOMERS ENDPOINTS")
    print("="*80)
    
    # Get all customers
    test_endpoint("GET", "/customers")
    
    # Create new customer
    customer_data = {
        "name": "Test Customer",
        "phone": "+77001234567",
        "email": "test@example.com",
        "address": "Test Address"
    }
    response = test_endpoint("POST", "/customers", data=customer_data)
    
    if response and response.status_code == 200:
        customer_id = response.json()["id"]
        
        # Get single customer
        test_endpoint("GET", f"/customers/{customer_id}")
        
        # Update customer
        test_endpoint("PUT", f"/customers/{customer_id}", data={**customer_data, "name": "Updated Name"})
        
        # Get customer orders
        test_endpoint("GET", f"/customers/{customer_id}/orders")

def test_warehouse():
    """Test Warehouse endpoints"""
    print("\n\n" + "="*80)
    print("TESTING WAREHOUSE ENDPOINTS")
    print("="*80)
    
    # Get all items
    test_endpoint("GET", "/warehouse")
    
    # Create new item
    item_data = {
        "name": "Test Item",
        "quantity": 100,
        "unit": "шт",
        "purchase_price": 100,
        "purchase_currency": "USD",
        "supplier": "Test Supplier"
    }
    response = test_endpoint("POST", "/warehouse", data=item_data)
    
    if response and response.status_code == 200:
        item_id = response.json()["id"]
        
        # Get single item
        test_endpoint("GET", f"/warehouse/{item_id}")
        
        # Update quantity
        test_endpoint("PATCH", f"/warehouse/{item_id}/quantity", data={"quantity": 150})

def test_production():
    """Test Production endpoints"""
    print("\n\n" + "="*80)
    print("TESTING PRODUCTION ENDPOINTS")
    print("="*80)
    
    # Get all tasks
    test_endpoint("GET", "/production/tasks")
    
    # Create new task
    task_data = {
        "order_id": 1,
        "assigned_to": "Florist 1",
        "status": "pending",
        "priority": "high",
        "task_items": [
            {
                "product_name": "Rose Bouquet",
                "quantity": 1,
                "notes": "Extra care"
            }
        ]
    }
    response = test_endpoint("POST", "/production/tasks", data=task_data)
    
    if response and response.status_code == 200:
        task_id = response.json()["id"]
        
        # Get single task
        test_endpoint("GET", f"/production/tasks/{task_id}")
        
        # Update task status
        test_endpoint("PATCH", f"/production/tasks/{task_id}/status", data={"status": "in_progress"})
        
        # Complete task
        test_endpoint("POST", f"/production/tasks/{task_id}/complete")

def test_tracking():
    """Test Tracking endpoints"""
    print("\n\n" + "="*80)
    print("TESTING TRACKING ENDPOINTS")
    print("="*80)
    
    # Test with a sample tracking token
    test_endpoint("GET", "/tracking/TRK-123456")

def test_settings():
    """Test Settings endpoints"""
    print("\n\n" + "="*80)
    print("TESTING SETTINGS ENDPOINTS")
    print("="*80)
    
    # Get settings
    test_endpoint("GET", "/settings")
    
    # Update settings
    settings_data = {
        "company_name": "Cvety.kz Test",
        "address": "Test Address",
        "phone": "+77001234567",
        "email": "test@cvety.kz",
        "delivery_zones": ["Almaty", "Astana"],
        "working_hours": {
            "start": "09:00",
            "end": "20:00"
        }
    }
    test_endpoint("PUT", "/settings", data=settings_data)

def test_init_data():
    """Test Init Data endpoint"""
    print("\n\n" + "="*80)
    print("TESTING INIT DATA ENDPOINT")
    print("="*80)
    
    test_endpoint("POST", "/init")

if __name__ == "__main__":
    print("Testing all backend endpoints...")
    
    # Initialize data first
    test_init_data()
    
    # Test all endpoints
    test_orders()
    test_products()
    test_customers()
    test_warehouse()
    test_production()
    test_tracking()
    test_settings()
    
    print("\n\nAll tests completed!")