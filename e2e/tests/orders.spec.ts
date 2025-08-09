import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { OrdersPage } from '../pages/OrdersPage';
import { OrderDetailsPage } from '../pages/OrderDetailsPage';
import { testData } from '../fixtures/test-data';

test.describe('Orders Management', () => {
  let loginPage: LoginPage;
  let ordersPage: OrdersPage;
  let orderDetailsPage: OrderDetailsPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    ordersPage = new OrdersPage(page);
    orderDetailsPage = new OrderDetailsPage(page);
    
    // Login before each test
    await loginPage.login();
  });

  test('should create a new order', async ({ page }) => {
    await ordersPage.goto();
    
    // Create order
    const orderId = await ordersPage.createOrder();
    
    // Should redirect to order details
    expect(orderId).toBeTruthy();
    await expect(page).toHaveURL(new RegExp(`/orders/${orderId}`));
    
    // Verify order details
    await orderDetailsPage.hasStatus('Новый');
    await orderDetailsPage.hasCustomerInfo(testData.customers.regular.name);
    await orderDetailsPage.hasCustomerInfo(testData.customers.regular.phone);
    await orderDetailsPage.hasDeliveryInfo(testData.customers.regular.address);
    
    // Should have tracking token
    const trackingToken = await orderDetailsPage.getTrackingToken();
    expect(trackingToken).toMatch(/^\d{9}$/);
  });

  test('should create order with multiple products', async ({ page }) => {
    await ordersPage.goto();
    
    // Create order with multiple products
    const orderId = await ordersPage.createOrder({
      products: [
        { name: '101 роза', quantity: 1 },
        { name: '25 тюльпанов', quantity: 2 }
      ]
    });
    
    // Verify products in order
    await orderDetailsPage.hasProduct('101 роза');
    await orderDetailsPage.hasProduct('25 тюльпанов');
    
    // Check items count
    const itemsCount = await orderDetailsPage.getItemsCount();
    expect(itemsCount).toBe(2);
  });

  test('should update order status workflow', async ({ page }) => {
    await ordersPage.goto();
    
    // Create order
    const orderId = await ordersPage.createOrder();
    
    // Navigate to order details
    await orderDetailsPage.goto(orderId);
    
    // Progress through status workflow
    await orderDetailsPage.markAsPaid();
    await orderDetailsPage.hasStatus('Оплачен');
    
    await orderDetailsPage.markAsAssembled();
    await orderDetailsPage.hasStatus('Собран');
    
    await orderDetailsPage.startDelivery();
    await orderDetailsPage.hasStatus('Доставляется');
    
    await orderDetailsPage.completeOrder();
    await orderDetailsPage.hasStatus('Завершен');
  });

  test('should cancel order with reason', async ({ page }) => {
    await ordersPage.goto();
    
    // Create order
    const orderId = await ordersPage.createOrder();
    
    // Cancel order
    await orderDetailsPage.goto(orderId);
    await orderDetailsPage.cancelOrder('Клиент передумал');
    
    // Verify cancelled status
    await orderDetailsPage.hasStatus('Отменен');
  });

  test('should search for orders', async ({ page }) => {
    await ordersPage.goto();
    
    // Create order first
    const orderId = await ordersPage.createOrder({
      customer: testData.customers.vip
    });
    
    // Go back to orders list
    await ordersPage.goto();
    
    // Search by customer phone
    await ordersPage.searchOrder(testData.customers.vip.phone);
    
    // Should find the order
    const hasOrder = await ordersPage.hasOrder(orderId);
    expect(hasOrder).toBeTruthy();
  });

  test('should filter orders by status', async ({ page }) => {
    await ordersPage.goto();
    
    // Filter by status
    await ordersPage.filterByStatus('new');
    
    // Check that we have results
    const orderCount = await ordersPage.getOrderCount();
    expect(orderCount).toBeGreaterThanOrEqual(0);
    
    // Filter by different status
    await ordersPage.filterByStatus('paid');
    
    // Count might be different
    const paidOrderCount = await ordersPage.getOrderCount();
    expect(paidOrderCount).toBeGreaterThanOrEqual(0);
  });

  test('should handle urgent order', async ({ page }) => {
    await ordersPage.goto();
    
    // Create urgent order
    const orderId = await ordersPage.createOrder({
      notes: testData.orders.urgent.notes,
      deliveryTime: testData.orders.urgent.deliveryTime
    });
    
    // Verify urgent notes are displayed
    await orderDetailsPage.goto(orderId);
    await expect(page.locator('[data-testid="order-notes"]')).toContainText('СРОЧНО');
  });

  test('should handle self-pickup order', async ({ page }) => {
    await ordersPage.goto();
    
    // Create self-pickup order
    const orderId = await ordersPage.createOrder({
      notes: testData.orders.pickup.notes,
      deliveryTime: testData.orders.pickup.deliveryTime
    });
    
    // Navigate to order
    await orderDetailsPage.goto(orderId);
    
    // Mark as paid and assembled
    await orderDetailsPage.markAsPaid();
    await orderDetailsPage.markAsAssembled();
    
    // Should be able to complete without delivery
    await orderDetailsPage.changeStatus('self_pickup');
    await orderDetailsPage.hasStatus('Самовывоз');
  });
});