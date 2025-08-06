"""
Cvety.kz API Python Client
Full-featured client for interacting with Cvety.kz API

Installation:
    pip install requests python-dotenv

Usage:
    from client import CvetyKzAPI
    
    api = CvetyKzAPI()
    api.authenticate("+77011234567", "123456")
    orders = api.get_orders(status="paid")
"""

import os
import time
import requests
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()


class CvetyKzAPI:
    """Python client for Cvety.kz API"""
    
    def __init__(self, base_url: str = None, debug: bool = False):
        """
        Initialize API client
        
        Args:
            base_url: API base URL (defaults to env var or production)
            debug: Enable debug mode with detailed logging
        """
        self.base_url = base_url or os.getenv("CVETY_API_URL", "https://api.cvety.kz")
        self.debug = debug
        self.token = None
        self.token_expires_at = None
        self.shop_id = None
        self.session = requests.Session()
        self.session.headers.update({
            "Content-Type": "application/json",
            "User-Agent": "CvetyKz-Python-Client/1.0"
        })
    
    def _log(self, message: str):
        """Log debug messages"""
        if self.debug:
            print(f"[{datetime.now().isoformat()}] {message}")
    
    def _request(self, method: str, endpoint: str, **kwargs) -> Dict:
        """
        Make HTTP request with automatic retry and error handling
        
        Args:
            method: HTTP method
            endpoint: API endpoint
            **kwargs: Additional request parameters
            
        Returns:
            Response JSON data
            
        Raises:
            requests.HTTPError: For API errors
        """
        url = f"{self.base_url}{endpoint}"
        self._log(f"{method} {url}")
        
        # Add auth header if we have a token
        if self.token:
            self.session.headers["Authorization"] = f"Bearer {self.token}"
        
        # Retry logic for rate limiting
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = self.session.request(method, url, **kwargs)
                
                if response.status_code == 429:
                    # Handle rate limiting
                    retry_after = int(response.headers.get("Retry-After", 60))
                    self._log(f"Rate limited. Waiting {retry_after} seconds...")
                    time.sleep(retry_after)
                    continue
                
                response.raise_for_status()
                return response.json() if response.content else {}
                
            except requests.HTTPError as e:
                if e.response.status_code == 401 and self.token:
                    # Try to refresh token
                    self._log("Token expired, attempting refresh...")
                    # In real implementation, would refresh token here
                    raise
                raise
        
        raise Exception(f"Max retries ({max_retries}) exceeded")
    
    # ============= Authentication =============
    
    def request_otp(self, phone: str) -> Dict:
        """
        Request OTP code for authentication
        
        Args:
            phone: Phone number in format +7XXXXXXXXXX
            
        Returns:
            Response with delivery method
        """
        return self._request("POST", "/api/auth/request-otp", json={"phone": phone})
    
    def authenticate(self, phone: str, otp_code: str) -> str:
        """
        Authenticate with phone and OTP code
        
        Args:
            phone: Phone number
            otp_code: 6-digit OTP code
            
        Returns:
            Access token
        """
        response = self._request("POST", "/api/auth/verify-otp", json={
            "phone": phone,
            "otp_code": otp_code
        })
        
        self.token = response["access_token"]
        self.shop_id = response.get("shop_id")
        self.token_expires_at = datetime.now() + timedelta(hours=24)
        
        self._log(f"Authenticated successfully. Shop ID: {self.shop_id}")
        return self.token
    
    # ============= Orders =============
    
    def get_orders(self, 
                   status: Optional[str] = None,
                   search: Optional[str] = None,
                   date_from: Optional[datetime] = None,
                   date_to: Optional[datetime] = None,
                   page: int = 1,
                   limit: int = 20) -> Dict:
        """
        Get list of orders with filters
        
        Args:
            status: Filter by status (new, paid, assembled, etc.)
            search: Search in phone/name/ID
            date_from: Start date filter
            date_to: End date filter
            page: Page number
            limit: Items per page
            
        Returns:
            Dict with items and total count
        """
        params = {
            "page": page,
            "limit": limit
        }
        
        if status:
            params["status"] = status
        if search:
            params["search"] = search
        if date_from:
            params["dateFrom"] = date_from.isoformat()
        if date_to:
            params["dateTo"] = date_to.isoformat()
        
        return self._request("GET", "/api/orders/", params=params)
    
    def get_order(self, order_id: int) -> Dict:
        """Get single order details"""
        return self._request("GET", f"/api/orders/{order_id}")
    
    def create_order(self, order_data: Dict) -> Dict:
        """
        Create new order
        
        Args:
            order_data: Order details including customer info, delivery, items
            
        Returns:
            Created order with tracking token
            
        Example:
            order = api.create_order({
                "customer_phone": "+77011234567",
                "recipient_name": "Айгуль",
                "address": "пр. Достык 89",
                "delivery_method": "delivery",
                "flower_sum": 25000,
                "delivery_fee": 2000,
                "total": 27000
            })
        """
        return self._request("POST", "/api/orders/", json=order_data)
    
    def create_order_with_items(self, order_data: Dict) -> Dict:
        """Create order with product items"""
        return self._request("POST", "/api/orders/with-items", json=order_data)
    
    def update_order_status(self, order_id: int, status: str, comment: str = None) -> Dict:
        """
        Update order status
        
        Args:
            order_id: Order ID
            status: New status
            comment: Optional comment
            
        Returns:
            Updated order
        """
        data = {"status": status}
        if comment:
            data["comment"] = comment
        
        return self._request("PATCH", f"/api/orders/{order_id}/status", json=data)
    
    def report_issue(self, order_id: int, issue_type: str, comment: str) -> Dict:
        """Report order issue"""
        return self._request("PATCH", f"/api/orders/{order_id}/issue", json={
            "issue_type": issue_type,
            "comment": comment
        })
    
    def assign_florist(self, order_id: int, florist_id: int) -> Dict:
        """Assign florist to order"""
        return self._request("POST", f"/api/orders/{order_id}/assign-florist", json={
            "florist_id": florist_id
        })
    
    # ============= Products =============
    
    def get_products(self,
                     category: Optional[str] = None,
                     search: Optional[str] = None,
                     is_popular: Optional[bool] = None,
                     is_new: Optional[bool] = None,
                     min_price: Optional[int] = None,
                     max_price: Optional[int] = None,
                     page: int = 1,
                     limit: int = 20) -> Dict:
        """Get products catalog with filters"""
        params = {
            "skip": (page - 1) * limit,
            "limit": limit
        }
        
        if category:
            params["category"] = category
        if search:
            params["search"] = search
        if is_popular is not None:
            params["is_popular"] = is_popular
        if is_new is not None:
            params["is_new"] = is_new
        if min_price:
            params["min_price"] = min_price
        if max_price:
            params["max_price"] = max_price
        
        return self._request("GET", "/api/products/", params=params)
    
    def get_product(self, product_id: int) -> Dict:
        """Get single product details"""
        return self._request("GET", f"/api/products/{product_id}")
    
    def create_product(self, product_data: Dict) -> Dict:
        """Create new product"""
        return self._request("POST", "/api/products/", json=product_data)
    
    def update_product(self, product_id: int, product_data: Dict) -> Dict:
        """Update product"""
        return self._request("PUT", f"/api/products/{product_id}", json=product_data)
    
    def toggle_product_active(self, product_id: int) -> Dict:
        """Toggle product active status"""
        return self._request("POST", f"/api/products/{product_id}/toggle-active")
    
    # ============= Customers =============
    
    def get_customers(self, search: Optional[str] = None, page: int = 1, limit: int = 20) -> Dict:
        """Get customers list"""
        params = {
            "skip": (page - 1) * limit,
            "limit": limit
        }
        if search:
            params["search"] = search
        
        return self._request("GET", "/api/customers/", params=params)
    
    def get_customer(self, customer_id: int) -> Dict:
        """Get customer details"""
        return self._request("GET", f"/api/customers/{customer_id}")
    
    def create_customer(self, customer_data: Dict) -> Dict:
        """Create new customer"""
        return self._request("POST", "/api/customers/", json=customer_data)
    
    def get_customer_orders(self, customer_id: int) -> Dict:
        """Get customer order history"""
        return self._request("GET", f"/api/customers/{customer_id}/orders")
    
    def add_customer_address(self, customer_id: int, address: str, is_default: bool = False) -> Dict:
        """Add customer address"""
        return self._request("POST", f"/api/customers/{customer_id}/addresses", json={
            "address": address,
            "is_default": is_default
        })
    
    # ============= Tracking =============
    
    def track_order(self, tracking_token: str) -> Dict:
        """
        Track order by token (public endpoint, no auth required)
        
        Args:
            tracking_token: 9-digit tracking token
            
        Returns:
            Order tracking information
        """
        # Remove auth header for public endpoint
        old_token = self.token
        self.token = None
        try:
            return self._request("GET", f"/api/tracking/{tracking_token}")
        finally:
            self.token = old_token
    
    # ============= Warehouse =============
    
    def get_warehouse_items(self, **filters) -> Dict:
        """Get warehouse inventory"""
        return self._request("GET", "/api/warehouse/", params=filters)
    
    def create_supply_delivery(self, delivery_data: Dict) -> Dict:
        """Create new supply delivery"""
        return self._request("POST", "/api/warehouse/deliveries", json=delivery_data)
    
    def adjust_stock(self, item_id: int, quantity_change: int, reason: str) -> Dict:
        """Adjust stock levels"""
        return self._request("POST", f"/api/warehouse/{item_id}/adjust-stock", json={
            "quantity_change": quantity_change,
            "reason": reason
        })
    
    # ============= Production =============
    
    def get_production_tasks(self, status: Optional[str] = None, florist_id: Optional[int] = None) -> Dict:
        """Get production tasks"""
        params = {}
        if status:
            params["status"] = status
        if florist_id:
            params["florist_id"] = florist_id
        
        return self._request("GET", "/api/production/tasks/", params=params)
    
    def create_production_task(self, task_data: Dict) -> Dict:
        """Create production task"""
        return self._request("POST", "/api/production/tasks/", json=task_data)
    
    def complete_task(self, task_id: int, photos: List[str] = None) -> Dict:
        """Mark task as completed"""
        data = {}
        if photos:
            data["photos"] = photos
        
        return self._request("POST", f"/api/production/tasks/{task_id}/complete", json=data)
    
    # ============= Utilities =============
    
    def upload_image(self, file_path: str) -> str:
        """
        Upload image file
        
        Args:
            file_path: Path to image file
            
        Returns:
            URL of uploaded image
        """
        with open(file_path, "rb") as f:
            files = {"file": f}
            # Temporarily remove Content-Type for multipart
            del self.session.headers["Content-Type"]
            try:
                response = self._request("POST", "/api/upload/image", files=files)
                return response["url"]
            finally:
                self.session.headers["Content-Type"] = "application/json"
    
    def get_statistics(self, date_from: datetime = None, date_to: datetime = None) -> Dict:
        """Get shop statistics"""
        params = {}
        if date_from:
            params["date_from"] = date_from.isoformat()
        if date_to:
            params["date_to"] = date_to.isoformat()
        
        return self._request("GET", "/api/statistics", params=params)


# ============= Example Usage =============

if __name__ == "__main__":
    # Initialize client
    api = CvetyKzAPI(debug=True)
    
    # For testing with debug mode
    if os.getenv("DEBUG") == "true":
        api.base_url = "http://localhost:8000"
    
    try:
        # 1. Authenticate
        print("=== Authentication ===")
        api.authenticate("+77011234567", "123456")
        print(f"Authenticated! Token: {api.token[:20]}...")
        
        # 2. Get orders
        print("\n=== Getting Orders ===")
        orders = api.get_orders(status="paid", limit=5)
        print(f"Found {orders['total']} orders")
        for order in orders["items"][:3]:
            print(f"  Order #{order['id']}: {order['status']} - {order['total']} ₸")
        
        # 3. Create new order
        print("\n=== Creating Order ===")
        new_order = api.create_order({
            "customer_phone": "+77011234567",
            "recipient_name": "Тест Айгуль",
            "recipient_phone": "+77017654321",
            "address": "г. Алматы, пр. Достык 89",
            "delivery_method": "delivery",
            "delivery_window": {
                "from_time": (datetime.now() + timedelta(hours=4)).isoformat(),
                "to_time": (datetime.now() + timedelta(hours=6)).isoformat()
            },
            "flower_sum": 25000,
            "delivery_fee": 2000,
            "total": 27000,
            "comment": "Тестовый заказ через API"
        })
        print(f"Created order #{new_order['id']}")
        print(f"Tracking: {new_order['tracking_token']}")
        
        # 4. Track order
        print("\n=== Tracking Order ===")
        tracking = api.track_order(new_order['tracking_token'])
        print(f"Status: {tracking['status']}")
        print(f"Updated: {tracking['updated_at']}")
        
        # 5. Get products
        print("\n=== Getting Products ===")
        products = api.get_products(category="bouquet", is_popular=True, limit=5)
        print(f"Found {products['total']} products")
        for product in products["items"][:3]:
            print(f"  {product['name']}: {product['current_price']} ₸")
        
        # 6. Get customers
        print("\n=== Getting Customers ===")
        customers = api.get_customers(limit=5)
        print(f"Found {customers['total']} customers")
        for customer in customers["items"][:3]:
            print(f"  {customer['name']}: {customer['phone']} ({customer['orders_count']} orders)")
        
    except requests.HTTPError as e:
        print(f"API Error: {e}")
        if e.response:
            print(f"Response: {e.response.text}")
    except Exception as e:
        print(f"Error: {e}")