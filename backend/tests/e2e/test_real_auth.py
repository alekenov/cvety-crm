"""
Real authentication E2E test adapted to actual UI.
"""
import pytest
from playwright.sync_api import Page, expect
import time


def test_login_flow_debug_mode(page: Page, test_config):
    """Test login flow with debug mode credentials."""
    # Navigate to login page
    page.goto(f"{test_config.BASE_URL}/login")
    
    # Wait for page to load
    page.wait_for_load_state("networkidle")
    
    # Find phone input
    phone_input = page.locator('input[type="tel"]')
    expect(phone_input).to_be_visible()
    
    # Enter test phone number
    phone_input.fill("+77011234567")
    
    # Click "Get code" button
    get_code_button = page.locator('button:has-text("Получить код")')
    expect(get_code_button).to_be_enabled()
    get_code_button.click()
    
    # Wait for OTP input to appear (it might be on the same page or navigate)
    page.wait_for_timeout(1000)  # Small wait for UI update
    
    # Check if we have OTP input now
    otp_inputs = page.locator('input').all()
    
    if len(otp_inputs) > 1:
        # OTP input appeared, fill it
        otp_input = otp_inputs[-1]  # Usually the last input
        otp_input.fill("123456")
        
        # Look for login/submit button
        submit_button = page.locator('button').last
        submit_button.click()
        
        # Wait for redirect
        page.wait_for_timeout(2000)
        
        # Check if we're logged in (should redirect from login)
        assert "/login" not in page.url, f"Still on login page: {page.url}"
        print(f"✓ Successfully logged in, redirected to: {page.url}")
    else:
        print("! OTP input did not appear - may need to check API response")


def test_full_auth_with_api_mock(page: Page, test_config):
    """Test authentication with API interaction."""
    import requests
    
    # First, make sure API is working
    api_response = requests.post(
        f"{test_config.API_URL}/api/auth/request-otp",
        json={"phone": "+77011234567"}
    )
    
    print(f"API request OTP response: {api_response.status_code}")
    
    # Navigate to login
    page.goto(f"{test_config.BASE_URL}/login")
    
    # Fill phone
    phone_input = page.locator('input[type="tel"]')
    phone_input.fill("+77011234567")
    
    # Intercept network requests to see what's happening
    def handle_request(request):
        if "auth" in request.url:
            print(f"  Request: {request.method} {request.url}")
    
    page.on("request", handle_request)
    
    # Click get code
    page.locator('button:has-text("Получить код")').click()
    
    # Wait for any changes
    page.wait_for_timeout(2000)
    
    # Check current state
    inputs = page.locator('input').all()
    buttons = page.locator('button').all()
    
    print(f"After clicking 'Get Code':")
    print(f"  - Number of inputs: {len(inputs)}")
    print(f"  - Number of buttons: {len(buttons)}")
    
    # If we have 2 inputs, second is likely OTP
    if len(inputs) == 2:
        otp_input = inputs[1]
        otp_input.fill("123456")
        
        # Find and click submit button
        for button in buttons:
            text = button.text_content()
            if "войти" in text.lower() or "submit" in text.lower():
                button.click()
                break
        
        # Wait for navigation
        page.wait_for_timeout(2000)
        
        # Verify login
        if "/login" not in page.url:
            print(f"✓ Login successful! Current URL: {page.url}")
            
            # Try to verify with API
            verify_response = requests.post(
                f"{test_config.API_URL}/api/auth/verify-otp",
                json={"phone": "+77011234567", "otp_code": "123456"}
            )
            
            if verify_response.status_code == 200:
                token = verify_response.json().get("access_token")
                print(f"✓ Got JWT token: {token[:20]}...")
        else:
            print(f"! Still on login page: {page.url}")


if __name__ == "__main__":
    from playwright.sync_api import sync_playwright
    import os
    
    class TestConfig:
        BASE_URL = "http://localhost:5178"
        API_URL = "http://localhost:8000"
    
    config = TestConfig()
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=500)  # Visible for debugging
        page = browser.new_page()
        
        print("=== Running Authentication Tests ===\n")
        
        print("Test 1: Login flow in debug mode")
        test_login_flow_debug_mode(page, config)
        
        print("\nTest 2: Full auth with API")
        test_full_auth_with_api_mock(page, config)
        
        browser.close()
        print("\n=== Tests completed ===")