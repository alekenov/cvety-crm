import { test, expect } from '@playwright/test';
import { OrdersPage } from '../pages/OrdersPage';
import { generateUniquePhone } from '../helpers/test-helpers';
import { loginAndNavigateTo } from '../helpers/auth-helper';

test.describe('Orders Management', () => {
  let ordersPage: OrdersPage;
  const existingUserPhone = '+77011234567';

  test.beforeEach(async ({ page }) => {
    ordersPage = new OrdersPage(page);
    
    // Login and navigate to orders page
    await loginAndNavigateTo(page, '/orders', existingUserPhone);
    
    // Wait for orders page to be fully loaded
    await page.waitForSelector('h1:has-text("Заказы")', { timeout: 10000 });
  });

  test.describe('Orders List', () => {
    test('should display orders list', async ({ page }) => {
      await expect(page.locator('h1')).toHaveText('Заказы');
      await expect(page.locator('table')).toBeVisible();
    });

    test('should search orders', async ({ page }) => {
      await ordersPage.searchOrders('test');
      await page.waitForLoadState('networkidle');
      
      const searchInput = page.locator('input[placeholder="Поиск"]');
      await expect(searchInput).toHaveValue('test');
    });

    test('should filter by status', async ({ page }) => {
      await ordersPage.filterByStatus('paid');
      
      const button = page.locator('[data-testid="filter-paid"]');
      await expect(button).toHaveClass(/bg-primary/);
    });
  });

  test.describe('Create New Order', () => {
    test.beforeEach(async ({ page }) => {
      await ordersPage.gotoNewOrder();
    });

    test('should show multi-step form', async ({ page }) => {
      await expect(page.locator('[data-testid="step-indicator"]')).toBeVisible();
      await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
      
      // Check step indicators in the progress bar
      const stepLabels = page.locator('.text-xs.text-muted-foreground span');
      await expect(stepLabels).toHaveCount(4);
      await expect(stepLabels.nth(0)).toHaveText('Клиент');
      await expect(stepLabels.nth(1)).toHaveText('Товары');
    });

    test('should navigate through steps', async ({ page }) => {
      expect(await ordersPage.getCurrentStep()).toBe(1);
      
      await ordersPage.selectCustomer('Тестовый клиент');
      await ordersPage.goToNextStep();
      
      expect(await ordersPage.getCurrentStep()).toBe(2);
    });
  });

  test.describe('Order Management', () => {
    test('should change order status', async ({ page }) => {
      const firstRow = page.locator('tbody tr').first();
      const orderIdText = await firstRow.locator('td:first-child').textContent();
      const orderId = orderIdText?.replace('#', '') || '';
      
      if (orderId) {
        await ordersPage.changeOrderStatus(orderId, 'Оплачен');
        await expect(page.locator('[data-sonner-toast]')).toContainText('Статус заказа');
      }
    });

    test('should mark issue on order', async ({ page }) => {
      const firstRow = page.locator('tbody tr').first();
      const orderIdText = await firstRow.locator('td:first-child').textContent();
      const orderId = orderIdText?.replace('#', '') || '';
      
      if (orderId) {
        await ordersPage.markIssue(orderId, 'Получатель недоступен', 'Не отвечает на звонки');
        await expect(page.locator('[data-sonner-toast]')).toContainText('Проблема отмечена');
      }
    });
  });
});