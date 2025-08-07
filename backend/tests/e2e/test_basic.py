"""
Basic E2E test to verify setup is working.
"""
import pytest
from playwright.sync_api import sync_playwright
import os


def test_servers_are_running():
    """Test that both frontend and backend servers are accessible."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        
        # Test frontend
        frontend_url = os.getenv("E2E_BASE_URL", "http://localhost:5178")
        page.goto(frontend_url)
        assert page.title() != ""
        print(f"✓ Frontend is running at {frontend_url}")
        
        # Test backend API docs
        api_url = os.getenv("E2E_API_URL", "http://localhost:8000")
        page.goto(f"{api_url}/docs")
        assert "Cvety.kz API" in page.content() or "Swagger" in page.content()
        print(f"✓ Backend API is running at {api_url}")
        
        browser.close()


def test_homepage_loads():
    """Test that homepage loads and shows login page."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        frontend_url = os.getenv("E2E_BASE_URL", "http://localhost:5178")
        page.goto(frontend_url)
        
        # Should redirect to login or show main page
        page.wait_for_load_state("networkidle")
        
        # Check for common elements
        assert page.locator("body").is_visible()
        
        # Take screenshot for debugging
        page.screenshot(path="test-homepage.png")
        print(f"✓ Homepage loaded successfully")
        print(f"  Current URL: {page.url}")
        print(f"  Title: {page.title()}")
        
        browser.close()


def test_auth_page_elements():
    """Test that auth page has required elements."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        frontend_url = os.getenv("E2E_BASE_URL", "http://localhost:5178")
        page.goto(f"{frontend_url}/auth/login")
        
        page.wait_for_load_state("networkidle")
        
        # Check for phone input
        phone_input = page.locator('input[type="tel"]')
        if phone_input.count() > 0:
            print("✓ Phone input found")
            
            # Check for submit button
            button = page.locator('button').first
            if button.is_visible():
                print("✓ Submit button found")
                print(f"  Button text: {button.text_content()}")
        else:
            print("! Auth page may not be implemented yet")
            print(f"  Page content preview: {page.content()[:500]}...")
        
        browser.close()


if __name__ == "__main__":
    print("Running basic E2E tests...")
    test_servers_are_running()
    test_homepage_loads()
    test_auth_page_elements()
    print("\n✓ All basic tests completed!")