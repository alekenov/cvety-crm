import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { OrdersPage } from '../pages/OrdersPage';
import { OrderDetailsPage } from '../pages/OrderDetailsPage';
import { APIHelper } from '../utils/api-helper';

test.describe('Order Tracking', () => {
  let loginPage: LoginPage;
  let ordersPage: OrdersPage;
  let orderDetailsPage: OrderDetailsPage;
  let apiHelper: APIHelper;
  let trackingToken: string;
  let orderId: string;

  test.beforeAll(async () => {
    // Create an order via API to get tracking token
    apiHelper = new APIHelper();
    await apiHelper.init();
    await apiHelper.login();
    
    const order = await apiHelper.createOrder({
      customer_phone: '+77019999999',
      customer_name: 'Тест Клиент',
      delivery_address: 'ул. Тестовая 123, кв. 45',
      delivery_date: '2024-12-28',
      delivery_time: '14:00-16:00',
      items: [
        {
          product_id: 1,
          quantity: 1,
          price: 25000
        }
      ],
      notes: 'Тестовый заказ для отслеживания'
    });
    
    orderId = order.id;
    trackingToken = order.tracking_token;
  });

  test.afterAll(async () => {
    await apiHelper.dispose();
  });

  test('should access tracking page without authentication', async ({ page }) => {
    // Navigate to tracking page
    await page.goto(`/tracking/${trackingToken}`);
    
    // Should not redirect to login
    await expect(page).not.toHaveURL(/\/login/);
    
    // Should see tracking page
    await expect(page.locator('h1')).toContainText('Отслеживание заказа');
  });

  test('should display order status on tracking page', async ({ page }) => {
    await page.goto(`/tracking/${trackingToken}`);
    
    // Should see order status
    await expect(page.locator('[data-testid="tracking-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="tracking-status"]')).toContainText('Новый');
    
    // Should see tracking token
    await expect(page.locator('[data-testid="tracking-token-display"]')).toContainText(trackingToken);
  });

  test('should mask sensitive customer data', async ({ page }) => {
    await page.goto(`/tracking/${trackingToken}`);
    
    // Phone should be masked (e.g., +7 (701) ***-**-99)
    const phoneElement = page.locator('[data-testid="tracking-customer-phone"]');
    const phoneText = await phoneElement.textContent();
    expect(phoneText).toMatch(/\*\*\*/);
    expect(phoneText).not.toContain('9999999'); // Full number should not be visible
    
    // Address should be partially masked
    const addressElement = page.locator('[data-testid="tracking-delivery-address"]');
    const addressText = await addressElement.textContent();
    expect(addressText).toContain('ул. Тестовая');
    expect(addressText).not.toContain('кв. 45'); // Apartment should be hidden
  });

  test('should show delivery progress', async ({ page }) => {
    await page.goto(`/tracking/${trackingToken}`);
    
    // Should see progress indicators
    await expect(page.locator('[data-testid="tracking-progress"]')).toBeVisible();
    
    // Check progress steps
    const steps = ['Создан', 'Оплачен', 'Собран', 'В доставке', 'Доставлен'];
    for (const step of steps) {
      await expect(page.locator('[data-testid="tracking-progress"]')).toContainText(step);
    }
  });

  test('should update status in real-time', async ({ page }) => {
    // Open tracking page
    await page.goto(`/tracking/${trackingToken}`);
    
    // In another context, update order status
    await apiHelper.updateOrderStatus(orderId, 'paid');
    
    // Wait a bit for update
    await page.waitForTimeout(2000);
    
    // Refresh or wait for auto-update
    await page.reload();
    
    // Should see updated status
    await expect(page.locator('[data-testid="tracking-status"]')).toContainText('Оплачен');
  });

  test('should show estimated delivery time', async ({ page }) => {
    await page.goto(`/tracking/${trackingToken}`);
    
    // Should see delivery date and time
    await expect(page.locator('[data-testid="tracking-delivery-date"]')).toContainText('28.12.2024');
    await expect(page.locator('[data-testid="tracking-delivery-time"]')).toContainText('14:00-16:00');
  });

  test('should handle invalid tracking token', async ({ page }) => {
    // Try invalid token
    await page.goto('/tracking/INVALID123');
    
    // Should show error message
    await expect(page.locator('[data-testid="tracking-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="tracking-error"]')).toContainText('Заказ не найден');
  });

  test('should handle completed order tracking', async ({ page }) => {
    // Update order to completed
    await apiHelper.updateOrderStatus(orderId, 'completed');
    
    // Open tracking page
    await page.goto(`/tracking/${trackingToken}`);
    
    // Should see completed status
    await expect(page.locator('[data-testid="tracking-status"]')).toContainText('Доставлен');
    
    // Should see success message
    await expect(page.locator('[data-testid="tracking-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="tracking-success"]')).toContainText('Заказ успешно доставлен');
  });

  test('should handle cancelled order tracking', async ({ page }) => {
    // Create another order for cancellation test
    const cancelOrder = await apiHelper.createOrder({
      customer_phone: '+77018888888',
      customer_name: 'Отмена Тест',
      delivery_address: 'ул. Отмены 1',
      delivery_date: '2024-12-29',
      delivery_time: '10:00-12:00',
      items: [{ product_id: 1, quantity: 1, price: 15000 }]
    });
    
    // Cancel the order
    await apiHelper.updateOrderStatus(cancelOrder.id, 'cancelled', 'Клиент отменил');
    
    // Open tracking page
    await page.goto(`/tracking/${cancelOrder.tracking_token}`);
    
    // Should see cancelled status
    await expect(page.locator('[data-testid="tracking-status"]')).toContainText('Отменен');
    
    // Should see cancellation reason
    await expect(page.locator('[data-testid="tracking-cancel-reason"]')).toContainText('Клиент отменил');
  });

  test('should be mobile responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Open tracking page
    await page.goto(`/tracking/${trackingToken}`);
    
    // All elements should be visible and properly sized
    await expect(page.locator('[data-testid="tracking-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="tracking-progress"]')).toBeVisible();
    
    // Check no horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375);
  });
});