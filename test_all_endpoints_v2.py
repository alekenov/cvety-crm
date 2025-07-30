#!/usr/bin/env python3
"""
Test all backend endpoints - v2
"""

import requests
import json
from datetime import datetime, timedelta
import sys

BASE_URL = "http://localhost:8000/api"

# Цвета для вывода
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def test_endpoint(method, endpoint, data=None, params=None, expected_status=None):
    """Test a single endpoint"""
    url = f"{BASE_URL}{endpoint}"
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{YELLOW}{method} {endpoint}{RESET}")
    print(f"{BLUE}{'='*60}{RESET}")
    
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
        
        status_color = GREEN if response.status_code in [200, 201] else RED
        print(f"Status: {status_color}{response.status_code}{RESET}")
        
        if expected_status and response.status_code != expected_status:
            print(f"{RED}Expected status: {expected_status}{RESET}")
        
        try:
            response_data = response.json()
            print(f"Response: {json.dumps(response_data, indent=2, ensure_ascii=False)[:500]}...")
        except:
            print(f"Response: {response.text[:500]}...")
            
        return response
    except Exception as e:
        print(f"{RED}Error: {str(e)}{RESET}")
        return None

def test_orders():
    """Test Orders endpoints"""
    print(f"\n\n{YELLOW}{'='*80}{RESET}")
    print(f"{YELLOW}TESTING ORDERS ENDPOINTS{RESET}")
    print(f"{YELLOW}{'='*80}{RESET}")
    
    # Get all orders
    test_endpoint("GET", "/orders/")
    
    # Create new order - using correct schema
    order_data = {
        "customer_phone": "+77001234567",
        "recipient_phone": "+77001234567",
        "recipient_name": "Test Recipient",
        "address": "Test Address",
        "delivery_method": "delivery",
        "flower_sum": 15000,
        "delivery_fee": 1500,
        "total": 16500,  # Changed from total_amount
        "delivery_window": {
            "from_time": (datetime.now() + timedelta(days=1)).replace(hour=10, minute=0).isoformat(),
            "to_time": (datetime.now() + timedelta(days=1)).replace(hour=12, minute=0).isoformat()
        }
    }
    response = test_endpoint("POST", "/orders/", data=order_data)
    
    if response and response.status_code == 200:
        order_id = response.json()["id"]
        
        # Get single order
        test_endpoint("GET", f"/orders/{order_id}")
        
        # Update order status
        test_endpoint("PATCH", f"/orders/{order_id}/status", data={"status": "paid"})
        
        # Add issue - correct field name
        test_endpoint("PATCH", f"/orders/{order_id}/issue", data={
            "issue_type": "wrong_address",
            "comment": "Test issue"  # Changed from issue_comment
        })

def test_products():
    """Test Products endpoints"""
    print(f"\n\n{YELLOW}{'='*80}{RESET}")
    print(f"{YELLOW}TESTING PRODUCTS ENDPOINTS{RESET}")
    print(f"{YELLOW}{'='*80}{RESET}")
    
    # Get all products
    test_endpoint("GET", "/products/")
    
    # Create new product - using correct schema
    product_data = {
        "name": "Test Bouquet",
        "description": "Test description",
        "category": "bouquet",
        "cost_price": 5000,  # Changed from base_price
        "retail_price": 10000,  # Added required field
        "is_active": True,
        "is_popular": False,
        "is_new": False
    }
    response = test_endpoint("POST", "/products/", data=product_data)
    
    if response and response.status_code == 200:
        product_id = response.json()["id"]
        
        # Get single product
        test_endpoint("GET", f"/products/{product_id}")
        
        # Update product
        test_endpoint("PUT", f"/products/{product_id}", data={**product_data, "retail_price": 12000})
        
        # Toggle active status
        test_endpoint("POST", f"/products/{product_id}/toggle-active")
        
        # Delete product
        test_endpoint("DELETE", f"/products/{product_id}")

def test_customers():
    """Test Customers endpoints"""
    print(f"\n\n{YELLOW}{'='*80}{RESET}")
    print(f"{YELLOW}TESTING CUSTOMERS ENDPOINTS{RESET}")
    print(f"{YELLOW}{'='*80}{RESET}")
    
    # Get all customers
    test_endpoint("GET", "/customers/")
    
    # Create new customer
    customer_data = {
        "name": "Test Customer",
        "phone": "+77001234567",
        "email": "test@example.com",
        "address": "Test Address"
    }
    response = test_endpoint("POST", "/customers/", data=customer_data)
    
    if response and response.status_code == 200:
        customer_id = response.json()["id"]
        
        # Get single customer
        test_endpoint("GET", f"/customers/{customer_id}")
        
        # Update customer
        test_endpoint("PUT", f"/customers/{customer_id}", data={**customer_data, "name": "Updated Name"})
        
        # Get customer orders
        test_endpoint("GET", f"/customers/{customer_id}/orders")
        
        # Add address
        test_endpoint("POST", f"/customers/{customer_id}/addresses", data={
            "address": "New Address",
            "is_primary": True
        })
        
        # Add important date
        test_endpoint("POST", f"/customers/{customer_id}/important-dates", data={
            "date_type": "birthday",
            "date": "1990-01-01",
            "description": "День рождения"
        })

def test_warehouse():
    """Test Warehouse endpoints"""
    print(f"\n\n{YELLOW}{'='*80}{RESET}")
    print(f"{YELLOW}TESTING WAREHOUSE ENDPOINTS{RESET}")
    print(f"{YELLOW}{'='*80}{RESET}")
    
    # Get all items
    test_endpoint("GET", "/warehouse/")
    
    # Get stats
    test_endpoint("GET", "/warehouse/stats")
    
    # Create new item - using correct schema
    item_data = {
        "sku": "TEST-001",
        "batch_code": "B2024-001",
        "variety": "Роза Тест",
        "height_cm": 50,
        "farm": "Test Farm",
        "supplier": "Test Supplier",
        "delivery_date": datetime.now().isoformat(),
        "currency": "USD",
        "rate": 470.0,
        "cost": 1.5,
        "markup_pct": 100.0,
        "qty": 100,
        "price": 1500
    }
    response = test_endpoint("POST", "/warehouse/", data=item_data)
    
    if response and response.status_code == 200:
        item_id = response.json()["id"]
        
        # Get single item
        test_endpoint("GET", f"/warehouse/{item_id}")
        
        # Update item
        test_endpoint("PATCH", f"/warehouse/{item_id}", data={"quantity": 150})
        
    # Create delivery - using correct schema
    delivery_data = {
        "supplier": "Test Supplier",
        "farm": "Test Farm",
        "delivery_date": datetime.now().isoformat(),
        "currency": "USD",
        "rate": 470.0,
        "comment": "Test delivery",
        "positions": [
            {
                "variety": "Роза",
                "height_cm": 50,
                "qty": 100,
                "cost_per_stem": 1.5
            }
        ]
    }
    test_endpoint("POST", "/warehouse/deliveries", data=delivery_data)
    
    # Get deliveries
    test_endpoint("GET", "/warehouse/deliveries")

def test_production():
    """Test Production endpoints"""
    print(f"\n\n{YELLOW}{'='*80}{RESET}")
    print(f"{YELLOW}TESTING PRODUCTION ENDPOINTS{RESET}")
    print(f"{YELLOW}{'='*80}{RESET}")
    
    # Get all tasks
    test_endpoint("GET", "/production/tasks/")
    
    # Get pending tasks
    test_endpoint("GET", "/production/tasks/pending")
    
    # Get overdue tasks
    test_endpoint("GET", "/production/tasks/overdue")
    
    # Create new task - using correct schema
    task_data = {
        "order_id": 1,
        "task_type": "bouquet",
        "priority": "high",
        "estimated_minutes": 30,
        "deadline": (datetime.now() + timedelta(hours=4)).isoformat(),
        "items": [
            {
                "product_name": "Rose Bouquet",
                "quantity": 1,
                "special_requests": "Extra care with packaging"
            }
        ]
    }
    response = test_endpoint("POST", "/production/tasks/", data=task_data)
    
    if response and response.status_code == 200:
        task_id = response.json()["id"]
        
        # Get single task
        test_endpoint("GET", f"/production/tasks/{task_id}")
        
        # Assign task
        test_endpoint("POST", f"/production/tasks/{task_id}/assign", data={"florist_id": "Florist 2"})
        
        # Start task
        test_endpoint("POST", f"/production/tasks/{task_id}/start")
        
        # Complete task
        test_endpoint("POST", f"/production/tasks/{task_id}/complete")
        
    # Queue stats
    test_endpoint("GET", "/production/queue/stats")
    
    # Workload
    test_endpoint("GET", "/production/queue/workload")

def test_tracking():
    """Test Tracking endpoints"""
    print(f"\n\n{YELLOW}{'='*80}{RESET}")
    print(f"{YELLOW}TESTING TRACKING ENDPOINTS{RESET}")
    print(f"{YELLOW}{'='*80}{RESET}")
    
    # Test with a sample tracking token
    test_endpoint("GET", "/tracking/TRK-123456", expected_status=404)
    
    # Test with real token from orders
    response = requests.get(f"{BASE_URL}/orders/")
    if response.status_code == 200:
        orders = response.json()["items"]
        if orders:
            token = orders[0]["tracking_token"]
            test_endpoint("GET", f"/tracking/{token}")

def test_settings():
    """Test Settings endpoints"""
    print(f"\n\n{YELLOW}{'='*80}{RESET}")
    print(f"{YELLOW}TESTING SETTINGS ENDPOINTS{RESET}")
    print(f"{YELLOW}{'='*80}{RESET}")
    
    # Get settings
    test_endpoint("GET", "/settings/")
    
    # Update settings - using correct schema
    settings_data = {
        "name": "Cvety.kz Test",
        "address": "Test Address",
        "phones": ["+77001234567", "+77007654321"],
        "email": "test@cvety.kz",
        "delivery_zones": [
            {"name": "Almaty", "price": 2000},
            {"name": "Astana", "price": 3000}
        ],
        "working_hours": {
            "from": "09:00",  # Changed from start
            "to": "20:00"     # Changed from end
        }
    }
    test_endpoint("PATCH", "/settings/", data=settings_data)

def test_init_data():
    """Test Init Data endpoint"""
    print(f"\n\n{YELLOW}{'='*80}{RESET}")
    print(f"{YELLOW}TESTING INIT DATA ENDPOINT{RESET}")
    print(f"{YELLOW}{'='*80}{RESET}")
    
    test_endpoint("POST", "/init/initialize")
    test_endpoint("GET", "/init/status")

def check_server():
    """Check if server is running"""
    try:
        response = requests.get(f"{BASE_URL}/../docs")
        return response.status_code == 200
    except:
        return False

if __name__ == "__main__":
    print(f"{YELLOW}Testing all backend endpoints...{RESET}")
    
    if not check_server():
        print(f"{RED}Server is not running on {BASE_URL}{RESET}")
        sys.exit(1)
    
    print(f"{GREEN}Server is running!{RESET}")
    
    # Initialize data first
    # test_init_data()
    
    # Test all endpoints
    test_orders()
    test_products()
    test_customers()
    test_warehouse()
    test_production()
    test_tracking()
    test_settings()
    
    print(f"\n\n{GREEN}All tests completed!{RESET}")