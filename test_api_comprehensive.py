#!/usr/bin/env python3
"""
Comprehensive API Testing Script for Cvety.kz
Автоматизированное тестирование всех API endpoints
"""

import requests
import json
import random
import string
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
from colorama import init, Fore, Style
import time

# Initialize colorama for colored output
init()

# Base configuration
BASE_URL = "https://cvety-kz-production.up.railway.app/api"
LOCAL_URL = "http://localhost:8000/api"

# Use Railway URL by default, can be changed to LOCAL_URL for local testing
API_URL = BASE_URL

class APITester:
    def __init__(self):
        self.session = requests.Session()
        self.created_resources = {
            "customers": [],
            "orders": [],
            "warehouse": [],
            "products": []
        }
        self.test_results = []
        
    def print_header(self, text: str):
        """Print colored header"""
        print(f"\n{Fore.CYAN}{'='*60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{text}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'='*60}{Style.RESET_ALL}")
        
    def print_test(self, endpoint: str, method: str, success: bool, message: str = ""):
        """Print test result"""
        status = f"{Fore.GREEN}✓ PASS{Style.RESET_ALL}" if success else f"{Fore.RED}✗ FAIL{Style.RESET_ALL}"
        print(f"{status} {method} {endpoint} {message}")
        self.test_results.append({
            "endpoint": endpoint,
            "method": method,
            "success": success,
            "message": message
        })
        
    def generate_phone(self) -> str:
        """Generate random phone number"""
        return f"+7{random.randint(700, 799)}{random.randint(1000000, 9999999)}"
        
    def generate_email(self) -> str:
        """Generate random email"""
        return f"test_{random.randint(1000, 9999)}@cvety.kz"
        
    # ==================== CUSTOMERS API ====================
    
    def test_customers_api(self) -> Dict:
        """Test all customer endpoints"""
        self.print_header("TESTING CUSTOMERS API")
        
        # Test 1: Create customer
        customer_data = {
            "name": f"Test Customer {random.randint(1000, 9999)}",
            "phone": self.generate_phone(),
            "email": self.generate_email(),
            "notes": "Created by automated test"
        }
        
        try:
            response = self.session.post(f"{API_URL}/customers/", json=customer_data)
            if response.status_code == 201:
                customer = response.json()
                self.created_resources["customers"].append(customer["id"])
                self.print_test("/customers/", "POST", True, f"Created customer ID: {customer['id']}")
                
                # Test 2: Get customer by ID
                response = self.session.get(f"{API_URL}/customers/{customer['id']}")
                self.print_test(f"/customers/{customer['id']}", "GET", response.status_code == 200)
                
                # Test 3: Update customer
                update_data = {"name": "Updated Test Customer", "notes": "Updated by test"}
                response = self.session.put(f"{API_URL}/customers/{customer['id']}", json=update_data)
                self.print_test(f"/customers/{customer['id']}", "PUT", response.status_code == 200)
                
                # Test 4: Add address
                address_data = {
                    "address": "Test Street 123, Almaty",
                    "label": "Home",
                    "is_primary": 1
                }
                response = self.session.post(f"{API_URL}/customers/{customer['id']}/addresses", json=address_data)
                self.print_test(f"/customers/{customer['id']}/addresses", "POST", response.status_code == 201)
                
                # Test 5: Add important date
                date_data = {
                    "date": "03-15",
                    "description": "Birthday",
                    "remind_days_before": 7
                }
                response = self.session.post(f"{API_URL}/customers/{customer['id']}/important-dates", json=date_data)
                self.print_test(f"/customers/{customer['id']}/important-dates", "POST", response.status_code == 201)
                
            else:
                self.print_test("/customers/", "POST", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.print_test("/customers/", "POST", False, str(e))
            
        # Test 6: List customers
        try:
            response = self.session.get(f"{API_URL}/customers/")
            self.print_test("/customers/", "GET", response.status_code == 200)
        except Exception as e:
            self.print_test("/customers/", "GET", False, str(e))
            
        # Test 7: Search customers
        try:
            response = self.session.get(f"{API_URL}/customers/?search=Test")
            self.print_test("/customers/?search=Test", "GET", response.status_code == 200)
        except Exception as e:
            self.print_test("/customers/?search=Test", "GET", False, str(e))
            
    # ==================== ORDERS API ====================
    
    def test_orders_api(self):
        """Test all order endpoints"""
        self.print_header("TESTING ORDERS API")
        
        # First create a customer for orders
        customer_id = None
        if self.created_resources["customers"]:
            customer_id = self.created_resources["customers"][0]
        else:
            # Create new customer
            customer_data = {
                "name": "Order Test Customer",
                "phone": self.generate_phone()
            }
            response = self.session.post(f"{API_URL}/customers/", json=customer_data)
            if response.status_code == 201:
                customer_id = response.json()["id"]
                
        if not customer_id:
            self.print_test("/orders/", "POST", False, "Failed to create customer for order")
            return
            
        # Test 1: Create order
        order_data = {
            "customer_id": customer_id,
            "delivery_method": "delivery",
            "delivery_address": "Test Address 456, Almaty",
            "delivery_date": (datetime.now() + timedelta(days=1)).isoformat(),
            "delivery_window": {
                "from": "10:00",
                "to": "12:00"
            },
            "recipient_name": "Test Recipient",
            "recipient_phone": self.generate_phone(),
            "items": [
                {
                    "product_id": 1,
                    "quantity": 2,
                    "price": 5000
                }
            ],
            "total": 10000,
            "delivery_cost": 1000,
            "payment_method": "kaspi",
            "payment_status": "pending"
        }
        
        try:
            response = self.session.post(f"{API_URL}/orders/", json=order_data)
            if response.status_code == 201:
                order = response.json()
                self.created_resources["orders"].append(order["id"])
                self.print_test("/orders/", "POST", True, f"Created order ID: {order['id']}")
                
                # Test 2: Get order by ID
                response = self.session.get(f"{API_URL}/orders/{order['id']}")
                self.print_test(f"/orders/{order['id']}", "GET", response.status_code == 200)
                
                # Test 3: Update order status
                status_data = {"status": "paid"}
                response = self.session.patch(f"{API_URL}/orders/{order['id']}/status", json=status_data)
                self.print_test(f"/orders/{order['id']}/status", "PATCH", response.status_code == 200)
                
                # Test 4: Add issue
                issue_data = {
                    "issue_type": "wrong_address",
                    "description": "Customer provided incorrect address"
                }
                response = self.session.post(f"{API_URL}/orders/{order['id']}/issue", json=issue_data)
                self.print_test(f"/orders/{order['id']}/issue", "POST", response.status_code == 200)
                
                # Test 5: Resolve issue
                response = self.session.delete(f"{API_URL}/orders/{order['id']}/issue")
                self.print_test(f"/orders/{order['id']}/issue", "DELETE", response.status_code == 200)
                
            else:
                self.print_test("/orders/", "POST", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.print_test("/orders/", "POST", False, str(e))
            
        # Test 6: List orders
        try:
            response = self.session.get(f"{API_URL}/orders/")
            self.print_test("/orders/", "GET", response.status_code == 200)
        except Exception as e:
            self.print_test("/orders/", "GET", False, str(e))
            
        # Test 7: Filter orders by status
        try:
            response = self.session.get(f"{API_URL}/orders/?status=paid")
            self.print_test("/orders/?status=paid", "GET", response.status_code == 200)
        except Exception as e:
            self.print_test("/orders/?status=paid", "GET", False, str(e))
            
    # ==================== TRACKING API ====================
    
    def test_tracking_api(self):
        """Test tracking endpoints"""
        self.print_header("TESTING TRACKING API")
        
        # Use a created order if available
        if self.created_resources["orders"]:
            order_id = self.created_resources["orders"][0]
            # Get order to find tracking token
            try:
                response = self.session.get(f"{API_URL}/orders/{order_id}")
                if response.status_code == 200:
                    order = response.json()
                    tracking_token = order.get("tracking_token")
                    
                    if tracking_token:
                        # Test public tracking endpoint
                        response = requests.get(f"{API_URL}/tracking/{tracking_token}")
                        self.print_test(f"/tracking/{tracking_token}", "GET", response.status_code == 200)
                    else:
                        self.print_test("/tracking/", "GET", False, "No tracking token in order")
                else:
                    self.print_test("/tracking/", "GET", False, "Failed to get order")
            except Exception as e:
                self.print_test("/tracking/", "GET", False, str(e))
        else:
            self.print_test("/tracking/", "GET", False, "No orders created for testing")
            
    # ==================== WAREHOUSE API ====================
    
    def test_warehouse_api(self):
        """Test warehouse endpoints"""
        self.print_header("TESTING WAREHOUSE API")
        
        # Test 1: Create warehouse item
        item_data = {
            "sku": f"TEST-{random.randint(1000, 9999)}",
            "batch": f"BATCH-{random.randint(100, 999)}",
            "product_type": "rose",
            "product_name": "Test Rose",
            "variety": "Red Naomi",
            "color": "Red",
            "stem_length": 70,
            "quantity_initial": 100,
            "quantity_available": 100,
            "quantity_reserved": 0,
            "unit_price": 200,
            "currency": "KZT",
            "supplier": "Test Supplier",
            "farm": "Test Farm",
            "notes": "Test item"
        }
        
        try:
            response = self.session.post(f"{API_URL}/warehouse/", json=item_data)
            if response.status_code == 201:
                item = response.json()
                self.created_resources["warehouse"].append(item["id"])
                self.print_test("/warehouse/", "POST", True, f"Created item ID: {item['id']}")
                
                # Test 2: Get item by ID
                response = self.session.get(f"{API_URL}/warehouse/{item['id']}")
                self.print_test(f"/warehouse/{item['id']}", "GET", response.status_code == 200)
                
                # Test 3: Update item
                update_data = {"quantity_available": 90, "notes": "Updated by test"}
                response = self.session.put(f"{API_URL}/warehouse/{item['id']}", json=update_data)
                self.print_test(f"/warehouse/{item['id']}", "PUT", response.status_code == 200)
                
            else:
                self.print_test("/warehouse/", "POST", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.print_test("/warehouse/", "POST", False, str(e))
            
        # Test 4: List warehouse items
        try:
            response = self.session.get(f"{API_URL}/warehouse/")
            self.print_test("/warehouse/", "GET", response.status_code == 200)
        except Exception as e:
            self.print_test("/warehouse/", "GET", False, str(e))
            
        # Test 5: Filter by product type
        try:
            response = self.session.get(f"{API_URL}/warehouse/?product_type=rose")
            self.print_test("/warehouse/?product_type=rose", "GET", response.status_code == 200)
        except Exception as e:
            self.print_test("/warehouse/?product_type=rose", "GET", False, str(e))
            
        # Test 6: Get deliveries
        try:
            response = self.session.get(f"{API_URL}/warehouse/deliveries")
            self.print_test("/warehouse/deliveries", "GET", response.status_code == 200)
        except Exception as e:
            self.print_test("/warehouse/deliveries", "GET", False, str(e))
            
    # ==================== PRODUCTS API ====================
    
    def test_products_api(self):
        """Test products endpoints"""
        self.print_header("TESTING PRODUCTS API")
        
        # Test 1: Create product
        product_data = {
            "name": f"Test Bouquet {random.randint(1000, 9999)}",
            "category": "bouquet",
            "description": "Beautiful test bouquet",
            "base_price": 15000,
            "sale_price": 12000,
            "is_active": True,
            "is_featured": True,
            "is_new": True,
            "tags": ["test", "roses"]
        }
        
        try:
            response = self.session.post(f"{API_URL}/products/", json=product_data)
            if response.status_code == 201:
                item = response.json()
                self.created_resources["products"] = self.created_resources.get("products", [])
                self.created_resources["products"].append(item["id"])
                self.print_test("/products/", "POST", True, f"Created product ID: {item['id']}")
                
                # Test 2: Get item by ID
                response = self.session.get(f"{API_URL}/products/{item['id']}")
                self.print_test(f"/products/{item['id']}", "GET", response.status_code == 200)
                
                # Test 3: Update item
                update_data = {"sale_price": 11000, "description": "Updated description"}
                response = self.session.put(f"{API_URL}/products/{item['id']}", json=update_data)
                self.print_test(f"/products/{item['id']}", "PUT", response.status_code == 200)
                
            else:
                self.print_test("/products/", "POST", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.print_test("/products/", "POST", False, str(e))
            
        # Test 4: List products
        try:
            response = self.session.get(f"{API_URL}/products/")
            self.print_test("/products/", "GET", response.status_code == 200)
        except Exception as e:
            self.print_test("/products/", "GET", False, str(e))
            
        # Test 5: Filter by category
        try:
            response = self.session.get(f"{API_URL}/products/?category=bouquet")
            self.print_test("/products/?category=bouquet", "GET", response.status_code == 200)
        except Exception as e:
            self.print_test("/products/?category=bouquet", "GET", False, str(e))
            
    # ==================== PRODUCTION API ====================
    
    def test_production_api(self):
        """Test production endpoints"""
        self.print_header("TESTING PRODUCTION API")
        
        endpoints = [
            ("/production/tasks", "GET"),
            ("/production/florists", "GET")
        ]
        
        for endpoint, method in endpoints:
            try:
                response = self.session.request(method, f"{API_URL}{endpoint}")
                self.print_test(endpoint, method, response.status_code == 200)
            except Exception as e:
                self.print_test(endpoint, method, False, str(e))
                
    # ==================== SETTINGS API ====================
    
    def test_settings_api(self):
        """Test settings endpoints"""
        self.print_header("TESTING SETTINGS API")
        
        endpoints = [
            ("/settings/company", "GET"),
            ("/settings/delivery-zones", "GET")
        ]
        
        for endpoint, method in endpoints:
            try:
                response = self.session.request(method, f"{API_URL}{endpoint}")
                self.print_test(endpoint, method, response.status_code == 200)
            except Exception as e:
                self.print_test(endpoint, method, False, str(e))
                
    # ==================== CLEANUP ====================
    
    def cleanup(self):
        """Clean up created test data"""
        self.print_header("CLEANING UP TEST DATA")
        
        # Delete created orders
        for order_id in self.created_resources["orders"]:
            try:
                response = self.session.delete(f"{API_URL}/orders/{order_id}")
                print(f"Deleted order {order_id}: {response.status_code}")
            except:
                pass
                
        # Delete created customers
        for customer_id in self.created_resources["customers"]:
            try:
                response = self.session.delete(f"{API_URL}/customers/{customer_id}")
                print(f"Deleted customer {customer_id}: {response.status_code}")
            except:
                pass
                
        # Delete created warehouse items
        for item_id in self.created_resources["warehouse"]:
            try:
                response = self.session.delete(f"{API_URL}/warehouse/{item_id}")
                print(f"Deleted warehouse item {item_id}: {response.status_code}")
            except:
                pass
                
        # Delete created products
        for item_id in self.created_resources.get("products", []):
            try:
                response = self.session.delete(f"{API_URL}/products/{item_id}")
                print(f"Deleted product {item_id}: {response.status_code}")
            except:
                pass
                
    # ==================== REPORT ====================
    
    def generate_report(self):
        """Generate test report"""
        self.print_header("TEST REPORT")
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t["success"]])
        failed_tests = total_tests - passed_tests
        
        print(f"\nTotal Tests: {total_tests}")
        print(f"{Fore.GREEN}Passed: {passed_tests}{Style.RESET_ALL}")
        print(f"{Fore.RED}Failed: {failed_tests}{Style.RESET_ALL}")
        print(f"Success Rate: {passed_tests/total_tests*100:.1f}%")
        
        if failed_tests > 0:
            print(f"\n{Fore.RED}Failed Tests:{Style.RESET_ALL}")
            for test in self.test_results:
                if not test["success"]:
                    print(f"  - {test['method']} {test['endpoint']} {test['message']}")
                    
        # Save report to file
        report_file = f"test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w') as f:
            json.dump({
                "timestamp": datetime.now().isoformat(),
                "api_url": API_URL,
                "summary": {
                    "total": total_tests,
                    "passed": passed_tests,
                    "failed": failed_tests,
                    "success_rate": f"{passed_tests/total_tests*100:.1f}%"
                },
                "results": self.test_results
            }, f, indent=2)
        print(f"\nDetailed report saved to: {report_file}")
        
    # ==================== MAIN ====================
    
    def run_all_tests(self):
        """Run all API tests"""
        print(f"{Fore.YELLOW}Starting Comprehensive API Testing{Style.RESET_ALL}")
        print(f"API URL: {API_URL}")
        print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Check API availability
        try:
            response = requests.get(f"{API_URL}/health/db")
            if response.status_code == 200:
                print(f"{Fore.GREEN}API is accessible{Style.RESET_ALL}")
            else:
                print(f"{Fore.YELLOW}API returned status: {response.status_code}, continuing...{Style.RESET_ALL}")
        except Exception as e:
            print(f"{Fore.RED}Cannot connect to API: {e}{Style.RESET_ALL}")
            return
            
        # Run all test suites
        self.test_customers_api()
        time.sleep(0.5)  # Small delay between test suites
        
        self.test_orders_api()
        time.sleep(0.5)
        
        self.test_tracking_api()
        time.sleep(0.5)
        
        self.test_warehouse_api()
        time.sleep(0.5)
        
        self.test_products_api()
        time.sleep(0.5)
        
        self.test_production_api()
        time.sleep(0.5)
        
        self.test_settings_api()
        
        # Clean up test data
        self.cleanup()
        
        # Generate report
        self.generate_report()


if __name__ == "__main__":
    import sys
    
    # Check command line arguments
    if len(sys.argv) > 1:
        if sys.argv[1] == "--local":
            API_URL = LOCAL_URL
            print(f"Using local API: {API_URL}")
        elif sys.argv[1] == "--help":
            print("Usage: python test_api_comprehensive.py [--local]")
            print("  --local  Test against local API (http://localhost:8000)")
            print("  Default: Test against Railway production API")
            sys.exit(0)
            
    # Run tests
    tester = APITester()
    tester.run_all_tests()