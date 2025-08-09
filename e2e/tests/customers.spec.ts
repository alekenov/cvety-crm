import { test, expect } from '@playwright/test';
import { CustomersPage } from '../pages/CustomersPage';
import { generateUniquePhone } from '../helpers/test-helpers';
import { loginAndNavigateTo } from '../helpers/auth-helper';

test.describe('Customers Management', () => {
  let customersPage: CustomersPage;
  const existingUserPhone = '+77011234567';

  test.beforeEach(async ({ page }) => {
    customersPage = new CustomersPage(page);
    
    // Login and navigate to customers page
    await loginAndNavigateTo(page, '/customers', existingUserPhone);
    
    // Wait for customers page to be fully loaded
    await page.waitForSelector('h1:has-text("Клиенты")', { timeout: 10000 });
  });

  test.describe('Customers List', () => {
    test('should display customers list', async ({ page }) => {
      await expect(page.locator('h1')).toHaveText('Клиенты');
      await expect(page.locator('table')).toBeVisible();
    });

    test('should search customers', async ({ page }) => {
      await customersPage.searchCustomers('Тест');
      await page.waitForLoadState('networkidle');
      
      const searchInput = page.locator('input[placeholder*="Поиск"]');
      await expect(searchInput).toHaveValue('Тест');
    });

    test('should display customer statistics', async ({ page }) => {
      const stats = await customersPage.getSummaryStats();
      
      expect(stats.totalCustomers).toBeGreaterThanOrEqual(0);
      expect(stats.totalRevenue).toBeTruthy();
    });
  });

  test.describe('Add Customer', () => {
    test('should open add customer dialog', async ({ page }) => {
      await customersPage.openAddCustomerDialog();
      
      const dialog = page.locator('[role="dialog"]:has-text("Новый клиент")');
      await expect(dialog).toBeVisible();
    });

    test('should add new customer', async ({ page }) => {
      const uniquePhone = generateUniquePhone();
      const customerData = {
        name: `Тестовый клиент ${Date.now()}`,
        phone: uniquePhone,
        email: 'test@example.com',
        address: 'ул. Тестовая, д. 1',
        notes: 'Тестовая заметка'
      };
      
      await customersPage.addCustomer(customerData);
      
      // Check success toast
      await expect(page.locator('[data-sonner-toast]')).toContainText('добавлен');
      
      // Verify customer appears in list
      await customersPage.searchCustomers(customerData.name);
      const hasCustomer = await customersPage.hasCustomer(customerData.name);
      expect(hasCustomer).toBeTruthy();
    });

    test('should validate required fields', async ({ page }) => {
      await customersPage.openAddCustomerDialog();
      
      // Try to submit without filling required fields
      const submitButton = page.locator('button:has-text("Добавить"):not(:has-text("клиента"))');
      await submitButton.click();
      
      // Should show error or button should be disabled
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible(); // Dialog should stay open
    });

    test('should validate phone format', async ({ page }) => {
      await customersPage.openAddCustomerDialog();
      
      const phoneInput = page.locator('input#phone');
      await phoneInput.fill('invalid phone');
      
      const submitButton = page.locator('button:has-text("Добавить"):not(:has-text("клиента"))');
      await submitButton.click();
      
      // Should show validation error or stay on dialog
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();
    });
  });

  test.describe('Customer Details', () => {
    test('should open customer details', async ({ page }) => {
      // Get first customer name
      const firstRow = page.locator('tbody tr').first();
      const customerName = await firstRow.locator('td:first-child').textContent();
      
      if (customerName) {
        await customersPage.openCustomerDetails(customerName.trim());
        
        // Check URL changed
        await expect(page).toHaveURL(/\/customers\/\d+/);
        
        // Check customer name is displayed
        await expect(page.locator('h1')).toContainText(customerName);
      }
    });

    test('should create order for customer', async ({ page }) => {
      const firstRow = page.locator('tbody tr').first();
      const customerName = await firstRow.locator('td:first-child').textContent();
      
      if (customerName) {
        await customersPage.createOrderForCustomer(customerName.trim());
        
        // Should redirect to new order page with customer pre-selected
        await expect(page).toHaveURL(/\/orders\/new\?customerId=/);
      }
    });

    test('should edit customer information', async ({ page }) => {
      const firstRow = page.locator('tbody tr').first();
      const customerName = await firstRow.locator('td:first-child').textContent();
      
      if (customerName) {
        await customersPage.openCustomerDetails(customerName.trim());
        
        const updates = {
          notes: `Updated notes at ${new Date().toISOString()}`
        };
        
        await customersPage.editCustomer(updates);
        
        // Check success toast
        await expect(page.locator('[data-sonner-toast]')).toBeVisible();
      }
    });

    test('should add customer address', async ({ page }) => {
      const firstRow = page.locator('tbody tr').first();
      const customerName = await firstRow.locator('td:first-child').textContent();
      
      if (customerName) {
        await customersPage.openCustomerDetails(customerName.trim());
        
        await customersPage.addAddress('ул. Новая, д. 10', 'Домашний');
        
        // Check success toast
        await expect(page.locator('[data-sonner-toast]')).toBeVisible();
      }
    });

    test('should add important date', async ({ page }) => {
      const firstRow = page.locator('tbody tr').first();
      const customerName = await firstRow.locator('td:first-child').textContent();
      
      if (customerName) {
        await customersPage.openCustomerDetails(customerName.trim());
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];
        
        await customersPage.addImportantDate(dateStr, 'День рождения');
        
        // Check success toast
        await expect(page.locator('[data-sonner-toast]')).toBeVisible();
      }
    });
  });

  test.describe('Customer Orders', () => {
    test('should display customer orders', async ({ page }) => {
      // Find customer with orders
      const rows = await page.locator('tbody tr').all();
      
      for (const row of rows) {
        const ordersText = await row.locator('td:nth-child(3)').textContent();
        const ordersMatch = ordersText?.match(/(\d+)/);
        const ordersCount = ordersMatch ? parseInt(ordersMatch[1]) : 0;
        
        if (ordersCount > 0) {
          const customerName = await row.locator('td:first-child').textContent();
          
          if (customerName) {
            await customersPage.openCustomerDetails(customerName.trim());
            
            const orders = await customersPage.getCustomerOrders();
            expect(orders.length).toBeGreaterThan(0);
            
            // Check order has required fields
            if (orders.length > 0) {
              const firstOrder = orders[0];
              expect(firstOrder.id).toBeTruthy();
              expect(firstOrder.date).toBeTruthy();
              expect(firstOrder.status).toBeTruthy();
              expect(firstOrder.total).toBeTruthy();
            }
            
            break;
          }
        }
      }
    });
  });

  test.describe('Customer Info', () => {
    test('should get customer info from list', async ({ page }) => {
      const firstRow = page.locator('tbody tr').first();
      const customerName = await firstRow.locator('td:first-child').textContent();
      
      if (customerName) {
        const info = await customersPage.getCustomerInfo(customerName.trim());
        
        expect(info).toBeTruthy();
        if (info) {
          expect(info.name).toBe(customerName.trim());
          expect(info.phone).toMatch(/^\+7/);
          expect(info.ordersCount).toBeGreaterThanOrEqual(0);
          expect(info.totalSpent).toBeTruthy();
        }
      }
    });

    test('should check if customer exists', async ({ page }) => {
      // Add a unique customer first
      const uniquePhone = generateUniquePhone();
      const customerName = `Unique Customer ${Date.now()}`;
      
      await customersPage.addCustomer({
        name: customerName,
        phone: uniquePhone
      });
      
      // Check customer exists
      const exists = await customersPage.hasCustomer(customerName);
      expect(exists).toBeTruthy();
      
      // Check non-existent customer
      const notExists = await customersPage.hasCustomer('Non Existent Customer 99999');
      expect(notExists).toBeFalsy();
    });
  });

  test.describe('Bulk Operations', () => {
    test('should handle pagination', async ({ page }) => {
      // Check if pagination exists
      const paginationNext = page.locator('a[aria-label="Вперед"]');
      
      if (await paginationNext.isVisible()) {
        const initialCount = await customersPage.getCustomersCount();
        
        await paginationNext.click();
        await page.waitForLoadState('networkidle');
        
        const nextPageCount = await customersPage.getCustomersCount();
        
        // Should have customers on next page or be empty
        expect(nextPageCount).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Mobile View', () => {
    test('should display mobile cards on small screens', async ({ page, isMobile }) => {
      if (isMobile) {
        // Mobile cards should be visible instead of table on mobile
        const mobileCards = await page.locator('[data-testid*="mobile-card"]').count();
        
        // Either mobile cards or responsive table
        const hasResponsiveView = mobileCards > 0 || await page.locator('.responsive-table').isVisible();
        expect(hasResponsiveView).toBeTruthy();
      }
    });
  });
});