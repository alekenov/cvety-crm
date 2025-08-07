"""
E2E tests for authentication flow.
"""
import pytest
from playwright.sync_api import Page, expect


class TestAuthenticationFlow:
    """Test authentication workflows."""
    
    def test_login_with_valid_credentials(self, page: Page, test_config):
        """Test successful login with valid phone and OTP."""
        base_url = test_config.RAILWAY_URL if test_config.USE_RAILWAY else test_config.BASE_URL
        
        # Navigate to login page (it's at /login not /auth/login)
        page.goto(f"{base_url}/login")
        
        # Check if we're on login page (title may differ)
        page.wait_for_load_state("networkidle")
        
        # Find and fill phone input
        phone_input = page.locator('input[type="tel"]')
        expect(phone_input).to_be_visible()
        phone_input.fill(test_config.TEST_PHONE)
        
        # Click request OTP button
        request_otp_button = page.locator('button:has-text("Получить код")')
        expect(request_otp_button).to_be_enabled()
        request_otp_button.click()
        
        # Wait for OTP input to appear
        otp_input = page.locator('input[placeholder*="код"]')
        expect(otp_input).to_be_visible(timeout=5000)
        
        # Enter OTP
        otp_input.fill(test_config.TEST_OTP)
        
        # Click login button
        login_button = page.locator('button:has-text("Войти")')
        expect(login_button).to_be_enabled()
        login_button.click()
        
        # Should redirect to orders page
        page.wait_for_url(f"{base_url}/orders", timeout=10000)
        expect(page).to_have_url(f"{base_url}/orders")
        
        # Check if navigation menu is visible (indicates successful login)
        nav_menu = page.locator('nav')
        expect(nav_menu).to_be_visible()
        
        # Check if user info is displayed
        user_menu = page.locator('[data-testid="user-menu"]')
        expect(user_menu).to_contain_text(test_config.TEST_PHONE)
    
    def test_login_with_invalid_otp(self, page: Page, test_config):
        """Test login failure with invalid OTP."""
        base_url = test_config.RAILWAY_URL if test_config.USE_RAILWAY else test_config.BASE_URL
        
        # Navigate to login page
        page.goto(f"{base_url}/login")
        
        # Request OTP
        phone_input = page.locator('input[type="tel"]')
        phone_input.fill(test_config.TEST_PHONE)
        page.click('button:has-text("Получить код")')
        
        # Wait for OTP input
        otp_input = page.locator('input[placeholder*="код"]')
        expect(otp_input).to_be_visible(timeout=5000)
        
        # Enter invalid OTP
        otp_input.fill("000000")
        page.click('button:has-text("Войти")')
        
        # Should show error message
        error_message = page.locator('[role="alert"]')
        expect(error_message).to_be_visible(timeout=5000)
        expect(error_message).to_contain_text("Неверный код")
        
        # Should still be on login page
        expect(page).to_have_url(f"{base_url}/login")
    
    def test_logout(self, authenticated_page: Page, test_config):
        """Test logout functionality."""
        page = authenticated_page
        base_url = test_config.RAILWAY_URL if test_config.USE_RAILWAY else test_config.BASE_URL
        
        # Open user menu
        user_menu = page.locator('[data-testid="user-menu"]')
        user_menu.click()
        
        # Click logout
        logout_button = page.locator('button:has-text("Выйти")')
        expect(logout_button).to_be_visible()
        logout_button.click()
        
        # Should redirect to login page
        page.wait_for_url(f"{base_url}/login", timeout=5000)
        expect(page).to_have_url(f"{base_url}/login")
        
        # Try to access protected page
        page.goto(f"{base_url}/orders")
        
        # Should redirect back to login
        page.wait_for_url(f"{base_url}/login", timeout=5000)
        expect(page).to_have_url(f"{base_url}/login")
    
    def test_session_persistence(self, authenticated_page: Page, test_config):
        """Test that session persists across page refreshes."""
        page = authenticated_page
        base_url = test_config.RAILWAY_URL if test_config.USE_RAILWAY else test_config.BASE_URL
        
        # Refresh the page
        page.reload()
        
        # Should still be on orders page
        page.wait_for_url(f"{base_url}/orders", timeout=5000)
        expect(page).to_have_url(f"{base_url}/orders")
        
        # User menu should still be visible
        user_menu = page.locator('[data-testid="user-menu"]')
        expect(user_menu).to_be_visible()
        
        # Navigate to another protected page
        page.goto(f"{base_url}/customers")
        expect(page).to_have_url(f"{base_url}/customers")
        
        # Should not redirect to login
        nav_menu = page.locator('nav')
        expect(nav_menu).to_be_visible()