import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { OrdersPage } from '../pages/OrdersPage';
import { WarehousePage } from '../pages/WarehousePage';
import { CustomersPage } from '../pages/CustomersPage';

test.describe('Demo: Complete Application Flow', () => {
  const existingUserPhone = '+77011234567';
  
  test('should demonstrate full application functionality', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const ordersPage = new OrdersPage(page);
    const warehousePage = new WarehousePage(page);
    const customersPage = new CustomersPage(page);
    
    // Step 1: Login
    await test.step('Login to application', async () => {
      await loginPage.goto();
      await loginPage.fillPhone(existingUserPhone);
      const otp = await loginPage.submitPhone();
      expect(otp).toBeTruthy();
      
      if (otp) {
        await loginPage.fillOTP(otp);
        await loginPage.submitOTP();
      }
      
      // Verify we're logged in
      await expect(page).toHaveURL(/\/orders/);
    });
    
    // Step 2: Check Orders Page
    await test.step('Navigate to Orders page', async () => {
      await ordersPage.goto();
      await expect(page.locator('h1')).toHaveText('Заказы');
      
      // Check that orders list is displayed
      const table = page.locator('table');
      await expect(table).toBeVisible();
      
      // Check for new order button
      const newOrderButton = page.locator('button:has-text("Новый заказ")');
      await expect(newOrderButton).toBeVisible();
    });
    
    // Step 3: Check Warehouse Page
    await test.step('Navigate to Warehouse page', async () => {
      await warehousePage.goto();
      await expect(page.locator('h1')).toHaveText('Остатки склада');
      
      // Check that inventory table is displayed
      const table = page.locator('table');
      await expect(table).toBeVisible();
      
      // Check for quick receive button
      const quickReceiveButton = page.locator('text=Быстрая приемка');
      await expect(quickReceiveButton).toBeVisible();
    });
    
    // Step 4: Check Customers Page
    await test.step('Navigate to Customers page', async () => {
      await customersPage.goto();
      await expect(page.locator('h1')).toHaveText('Клиенты');
      
      // Check that customers table is displayed
      const table = page.locator('table');
      await expect(table).toBeVisible();
      
      // Check for add customer button
      const addCustomerButton = page.locator('button:has-text("Добавить клиента")');
      await expect(addCustomerButton).toBeVisible();
      
      // Check statistics are displayed
      const stats = page.locator('text=/Всего клиентов:/');
      await expect(stats).toBeVisible();
    });
    
    // Step 5: Test Search on Orders
    await test.step('Test search functionality on Orders', async () => {
      await ordersPage.goto();
      await ordersPage.searchOrders('1177');
      
      // Wait for search results
      await page.waitForTimeout(1000);
      
      // Verify search input has value
      const searchInput = page.locator('input[placeholder="Поиск"]');
      await expect(searchInput).toHaveValue('1177');
    });
  });
});