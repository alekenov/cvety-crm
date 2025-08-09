import { Page, expect } from '@playwright/test';
import { testData } from '../fixtures/test-data';

export class LoginPage {
  constructor(private page: Page) {}

  // Locators
  private phoneInput = 'input[type="tel"]';
  private submitPhoneButton = 'button:has-text("Получить код")';
  private otpInputs = 'input[maxlength="1"]';
  private verifyOtpButton = 'button:has-text("Войти")';
  private errorMessage = '[role="alert"].destructive';
  private successMessage = '[role="alert"]:not(.destructive)';

  /**
   * Navigate to login page
   */
  async goto() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Fill phone number
   */
  async fillPhone(phone: string = testData.testUser.phone) {
    await this.page.fill(this.phoneInput, phone);
  }

  /**
   * Submit phone number to get OTP
   */
  async submitPhone() {
    await this.page.click(this.submitPhoneButton);
    // Wait for OTP inputs to appear
    await this.page.waitForSelector(this.otpInputs, { timeout: 5000 });
  }

  /**
   * Fill OTP code
   */
  async fillOTP(otp: string = testData.testUser.otp) {
    const otpDigits = otp.split('');
    const inputs = await this.page.locator(this.otpInputs).all();
    
    for (let i = 0; i < otpDigits.length && i < inputs.length; i++) {
      await inputs[i].fill(otpDigits[i]);
    }
  }

  /**
   * Submit OTP to login
   */
  async submitOTP() {
    await this.page.click(this.verifyOtpButton);
  }

  /**
   * Complete login flow
   */
  async login(phone?: string, otp?: string) {
    await this.goto();
    await this.fillPhone(phone);
    await this.submitPhone();
    await this.fillOTP(otp);
    await this.submitOTP();
    
    // Wait for redirect to dashboard
    await this.page.waitForURL('**/orders', { timeout: 10000 });
    
    // Verify we're logged in
    await expect(this.page).toHaveURL(/\/orders/);
  }

  /**
   * Quick login for tests that need authentication
   */
  async quickLogin() {
    // Check if already logged in
    const currentUrl = this.page.url();
    if (currentUrl.includes('/orders') || currentUrl.includes('/warehouse')) {
      return; // Already logged in
    }

    await this.login();
  }

  /**
   * Check if error message is displayed
   */
  async hasError(expectedText?: string) {
    const error = this.page.locator(this.errorMessage);
    await expect(error).toBeVisible();
    
    if (expectedText) {
      await expect(error).toContainText(expectedText);
    }
  }

  /**
   * Check if success message is displayed
   */
  async hasSuccess(expectedText?: string) {
    const success = this.page.locator(this.successMessage);
    await expect(success).toBeVisible();
    
    if (expectedText) {
      await expect(success).toContainText(expectedText);
    }
  }

  /**
   * Logout
   */
  async logout() {
    // Click on user menu
    await this.page.click('[data-testid="user-menu"]');
    
    // Click logout
    await this.page.click('button:has-text("Выйти")');
    
    // Should redirect to login
    await this.page.waitForURL('**/login');
  }
}