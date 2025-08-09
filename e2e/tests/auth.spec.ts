import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { generateUniquePhone, clearAllTestData, waitForRateLimit } from '../helpers/test-helpers';

test.describe('Authentication', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    // Очищаем тестовые данные перед каждым тестом
    await clearAllTestData();
    // Небольшая задержка между тестами
    await waitForRateLimit(500);
  });

  test('should login with valid credentials', async ({ page }) => {
    await loginPage.goto();
    
    // Check we're on login page
    await expect(page).toHaveURL(/\/login/);
    
    // Use existing user to avoid shop creation
    const existingUserPhone = '+77011234567';
    await loginPage.fillPhone(existingUserPhone);
    const debugOtp = await loginPage.submitPhone();
    
    // Fill OTP (use debug OTP if available)
    await loginPage.fillOTP(debugOtp || '123456');
    await loginPage.submitOTP();
    
    // Wait for navigation
    await page.waitForLoadState('networkidle');
    
    // Should redirect to orders page
    await expect(page).toHaveURL(/\/orders/, { timeout: 10000 });
    
    // Should see orders page content
    await expect(page.locator('h1')).toContainText('Заказы');
  });

  test('should show error with invalid phone', async ({ page }) => {
    await loginPage.goto();
    
    // Try invalid phone format
    await loginPage.fillPhone('1234567');
    
    // Button should be disabled for invalid phone
    const submitButton = page.locator('button:has-text("Получить код")');
    await expect(submitButton).toBeDisabled();
  });

  test('should show error with invalid OTP', async ({ page }) => {
    await loginPage.goto();
    
    // Request OTP with valid phone
    const testPhone = generateUniquePhone();
    await loginPage.fillPhone(testPhone);
    await loginPage.submitPhone();
    
    // Try invalid OTP
    await loginPage.fillOTP('000000');
    await loginPage.submitOTP();
    
    // Should show error
    const errorAlert = page.locator('[role="alert"]');
    await expect(errorAlert).toContainText('Invalid OTP');
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