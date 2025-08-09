import { Page, expect } from '@playwright/test';
import { generateUniquePhone } from '../helpers/test-helpers';

export class LoginPage {
  constructor(private page: Page) {}
  
  // Храним телефон для текущего теста
  private currentPhone: string = '';

  // Locators
  private phoneInput = 'input[type="tel"]';
  private submitPhoneButton = 'button:has-text("Получить код")';
  private otpInput = 'input#otp';
  private verifyOtpButton = 'button:has-text("Войти")';
  private errorMessage = '[role="alert"]';
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
  async fillPhone(phone?: string) {
    this.currentPhone = phone || generateUniquePhone();
    await this.page.fill(this.phoneInput, this.currentPhone);
  }

  /**
   * Submit phone number to get OTP
   * @returns OTP code if in DEBUG mode, undefined otherwise
   */
  async submitPhone(): Promise<string | undefined> {
    await this.page.click(this.submitPhoneButton);
    
    // Wait a bit for response
    await this.page.waitForTimeout(500);
    
    // Check for debug mode OTP message
    const alertText = await this.page.textContent(this.successMessage).catch(() => null);
    let debugOtp: string | undefined;
    if (alertText?.includes('Тестовый режим')) {
      // Extract OTP from text like "Тестовый режим: Ваш код 123456"
      const match = alertText.match(/\d{6}/);
      if (match) {
        debugOtp = match[0];
      }
    }
    
    // Wait for OTP input to appear or check for rate limit error
    try {
      await this.page.waitForSelector(this.otpInput, { timeout: 5000 });
    } catch (e) {
      // Check if we hit rate limit
      const errorText = await this.page.textContent(this.errorMessage).catch(() => null);
      if (errorText?.includes('Too many requests')) {
        // Wait a bit and retry
        await this.page.waitForTimeout(2000);
        await this.page.click(this.submitPhoneButton);
        await this.page.waitForSelector(this.otpInput, { timeout: 10000 });
      } else {
        throw e;
      }
    }
    
    return debugOtp;
  }

  /**
   * Fill OTP code
   */
  async fillOTP(otp?: string) {
    // Если OTP не передан, используем значение по умолчанию
    const otpCode = otp || '123456';
    await this.page.fill(this.otpInput, otpCode);
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
    const debugOtp = await this.submitPhone();
    // Use debug OTP if available, otherwise use provided OTP
    await this.fillOTP(debugOtp || otp);
    await this.submitOTP();
    
    // Проверяем, нужно ли создать магазин (для новых пользователей)
    await this.page.waitForTimeout(2000);
    
    // Проверяем, появилась ли форма создания магазина
    const createButton = this.page.locator('button:has-text("Создать магазин")');
    const shopFormVisible = await createButton.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (shopFormVisible) {
      console.log('🆕 New user detected - filling shop creation form');
      
      // Находим и заполняем поле названия магазина
      const shopNameInput = this.page.locator('input[placeholder*="магазин"], input#shop-name, input').first();
      const currentValue = await shopNameInput.inputValue();
      
      if (!currentValue || currentValue.trim().length === 0) {
        await shopNameInput.clear();
        await shopNameInput.fill('Тестовый магазин');
      }
      
      // Ждём, пока кнопка станет активной
      await this.page.waitForTimeout(500);
      
      // Кликаем кнопку создания
      await createButton.click();
      
      // Ждём редиректа после создания магазина
      await this.page.waitForTimeout(2000);
    }
    
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
    await this.page.click('text=Выйти');
    
    // Should redirect to login
    await this.page.waitForURL('**/login', { timeout: 5000 });
  }
}