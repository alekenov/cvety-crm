import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { testData } from '../fixtures/test-data';

test.describe('Authentication', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('should login with valid credentials', async ({ page }) => {
    await loginPage.goto();
    
    // Check we're on login page
    await expect(page).toHaveURL(/\/login/);
    
    // Fill phone number
    await loginPage.fillPhone(testData.testUser.phone);
    await loginPage.submitPhone();
    
    // Fill OTP
    await loginPage.fillOTP(testData.testUser.otp);
    await loginPage.submitOTP();
    
    // Should redirect to orders page
    await expect(page).toHaveURL(/\/orders/);
    
    // Should see orders page content
    await expect(page.locator('h1')).toContainText('Заказы');
  });

  test('should show error with invalid phone', async ({ page }) => {
    await loginPage.goto();
    
    // Try invalid phone format
    await loginPage.fillPhone('1234567');
    await loginPage.submitPhone();
    
    // Should show error
    await loginPage.hasError('Неверный формат');
  });

  test('should show error with invalid OTP', async ({ page }) => {
    await loginPage.goto();
    
    // Request OTP with valid phone
    await loginPage.fillPhone(testData.testUser.phone);
    await loginPage.submitPhone();
    
    // Try invalid OTP
    await loginPage.fillOTP('000000');
    await loginPage.submitOTP();
    
    // Should show error
    await loginPage.hasError('Неверный код');
  });

  test('should logout successfully', async ({ page }) => {
    // First login
    await loginPage.login();
    
    // Then logout
    await loginPage.logout();
    
    // Should be on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to login when not authenticated', async ({ page }) => {
    // Try to access protected page
    await page.goto('/orders');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should persist login across page refreshes', async ({ page }) => {
    // Login
    await loginPage.login();
    
    // Refresh page
    await page.reload();
    
    // Should still be on orders page
    await expect(page).toHaveURL(/\/orders/);
    await expect(page.locator('h1')).toContainText('Заказы');
  });

  test('should handle session expiry gracefully', async ({ page, context }) => {
    // Login
    await loginPage.login();
    
    // Clear cookies to simulate session expiry
    await context.clearCookies();
    
    // Try to navigate to protected page
    await page.goto('/warehouse');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});