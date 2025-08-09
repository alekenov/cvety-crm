import { test, expect } from '@playwright/test';

test.describe('Basic Application Flow', () => {
  test('should login and navigate through main pages', async ({ page }) => {
    // Step 1: Login
    await test.step('Login', async () => {
      await page.goto('/login');
      
      // Fill phone number
      await page.locator('input#phone').fill('+77011234567');
      
      // Submit phone number
      await page.locator('button[type="submit"]:has-text("Получить код")').click();
      
      // Wait for OTP to appear (in DEBUG mode)
      await page.waitForSelector('text=Код подтверждения', { timeout: 5000 });
      
      // Get OTP from the page
      const otpText = await page.locator('text=/\\d{6}/').textContent();
      const otp = otpText?.match(/\d{6}/)?.[0];
      expect(otp).toBeTruthy();
      
      if (otp) {
        // Find and fill the OTP input 
        // The OTP input might be a single field or multiple inputs
        const otpInput = page.locator('input[name="otp"], input[name="otp_code"], input[placeholder*="код"], input[type="text"]:not(#phone)').first();
        
        if (await otpInput.isVisible()) {
          // Single input field
          await otpInput.fill(otp);
        } else {
          // Multiple input fields (one per digit)
          const otpInputs = page.locator('input[maxlength="1"], input[inputmode="numeric"]');
          const count = await otpInputs.count();
          
          if (count === 6) {
            for (let i = 0; i < 6; i++) {
              await otpInputs.nth(i).fill(otp[i]);
            }
          } else {
            // Try another selector
            const otpCodeInput = page.locator('input').filter({ hasText: '' }).nth(1);
            await otpCodeInput.fill(otp);
          }
        }
        
        // Submit OTP
        await page.locator('button[type="submit"]:has-text("Войти"), button[type="submit"]:has-text("Подтвердить")').click();
        
        // Wait for redirect
        await page.waitForURL('**/orders', { timeout: 10000 });
      }
    });
    
    // Step 2: Navigate to Orders
    await test.step('Check Orders page', async () => {
      await page.goto('/orders');
      await expect(page.locator('h1')).toHaveText('Заказы');
      await expect(page.locator('table, [data-testid="orders-list"]')).toBeVisible();
      
      // Check for main elements
      const newOrderButton = page.locator('button:has-text("Новый заказ")');
      await expect(newOrderButton).toBeVisible();
    });
    
    // Step 3: Navigate to Warehouse
    await test.step('Check Warehouse page', async () => {
      await page.goto('/warehouse');
      await expect(page.locator('h1')).toHaveText('Остатки склада');
      await expect(page.locator('table, [data-testid="warehouse-list"]')).toBeVisible();
      
      // Check for quick receive button
      const quickReceiveButton = page.locator('text=Быстрая приемка');
      await expect(quickReceiveButton).toBeVisible();
    });
    
    // Step 4: Navigate to Customers
    await test.step('Check Customers page', async () => {
      await page.goto('/customers');
      await expect(page.locator('h1')).toHaveText('Клиенты');
      await expect(page.locator('table, [data-testid="customers-list"]')).toBeVisible();
      
      // Check for add customer button
      const addCustomerButton = page.locator('button:has-text("Добавить клиента")');
      await expect(addCustomerButton).toBeVisible();
    });
    
    // Step 5: Test Search
    await test.step('Test search functionality', async () => {
      await page.goto('/orders');
      
      const searchInput = page.locator('input[placeholder*="Поиск"], input[type="search"]').first();
      await searchInput.fill('test');
      await searchInput.press('Enter');
      
      // Wait for search to complete
      await page.waitForTimeout(1000);
      
      // Verify search input still has value
      await expect(searchInput).toHaveValue('test');
    });
  });
});