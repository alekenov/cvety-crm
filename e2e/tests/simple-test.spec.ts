import { test, expect } from '@playwright/test';

// Use saved authentication state
test.use({ storageState: 'e2e/.auth/user.json' });

test.describe('Simple Application Tests', () => {
  test('should navigate to Orders page', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.locator('h1')).toHaveText('Заказы');
    await expect(page.locator('table')).toBeVisible();
  });

  test('should navigate to Warehouse page', async ({ page }) => {
    await page.goto('/warehouse');
    await expect(page.locator('h1')).toHaveText('Остатки склада');
    await expect(page.locator('table')).toBeVisible();
  });

  test('should navigate to Customers page', async ({ page }) => {
    await page.goto('/customers');
    await expect(page.locator('h1')).toHaveText('Клиенты');
    await expect(page.locator('table')).toBeVisible();
  });

  test('should search in Orders', async ({ page }) => {
    await page.goto('/orders');
    
    const searchInput = page.locator('input[placeholder="Поиск"]');
    await searchInput.fill('1177');
    await searchInput.press('Enter');
    
    // Wait for any network activity to complete
    await page.waitForLoadState('networkidle');
    
    // Verify search input has value
    await expect(searchInput).toHaveValue('1177');
  });

  test('should open new order dialog', async ({ page }) => {
    await page.goto('/orders');
    
    const newOrderButton = page.locator('button:has-text("Новый заказ")');
    await newOrderButton.click();
    
    // Should redirect to new order page
    await expect(page).toHaveURL(/\/orders\/new/);
    await expect(page.locator('h1')).toContainText('Новый заказ');
  });

  test('should open quick receive dialog in Warehouse', async ({ page }) => {
    await page.goto('/warehouse');
    
    const quickReceiveButton = page.locator('text=Быстрая приемка');
    await quickReceiveButton.click();
    
    // Check dialog opened
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Быстрая приемка');
  });

  test('should open add customer dialog', async ({ page }) => {
    await page.goto('/customers');
    
    const addCustomerButton = page.locator('button:has-text("Добавить клиента")');
    await addCustomerButton.click();
    
    // Check dialog opened
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Новый клиент');
  });
});