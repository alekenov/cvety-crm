"""
Playwright E2E test configuration.
"""
import os
import pytest
from typing import Generator, Dict, Any
from playwright.sync_api import Playwright, Browser, BrowserContext, Page
import subprocess
import time
import signal


class TestConfig:
    """Configuration for E2E tests."""
    BASE_URL = os.getenv("E2E_BASE_URL", "http://localhost:5178")  # Updated to actual port
    API_URL = os.getenv("E2E_API_URL", "http://localhost:8000")
    HEADLESS = os.getenv("E2E_HEADLESS", "false").lower() == "true"
    SLOW_MO = int(os.getenv("E2E_SLOW_MO", "0"))  # Milliseconds between actions
    TIMEOUT = int(os.getenv("E2E_TIMEOUT", "30000"))  # Default timeout in ms
    
    # Test account credentials
    TEST_PHONE = "+77011234567"
    TEST_OTP = "123456"  # Works in DEBUG mode
    
    # Railway test environment (if available)
    RAILWAY_URL = os.getenv("RAILWAY_URL", "https://cvety-kz-production.up.railway.app")
    USE_RAILWAY = os.getenv("E2E_USE_RAILWAY", "false").lower() == "true"


@pytest.fixture(scope="session")
def test_config() -> TestConfig:
    """Provide test configuration."""
    return TestConfig()


@pytest.fixture(scope="session")
def browser_context_args(test_config: TestConfig) -> Dict[str, Any]:
    """Browser context configuration."""
    return {
        "viewport": {"width": 1280, "height": 720},
        "ignore_https_errors": True,
        "base_url": test_config.RAILWAY_URL if test_config.USE_RAILWAY else test_config.BASE_URL,
        "locale": "ru-RU",
        "timezone_id": "Asia/Almaty",
        "permissions": ["notifications"],
        "storage_state": None,  # Will be set after login
    }


@pytest.fixture(scope="session")
def playwright_instance() -> Generator[Playwright, None, None]:
    """Launch Playwright."""
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        yield p


@pytest.fixture(scope="session")
def browser(playwright_instance: Playwright, test_config: TestConfig) -> Generator[Browser, None, None]:
    """Launch browser."""
    browser = playwright_instance.chromium.launch(
        headless=test_config.HEADLESS,
        slow_mo=test_config.SLOW_MO,
        args=["--disable-blink-features=AutomationControlled"]
    )
    yield browser
    browser.close()


@pytest.fixture(scope="function")
def context(browser: Browser, browser_context_args: Dict[str, Any]) -> Generator[BrowserContext, None, None]:
    """Create browser context for each test."""
    context = browser.new_context(**browser_context_args)
    context.set_default_timeout(TestConfig.TIMEOUT)
    yield context
    context.close()


@pytest.fixture(scope="function")
def page(context: BrowserContext) -> Generator[Page, None, None]:
    """Create page for each test."""
    page = context.new_page()
    
    # Add console log listener for debugging
    page.on("console", lambda msg: print(f"[Browser Console]: {msg.text}"))
    
    # Add request logger for debugging API calls
    page.on("request", lambda request: print(f"[Request]: {request.method} {request.url}"))
    
    yield page
    page.close()


@pytest.fixture(scope="function")
def authenticated_page(page: Page, test_config: TestConfig) -> Page:
    """Provide authenticated page with logged-in user."""
    base_url = test_config.RAILWAY_URL if test_config.USE_RAILWAY else test_config.BASE_URL
    
    # Navigate to login page
    page.goto(f"{base_url}/login")
    
    # Enter phone number
    page.fill('input[type="tel"]', test_config.TEST_PHONE)
    page.click('button:has-text("Получить код")')
    
    # Wait for OTP input to appear
    page.wait_for_selector('input[placeholder*="код"]', timeout=5000)
    
    # Enter OTP code
    page.fill('input[placeholder*="код"]', test_config.TEST_OTP)
    page.click('button:has-text("Войти")')
    
    # Wait for redirect to dashboard
    page.wait_for_url(f"{base_url}/orders", timeout=10000)
    
    # Store authentication state
    storage = page.context.storage_state()
    
    # Check if we're authenticated
    assert page.url.endswith("/orders"), "Authentication failed"
    
    return page


@pytest.fixture(scope="session", autouse=True)
def setup_test_environment(test_config: TestConfig):
    """Setup test environment before running tests."""
    processes = []
    
    # Check if servers are already running
    import requests
    try:
        api_check = requests.get(f"{test_config.API_URL}/docs", timeout=1)
        frontend_check = requests.get(test_config.BASE_URL, timeout=1)
        if api_check.status_code == 200 and frontend_check.status_code == 200:
            print("Servers are already running, skipping startup...")
            yield
            return
    except:
        pass
    
    if not test_config.USE_RAILWAY:
        print("Starting local development servers...")
        
        # Start backend server (use python3 -m uvicorn for better path resolution)
        backend_process = subprocess.Popen(
            ["python3", "-m", "uvicorn", "app.main:app", "--reload", "--port", "8000"],
            cwd=os.path.join(os.path.dirname(__file__), "../../"),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            preexec_fn=os.setsid if os.name != 'nt' else None
        )
        processes.append(backend_process)
        
        # Start frontend server
        frontend_process = subprocess.Popen(
            ["npm", "run", "dev"],
            cwd=os.path.join(os.path.dirname(__file__), "../../../"),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            preexec_fn=os.setsid if os.name != 'nt' else None
        )
        processes.append(frontend_process)
        
        # Wait for servers to start
        print("Waiting for servers to start...")
        time.sleep(5)
        
        # Check if servers are running
        import requests
        for attempt in range(10):
            try:
                api_response = requests.get(f"{test_config.API_URL}/docs")
                if api_response.status_code == 200:
                    print("Backend server is ready")
                    break
            except:
                time.sleep(2)
        
        for attempt in range(10):
            try:
                frontend_response = requests.get(test_config.BASE_URL)
                if frontend_response.status_code == 200:
                    print("Frontend server is ready")
                    break
            except:
                time.sleep(2)
    
    yield
    
    # Cleanup: stop servers
    if not test_config.USE_RAILWAY:
        print("Stopping development servers...")
        for process in processes:
            if os.name != 'nt':
                os.killpg(os.getpgid(process.pid), signal.SIGTERM)
            else:
                process.terminate()
            process.wait()


@pytest.fixture
def api_client(test_config: TestConfig):
    """Provide API client for backend testing."""
    import requests
    from typing import Optional
    
    class APIClient:
        def __init__(self, base_url: str):
            self.base_url = base_url
            self.session = requests.Session()
            self.token: Optional[str] = None
        
        def login(self, phone: str = test_config.TEST_PHONE, otp: str = test_config.TEST_OTP):
            """Login and store JWT token."""
            # Request OTP
            self.session.post(f"{self.base_url}/api/auth/request-otp", json={"phone": phone})
            
            # Verify OTP
            response = self.session.post(
                f"{self.base_url}/api/auth/verify-otp",
                json={"phone": phone, "otp_code": otp}
            )
            
            if response.status_code == 200:
                self.token = response.json()["access_token"]
                self.session.headers.update({"Authorization": f"Bearer {self.token}"})
            
            return response
        
        def create_order(self, order_data: dict):
            """Create a new order."""
            return self.session.post(f"{self.base_url}/api/orders/", json=order_data)
        
        def get_orders(self, **params):
            """Get list of orders."""
            return self.session.get(f"{self.base_url}/api/orders/", params=params)
        
        def update_order_status(self, order_id: int, status: str):
            """Update order status."""
            return self.session.patch(
                f"{self.base_url}/api/orders/{order_id}/status",
                json={"status": status}
            )
    
    api_url = test_config.RAILWAY_URL if test_config.USE_RAILWAY else test_config.API_URL
    return APIClient(api_url)


@pytest.fixture
def test_data():
    """Provide test data for E2E tests."""
    return {
        "customer": {
            "name": "Тестовый Клиент",
            "phone": "+77012345678",
            "email": "test@example.com",
            "address": "ул. Абая 150, кв. 25"
        },
        "order": {
            "delivery_date": "2024-12-27",
            "delivery_time": "14:00-16:00",
            "total_amount": 25000,
            "notes": "Тестовый заказ"
        },
        "product": {
            "name": "Букет роз 51 шт",
            "category": "Букеты",
            "retail_price": 25000,
            "cost_price": 15000,
            "description": "Красивый букет из 51 розы"
        }
    }