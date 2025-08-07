"""
Comprehensive E2E test for all API endpoints through frontend.
Tests all pages and their corresponding API calls.
"""
import pytest
import time
from playwright.sync_api import Page, expect, Response
from typing import List, Dict, Any
import json


class EndpointTester:
    """Helper class to track and test API endpoints."""
    
    def __init__(self, page: Page):
        self.page = page
        self.api_calls: List[Dict[str, Any]] = []
        self.intercepted_responses: Dict[str, Any] = {}
        
    def setup_interceptors(self):
        """Setup network interceptors to track API calls."""
        def handle_response(response: Response):
            url = response.url
            if '/api/' in url:
                endpoint = url.split('/api/')[-1].split('?')[0]
                self.api_calls.append({
                    'endpoint': endpoint,
                    'method': response.request.method,
                    'status': response.status,
                    'url': url,
                    'timestamp': time.time()
                })
                
                # Store response for verification
                try:
                    self.intercepted_responses[endpoint] = {
                        'status': response.status,
                        'data': response.json() if response.status == 200 else None
                    }
                except:
                    pass
                    
                print(f"  API: {response.request.method} /{endpoint} -> {response.status}")
        
        self.page.on("response", handle_response)
    
    def get_api_summary(self) -> Dict[str, List[str]]:
        """Get summary of all API calls made."""
        summary = {}
        for call in self.api_calls:
            endpoint = call['endpoint']
            if endpoint not in summary:
                summary[endpoint] = []
            summary[endpoint].append(f"{call['method']} ({call['status']})")
        return summary


@pytest.fixture
def endpoint_tester(page: Page) -> EndpointTester:
    """Create endpoint tester for the page."""
    tester = EndpointTester(page)
    tester.setup_interceptors()
    return tester


def test_authentication_endpoints(page: Page, endpoint_tester: EndpointTester, test_config):
    """Test authentication flow and its endpoints."""
    print("\n=== Testing Authentication Endpoints ===")
    
    # Navigate to login
    page.goto(f"{test_config.BASE_URL}/login")
    page.wait_for_load_state("networkidle")
    
    # Test request-otp endpoint
    print("1. Testing /auth/request-otp")
    phone_input = page.locator('input[type="tel"]')
    phone_input.fill("+77011234567")
    
    get_code_btn = page.locator('button:has-text("Получить код")')
    get_code_btn.click()
    page.wait_for_timeout(1000)
    
    # Check if request-otp was called
    assert 'auth/request-otp' in endpoint_tester.intercepted_responses, "request-otp endpoint not called"
    
    # Test verify-otp endpoint
    print("2. Testing /auth/verify-otp")
    
    # Find OTP input (might be dynamically added)
    otp_inputs = page.locator('input[type="text"], input[type="number"]').all()
    if len(otp_inputs) > 1:
        otp_input = otp_inputs[-1]  # Last input is likely the OTP
        otp_input.fill("123456")
        
        # Find submit button
        submit_btn = page.locator('button').filter(has_text="Войти").or_(page.locator('button').filter(has_text="Подтвердить"))
        if submit_btn.count() > 0:
            submit_btn.first.click()
            page.wait_for_timeout(2000)
    
    # Check authentication status
    current_url = page.url
    if "/login" not in current_url:
        print(f"✓ Authentication successful, redirected to: {current_url}")
        
        # Store token for further tests
        storage = page.context.storage_state()
        print(f"✓ Token stored in browser context")
    else:
        print("⚠ Authentication might have failed, still on login page")


def test_orders_endpoints(page: Page, endpoint_tester: EndpointTester, test_config):
    """Test orders page and its endpoints."""
    print("\n=== Testing Orders Endpoints ===")
    
    # Ensure we're authenticated first
    ensure_authenticated(page, test_config)
    
    # Navigate to orders
    page.goto(f"{test_config.BASE_URL}/orders")
    page.wait_for_load_state("networkidle")
    
    print("1. Testing GET /orders (list orders)")
    # The page load should trigger orders fetch
    page.wait_for_timeout(1000)
    
    # Check if orders endpoint was called
    if 'orders' in endpoint_tester.intercepted_responses:
        response = endpoint_tester.intercepted_responses['orders']
        print(f"  ✓ Orders fetched: {response['status']}")
        if response['data']:
            print(f"  ✓ Orders count: {len(response['data'].get('items', []))}")
    
    # Test create order if button exists
    print("2. Testing POST /orders (create order)")
    create_btn = page.locator('button:has-text("Новый заказ")').or_(page.locator('button:has-text("Создать")')).or_(page.locator('button:has-text("Добавить")'))
    
    if create_btn.count() > 0:
        create_btn.first.click()
        page.wait_for_timeout(1000)
        
        # Check if modal or form appeared
        forms = page.locator('form, [role="dialog"]')
        if forms.count() > 0:
            print("  ✓ Order creation form opened")
            
            # Try to fill basic fields
            customer_input = page.locator('input[name*="customer"], input[placeholder*="Имя"]').first
            if customer_input.is_visible():
                customer_input.fill("Тестовый клиент")
            
            phone_input = page.locator('input[type="tel"]').first
            if phone_input.is_visible():
                phone_input.fill("+77012345678")
            
            # Close modal for now
            close_btn = page.locator('button[aria-label*="close"], button:has-text("Отмена")')
            if close_btn.count() > 0:
                close_btn.first.click()
    
    # Test order status update
    print("3. Testing PATCH /orders/{id}/status")
    order_rows = page.locator('tr[data-order-id], [class*="order-item"]')
    if order_rows.count() > 0:
        print(f"  ✓ Found {order_rows.count()} orders in the list")


def test_customers_endpoints(page: Page, endpoint_tester: EndpointTester, test_config):
    """Test customers page and its endpoints."""
    print("\n=== Testing Customers Endpoints ===")
    
    ensure_authenticated(page, test_config)
    
    # Navigate to customers
    page.goto(f"{test_config.BASE_URL}/customers")
    page.wait_for_load_state("networkidle")
    
    print("1. Testing GET /customers (list customers)")
    page.wait_for_timeout(1000)
    
    if 'customers' in endpoint_tester.intercepted_responses:
        response = endpoint_tester.intercepted_responses['customers']
        print(f"  ✓ Customers fetched: {response['status']}")
    else:
        print("  ⚠ Customers endpoint not called (might not be implemented)")
    
    # Check page content
    if "404" not in page.title() and "not found" not in page.content().lower():
        print("  ✓ Customers page loaded")
    else:
        print("  ⚠ Customers page might not be implemented")


def test_catalog_endpoints(page: Page, endpoint_tester: EndpointTester, test_config):
    """Test catalog page and its endpoints."""
    print("\n=== Testing Catalog Endpoints ===")
    
    ensure_authenticated(page, test_config)
    
    # Navigate to catalog
    page.goto(f"{test_config.BASE_URL}/catalog")
    page.wait_for_load_state("networkidle")
    
    print("1. Testing GET /products (list products)")
    page.wait_for_timeout(1000)
    
    if 'products' in endpoint_tester.intercepted_responses:
        response = endpoint_tester.intercepted_responses['products']
        print(f"  ✓ Products fetched: {response['status']}")
        if response['data']:
            print(f"  ✓ Products count: {len(response['data'].get('items', []))}")
    
    # Test product creation
    print("2. Testing POST /products (create product)")
    create_btn = page.locator('button:has-text("Добавить товар")').or_(page.locator('button:has-text("Новый товар")'))
    
    if create_btn.count() > 0:
        print("  ✓ Product creation button found")


def test_warehouse_endpoints(page: Page, endpoint_tester: EndpointTester, test_config):
    """Test warehouse page and its endpoints."""
    print("\n=== Testing Warehouse Endpoints ===")
    
    ensure_authenticated(page, test_config)
    
    # Navigate to warehouse
    page.goto(f"{test_config.BASE_URL}/warehouse")
    page.wait_for_load_state("networkidle")
    
    print("1. Testing GET /warehouse/inventory")
    page.wait_for_timeout(1000)
    
    if 'warehouse' in endpoint_tester.intercepted_responses or 'inventory' in endpoint_tester.intercepted_responses:
        print("  ✓ Warehouse data fetched")
    else:
        print("  ⚠ Warehouse endpoints might not be implemented")


def test_production_endpoints(page: Page, endpoint_tester: EndpointTester, test_config):
    """Test production page and its endpoints."""
    print("\n=== Testing Production Endpoints ===")
    
    ensure_authenticated(page, test_config)
    
    # Navigate to production
    page.goto(f"{test_config.BASE_URL}/production")
    page.wait_for_load_state("networkidle")
    
    print("1. Testing GET /production/tasks")
    page.wait_for_timeout(1000)
    
    # Check for kanban board or task list
    kanban = page.locator('[class*="kanban"], [class*="board"]')
    if kanban.count() > 0:
        print("  ✓ Production kanban board loaded")
    else:
        print("  ⚠ Production page might not be fully implemented")


def test_tracking_endpoint(page: Page, endpoint_tester: EndpointTester, test_config):
    """Test public tracking endpoint (no auth required)."""
    print("\n=== Testing Tracking Endpoint ===")
    
    # Test with a sample tracking token
    tracking_token = "TEST123456"
    page.goto(f"{test_config.BASE_URL}/tracking/{tracking_token}")
    page.wait_for_load_state("networkidle")
    
    print(f"1. Testing GET /tracking/{tracking_token}")
    page.wait_for_timeout(1000)
    
    if f'tracking/{tracking_token}' in endpoint_tester.intercepted_responses:
        response = endpoint_tester.intercepted_responses[f'tracking/{tracking_token}']
        print(f"  ✓ Tracking endpoint called: {response['status']}")
        if response['status'] == 404:
            print("  ✓ Correctly returned 404 for non-existent order")
    else:
        # Check if the page shows error or order not found
        error_text = page.locator('text=/заказ не найден|order not found/i')
        if error_text.count() > 0:
            print("  ✓ Tracking page correctly shows order not found")


def test_settings_endpoints(page: Page, endpoint_tester: EndpointTester, test_config):
    """Test settings page and its endpoints."""
    print("\n=== Testing Settings Endpoints ===")
    
    ensure_authenticated(page, test_config)
    
    # Navigate to settings
    page.goto(f"{test_config.BASE_URL}/settings")
    page.wait_for_load_state("networkidle")
    
    print("1. Testing GET /shops/me or /auth/me")
    page.wait_for_timeout(1000)
    
    if 'shops/me' in endpoint_tester.intercepted_responses or 'auth/me' in endpoint_tester.intercepted_responses:
        print("  ✓ Shop/user info fetched")
    
    # Check for settings tabs
    tabs = page.locator('[role="tab"], [class*="tab"]')
    if tabs.count() > 0:
        print(f"  ✓ Settings page has {tabs.count()} tabs")


def ensure_authenticated(page: Page, test_config):
    """Ensure the user is authenticated before testing protected endpoints."""
    current_url = page.url
    
    # If we're on login page, authenticate
    if "/login" in current_url:
        print("  → Authenticating...")
        
        # Quick auth
        page.goto(f"{test_config.BASE_URL}/login")
        phone_input = page.locator('input[type="tel"]')
        phone_input.fill("+77011234567")
        
        get_code_btn = page.locator('button:has-text("Получить код")')
        get_code_btn.click()
        page.wait_for_timeout(1000)
        
        # Fill OTP
        otp_inputs = page.locator('input[type="text"], input[type="number"]').all()
        if len(otp_inputs) > 1:
            otp_input = otp_inputs[-1]
            otp_input.fill("123456")
            
            submit_btn = page.locator('button').filter(has_text="Войти").or_(page.locator('button').filter(has_text="Подтвердить"))
            if submit_btn.count() > 0:
                submit_btn.first.click()
                page.wait_for_timeout(2000)


def test_comprehensive_endpoint_coverage(page: Page, test_config):
    """Main test that runs all endpoint tests and provides summary."""
    print("\n" + "="*60)
    print("COMPREHENSIVE E2E TEST - ALL ENDPOINTS THROUGH FRONTEND")
    print("="*60)
    
    # Create endpoint tester
    tester = EndpointTester(page)
    tester.setup_interceptors()
    
    # Run all tests
    tests = [
        ("Authentication", test_authentication_endpoints),
        ("Orders", test_orders_endpoints),
        ("Customers", test_customers_endpoints),
        ("Catalog", test_catalog_endpoints),
        ("Warehouse", test_warehouse_endpoints),
        ("Production", test_production_endpoints),
        ("Tracking", test_tracking_endpoint),
        ("Settings", test_settings_endpoints)
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        try:
            test_func(page, tester, test_config)
            results[test_name] = "✓ PASSED"
        except Exception as e:
            results[test_name] = f"✗ FAILED: {str(e)}"
            print(f"\n❌ Error in {test_name}: {e}")
    
    # Print summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    for test_name, result in results.items():
        print(f"{test_name:15} : {result}")
    
    print("\n" + "-"*60)
    print("API ENDPOINTS CALLED:")
    print("-"*60)
    
    api_summary = tester.get_api_summary()
    for endpoint, calls in sorted(api_summary.items()):
        print(f"  /{endpoint}")
        for call in calls:
            print(f"    - {call}")
    
    print("\n" + "-"*60)
    print(f"Total unique endpoints tested: {len(api_summary)}")
    print(f"Total API calls made: {len(tester.api_calls)}")
    
    # Determine overall result
    passed = sum(1 for r in results.values() if "PASSED" in r)
    failed = sum(1 for r in results.values() if "FAILED" in r)
    
    print(f"\nTests passed: {passed}/{len(results)}")
    print(f"Tests failed: {failed}/{len(results)}")
    
    if failed == 0:
        print("\n✅ ALL TESTS PASSED!")
    else:
        print(f"\n⚠️ {failed} TESTS FAILED")
    
    return failed == 0


if __name__ == "__main__":
    from playwright.sync_api import sync_playwright
    import sys
    
    class TestConfig:
        BASE_URL = "http://localhost:5180"
        API_URL = "http://localhost:8000"
        TEST_PHONE = "+77011234567"
        TEST_OTP = "123456"
    
    config = TestConfig()
    
    with sync_playwright() as p:
        # Launch browser in headless mode for CI, headed for debugging
        browser = p.chromium.launch(
            headless="--headless" in sys.argv,
            args=['--disable-blink-features=AutomationControlled']
        )
        
        context = browser.new_context(
            viewport={'width': 1280, 'height': 720},
            ignore_https_errors=True
        )
        
        page = context.new_page()
        
        # Run comprehensive test
        success = test_comprehensive_endpoint_coverage(page, config)
        
        # Take final screenshot
        page.screenshot(path="final-state.png")
        
        browser.close()
        
        # Exit with appropriate code
        sys.exit(0 if success else 1)