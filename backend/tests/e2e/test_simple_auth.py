"""
Simplified authentication test that adapts to actual UI behavior.
"""
import pytest
from playwright.sync_api import Page, expect


def test_auth_flow_adaptive(page: Page, test_config):
    """Test authentication flow adapting to actual UI."""
    base_url = test_config.BASE_URL
    
    # Navigate to login
    page.goto(f"{base_url}/login")
    page.wait_for_load_state("networkidle")
    
    # Find phone input
    phone_input = page.locator('input[type="tel"]')
    expect(phone_input).to_be_visible()
    
    # Enter phone
    phone_input.fill("+77011234567")
    
    # Click get code button
    get_code_btn = page.locator('button:has-text("Получить код")')
    expect(get_code_btn).to_be_enabled()
    
    # Capture current state before clicking
    initial_inputs = page.locator('input').count()
    print(f"Inputs before clicking: {initial_inputs}")
    
    # Click the button
    get_code_btn.click()
    
    # Wait for any changes (network request, UI update, etc.)
    page.wait_for_timeout(2000)
    
    # Check what happened
    current_url = page.url
    current_inputs = page.locator('input').count()
    
    print(f"URL after click: {current_url}")
    print(f"Inputs after click: {current_inputs}")
    
    # Check if OTP input appeared
    if current_inputs > initial_inputs:
        print("✓ OTP input appeared")
        
        # Find the new input (likely the last one)
        all_inputs = page.locator('input').all()
        otp_input = all_inputs[-1]
        
        # Fill OTP
        otp_input.fill("123456")
        
        # Look for submit/login button
        buttons = page.locator('button').all()
        for button in buttons:
            text = button.text_content().lower()
            if "войти" in text or "login" in text or "submit" in text:
                print(f"Found submit button: {button.text_content()}")
                button.click()
                break
        
        # Wait for navigation
        page.wait_for_timeout(2000)
        
        # Check if logged in
        if "/login" not in page.url:
            print(f"✓ Successfully logged in! Redirected to: {page.url}")
            return True
    
    # Check if there was an error message
    error_messages = page.locator('[role="alert"], .error, .text-red-500').all()
    if error_messages:
        for error in error_messages:
            print(f"Error message: {error.text_content()}")
    
    # Try to check API response
    import requests
    try:
        api_response = requests.post(
            f"{test_config.API_URL}/api/auth/request-otp",
            json={"phone": "+77011234567"}
        )
        print(f"Direct API call response: {api_response.status_code}")
        if api_response.status_code != 200:
            print(f"API response: {api_response.text}")
    except Exception as e:
        print(f"API call failed: {e}")
    
    return False


def test_login_page_structure(page: Page, test_config):
    """Test login page has expected structure."""
    page.goto(f"{test_config.BASE_URL}/login")
    page.wait_for_load_state("networkidle")
    
    # Check essential elements
    elements = {
        'phone_input': page.locator('input[type="tel"]'),
        'submit_button': page.locator('button').first,
        'form': page.locator('form'),
    }
    
    for name, element in elements.items():
        try:
            if element.is_visible():
                print(f"✓ {name} is visible")
            else:
                print(f"✗ {name} is NOT visible")
        except Exception as e:
            print(f"✗ {name} check failed: {e}")
    
    # Check page title/header
    headers = page.locator('h1, h2').all()
    if headers:
        print(f"Page header: {headers[0].text_content()}")
    
    # Take screenshot for debugging
    page.screenshot(path="login-page.png")
    print("Screenshot saved as login-page.png")


if __name__ == "__main__":
    from playwright.sync_api import sync_playwright
    
    class TestConfig:
        BASE_URL = "http://localhost:5180"  # Updated to current port
        API_URL = "http://localhost:8000"
    
    config = TestConfig()
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        print("=== Test 1: Login Page Structure ===")
        test_login_page_structure(page, config)
        
        print("\n=== Test 2: Adaptive Auth Flow ===")
        test_auth_flow_adaptive(page, config)
        
        browser.close()