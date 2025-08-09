import { Page } from '@playwright/test';
import { WarehousePage } from '../pages/WarehousePage';
import { CustomersPage } from '../pages/CustomersPage';
import { OrdersPage } from '../pages/OrdersPage';
import { generateUniquePhone } from './test-helpers';

/**
 * Business operation helpers for E2E tests
 * These functions represent common business workflows
 */

/**
 * Quick receive inventory with automatic price calculation
 */
export async function quickReceiveInventory(
  page: Page,
  variety: string,
  quantity: number,
  costUSD: number,
  usdRate: number = 475
) {
  const warehousePage = new WarehousePage(page);
  
  const retailPrice = Math.round(costUSD * usdRate * 2); // 100% markup
  
  // Проверяем видимость формы быстрого приёма
  const isFormVisible = await warehousePage.isQuickReceiveVisible();
  if (!isFormVisible) {
    // Разворачиваем форму
    await warehousePage.toggleQuickReceive();
    await page.waitForTimeout(500);
  }
  
  await warehousePage.quickReceiveItem({
    variety,
    height: 60,
    quantity,
    price: retailPrice,
    farm: 'Эквадор Ферма',
    supplier: 'Главный поставщик',
    currency: 'USD',
    rate: usdRate,
    cost: costUSD
  });
  
  return { variety, quantity, retailPrice };
}

/**
 * Create a new customer with standard data
 */
export async function createTestCustomer(page: Page, name?: string) {
  const customersPage = new CustomersPage(page);
  const uniquePhone = generateUniquePhone();
  
  const customerData = {
    name: name || `Клиент ${Date.now()}`,
    phone: uniquePhone,
    email: `test${Date.now()}@example.com`,
    address: 'ул. Абая 150, кв. 25',
    notes: 'Тестовый клиент'
  };
  
  await customersPage.addCustomer(customerData);
  
  return customerData;
}

/**
 * Create complete order with all steps
 */
export async function createCompleteOrder(
  page: Page,
  customerName: string,
  products: Array<{ name: string; quantity: number }>,
  deliveryDate?: Date
) {
  const ordersPage = new OrdersPage(page);
  
  const tomorrow = deliveryDate || new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  const orderData = {
    customerName,
    products,
    delivery: {
      method: 'delivery' as const,
      date: tomorrow,
      timeFrom: '14:00',
      timeTo: '16:00',
      address: 'ул. Абая 150, кв. 25',
      recipientName: customerName,
      recipientPhone: '+77011234567',
      comment: 'Позвонить за час до доставки'
    },
    paymentMethod: 'kaspi' as const
  };
  
  const orderId = await ordersPage.createCompleteOrder(orderData);
  
  return { orderId, orderData };
}

/**
 * Process order through complete workflow
 */
export async function processOrderWorkflow(
  page: Page,
  orderId: string,
  stages: Array<'paid' | 'assembled' | 'delivery' | 'completed'>
) {
  const ordersPage = new OrdersPage(page);
  
  for (const status of stages) {
    await ordersPage.changeOrderStatus(orderId, getStatusLabel(status));
    await page.waitForTimeout(500); // Wait for status update
  }
}

/**
 * Get status label in Russian
 */
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'new': 'Новый',
    'paid': 'Оплачен',
    'assembled': 'Собран',
    'delivery': 'Доставка',
    'self_pickup': 'Самовывоз',
    'completed': 'Завершен',
    'cancelled': 'Отменен',
    'issue': 'Проблема'
  };
  return labels[status] || status;
}

/**
 * Check inventory levels
 */
export async function checkInventoryLevel(
  page: Page,
  variety: string
): Promise<{ quantity: number; reserved: number; available: number }> {
  const warehousePage = new WarehousePage(page);
  await warehousePage.goto();
  await warehousePage.searchItems(variety);
  return await warehousePage.getItemStock(variety);
}

/**
 * Get order tracking token
 */
export async function getOrderTrackingToken(
  page: Page,
  orderId: string
): Promise<string> {
  // Navigate to order details
  await page.goto(`/orders/${orderId}`);
  
  // Get tracking token from page
  const trackingElement = await page.locator('[data-testid="tracking-token"]').textContent();
  const token = trackingElement?.match(/[A-Z0-9]{8}/)?.[0];
  
  if (!token) {
    // Fallback: get from table
    await page.goto('/orders');
    const row = page.locator('tbody tr').filter({ hasText: `#${orderId}` });
    const tokenText = await row.locator('[data-testid="tracking-link"]').getAttribute('href');
    return tokenText?.split('/').pop() || '';
  }
  
  return token;
}

/**
 * Simulate customer tracking experience
 */
export async function checkCustomerTracking(
  page: Page,
  trackingToken: string
) {
  // Open tracking page without authentication
  await page.goto(`/status/${trackingToken}`);
  
  // Wait for tracking info to load
  await page.waitForSelector('[data-testid="tracking-status"]', { timeout: 5000 });
  
  // Get tracking info
  const status = await page.locator('[data-testid="tracking-status"]').textContent();
  const deliveryTime = await page.locator('[data-testid="delivery-time"]').textContent();
  
  // Check that sensitive data is masked
  const phone = await page.locator('[data-testid="customer-phone"]').textContent();
  const isMasked = phone?.includes('****') || false;
  
  return {
    status,
    deliveryTime,
    isMasked
  };
}

/**
 * Complete business flow from inventory to delivery
 */
export async function completeBusinessFlow(page: Page) {
  // 1. Receive inventory
  const inventory = await quickReceiveInventory(page, 'Роза Ред Наоми', 100, 2.5);
  
  // 2. Create customer
  await page.goto('/customers');
  const customer = await createTestCustomer(page, 'Бизнес Клиент');
  
  // 3. Create order
  await page.goto('/orders/new');
  const { orderId } = await createCompleteOrder(
    page,
    customer.name,
    [{ name: inventory.variety, quantity: 25 }]
  );
  
  // 4. Process order workflow
  await page.goto('/orders');
  await processOrderWorkflow(page, orderId!, ['paid', 'assembled', 'delivery', 'completed']);
  
  // 5. Check inventory decreased
  const finalStock = await checkInventoryLevel(page, inventory.variety);
  
  return {
    inventory,
    customer,
    orderId,
    finalStock
  };
}

/**
 * Helper to wait for order to appear in list
 */
export async function waitForOrderInList(page: Page, orderId: string) {
  await page.goto('/orders');
  await page.waitForSelector(`tbody tr:has-text("#${orderId}")`, { timeout: 10000 });
}

/**
 * Helper to verify order details
 */
export async function verifyOrderDetails(
  page: Page,
  orderId: string,
  expectedDetails: {
    status?: string;
    customer?: string;
    total?: number;
  }
) {
  const row = page.locator('tbody tr').filter({ hasText: `#${orderId}` });
  
  if (expectedDetails.status) {
    const statusBadge = row.locator('[data-testid="order-status"]');
    await statusBadge.waitFor({ state: 'visible' });
    const statusText = await statusBadge.textContent();
    if (!statusText?.includes(expectedDetails.status)) {
      throw new Error(`Expected status ${expectedDetails.status}, got ${statusText}`);
    }
  }
  
  if (expectedDetails.customer) {
    const customerCell = row.locator('[data-testid="order-customer"]');
    const customerText = await customerCell.textContent();
    if (!customerText?.includes(expectedDetails.customer)) {
      throw new Error(`Expected customer ${expectedDetails.customer}, got ${customerText}`);
    }
  }
  
  if (expectedDetails.total) {
    const totalCell = row.locator('[data-testid="order-total"]');
    const totalText = await totalCell.textContent();
    if (!totalText?.includes(expectedDetails.total.toString())) {
      throw new Error(`Expected total ${expectedDetails.total}, got ${totalText}`);
    }
  }
}