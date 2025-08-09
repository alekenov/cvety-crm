import { Page, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

/**
 * Helper functions for authentication in tests
 */

/**
 * Login with existing user and wait for navigation
 * @param page - Playwright page object
 * @param phone - Phone number (default: existing test user)
 * @returns Promise that resolves when logged in and navigated
 */
export async function loginAndWaitForNavigation(
  page: Page,
  phone: string = '+77011234567'
): Promise<void> {
  const loginPage = new LoginPage(page);
  
  // Go to login page
  await loginPage.goto();
  
  // Fill phone number
  await loginPage.fillPhone(phone);
  
  // Submit and get OTP
  const otp = await loginPage.submitPhone();
  
  if (!otp) {
    throw new Error('Failed to get OTP code');
  }
  
  // Fill and submit OTP
  await loginPage.fillOTP(otp);
  await loginPage.submitOTP();
  
  // Wait for navigation away from login page
  await page.waitForURL((url) => !url.pathname.includes('/login'), {
    timeout: 10000,
    waitUntil: 'networkidle'
  });
  
  // Additional wait for app to stabilize
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500); // Small delay for React to render
}

/**
 * Check if user is logged in
 * @param page - Playwright page object
 * @returns true if logged in, false otherwise
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    // Check if user menu is visible (indicates logged in state)
    const userMenu = page.locator('[data-testid="user-menu"]');
    await userMenu.waitFor({ state: 'visible', timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensure user is logged in, login if not
 * @param page - Playwright page object
 * @param phone - Phone number to use for login
 */
export async function ensureLoggedIn(
  page: Page,
  phone: string = '+77011234567'
): Promise<void> {
  // Check current URL
  const currentUrl = page.url();
  
  // If on login page, perform login
  if (currentUrl.includes('/login')) {
    await loginAndWaitForNavigation(page, phone);
    return;
  }
  
  // If not on login page, check if logged in
  const loggedIn = await isLoggedIn(page);
  
  if (!loggedIn) {
    // Navigate to login and perform login
    await page.goto('/login');
    await loginAndWaitForNavigation(page, phone);
  }
}

/**
 * Login and navigate to specific page
 * @param page - Playwright page object
 * @param targetUrl - URL to navigate to after login
 * @param phone - Phone number to use for login
 */
export async function loginAndNavigateTo(
  page: Page,
  targetUrl: string,
  phone: string = '+77011234567'
): Promise<void> {
  // First login
  await loginAndWaitForNavigation(page, phone);
  
  // Then navigate to target page
  await page.goto(targetUrl);
  
  // Wait for navigation to complete
  await page.waitForLoadState('networkidle');
  
  // Verify we're on the correct page
  await expect(page).toHaveURL(new RegExp(targetUrl));
}