import { Page, expect } from '@playwright/test';

export class OrderDetailsPage {
  constructor(private page: Page) {}

  // Locators
  private orderStatus = '[data-testid="order-status"]';
  private customerInfo = '[data-testid="customer-info"]';
  private deliveryInfo = '[data-testid="delivery-info"]';
  private orderItems = '[data-testid="order-items"]';
  private totalAmount = '[data-testid="total-amount"]';
  private trackingToken = '[data-testid="tracking-token"]';
  
  // Action buttons
  private markPaidButton = 'button:has-text("Отметить оплаченным")';
  private markAssembledButton = 'button:has-text("Собран")';
  private startDeliveryButton = 'button:has-text("Начать доставку")';
  private completeOrderButton = 'button:has-text("Завершить заказ")';
  private cancelOrderButton = 'button:has-text("Отменить заказ")';
  private assignFloristButton = 'button:has-text("Назначить флориста")';
  private assignCourierButton = 'button:has-text("Назначить курьера")';
  
  // Modal/dialog elements
  private confirmButton = 'button:has-text("Подтвердить")';
  private cancelButton = 'button:has-text("Отмена")';
  private statusSelect = 'select[name="status"]';
  private floristSelect = 'select[name="florist_id"]';
  private courierSelect = 'select[name="courier_id"]';
  private issueNotesTextarea = 'textarea[name="issue_notes"]';

  /**
   * Navigate to order details
   */
  async goto(orderId: string) {
    await this.page.goto(`/orders/${orderId}`);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get current order status
   */
  async getStatus(): Promise<string> {
    return await this.page.locator(this.orderStatus).textContent() || '';
  }

  /**
   * Check if status matches expected
   */
  async hasStatus(expectedStatus: string) {
    await expect(this.page.locator(this.orderStatus)).toContainText(expectedStatus);
  }

  /**
   * Get tracking token
   */
  async getTrackingToken(): Promise<string> {
    return await this.page.locator(this.trackingToken).textContent() || '';
  }

  /**
   * Get total amount
   */
  async getTotalAmount(): Promise<string> {
    return await this.page.locator(this.totalAmount).textContent() || '';
  }

  /**
   * Mark order as paid
   */
  async markAsPaid() {
    await this.page.click(this.markPaidButton);
    await this.page.click(this.confirmButton);
    await this.page.waitForLoadState('networkidle');
    await this.hasStatus('Оплачен');
  }

  /**
   * Mark order as assembled
   */
  async markAsAssembled() {
    await this.page.click(this.markAssembledButton);
    await this.page.click(this.confirmButton);
    await this.page.waitForLoadState('networkidle');
    await this.hasStatus('Собран');
  }

  /**
   * Start delivery
   */
  async startDelivery() {
    await this.page.click(this.startDeliveryButton);
    await this.page.click(this.confirmButton);
    await this.page.waitForLoadState('networkidle');
    await this.hasStatus('Доставляется');
  }

  /**
   * Complete order
   */
  async completeOrder() {
    await this.page.click(this.completeOrderButton);
    await this.page.click(this.confirmButton);
    await this.page.waitForLoadState('networkidle');
    await this.hasStatus('Завершен');
  }

  /**
   * Cancel order with reason
   */
  async cancelOrder(reason: string = 'Клиент отменил заказ') {
    await this.page.click(this.cancelOrderButton);
    await this.page.fill(this.issueNotesTextarea, reason);
    await this.page.click(this.confirmButton);
    await this.page.waitForLoadState('networkidle');
    await this.hasStatus('Отменен');
  }

  /**
   * Assign florist to order
   */
  async assignFlorist(floristId: string = '1') {
    await this.page.click(this.assignFloristButton);
    await this.page.selectOption(this.floristSelect, floristId);
    await this.page.click(this.confirmButton);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Assign courier to order
   */
  async assignCourier(courierId: string = '1') {
    await this.page.click(this.assignCourierButton);
    await this.page.selectOption(this.courierSelect, courierId);
    await this.page.click(this.confirmButton);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Change order status directly
   */
  async changeStatus(newStatus: string) {
    await this.page.selectOption(this.statusSelect, newStatus);
    await this.page.click(this.confirmButton);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Complete full order workflow
   */
  async completeFullWorkflow() {
    // Get current status
    const currentStatus = await this.getStatus();
    
    // Progress through statuses
    if (currentStatus.includes('Новый')) {
      await this.markAsPaid();
    }
    
    if ((await this.getStatus()).includes('Оплачен')) {
      await this.assignFlorist();
      await this.markAsAssembled();
    }
    
    if ((await this.getStatus()).includes('Собран')) {
      await this.assignCourier();
      await this.startDelivery();
    }
    
    if ((await this.getStatus()).includes('Доставляется')) {
      await this.completeOrder();
    }
  }

  /**
   * Check if customer info contains expected text
   */
  async hasCustomerInfo(expectedText: string) {
    await expect(this.page.locator(this.customerInfo)).toContainText(expectedText);
  }

  /**
   * Check if delivery info contains expected text
   */
  async hasDeliveryInfo(expectedText: string) {
    await expect(this.page.locator(this.deliveryInfo)).toContainText(expectedText);
  }

  /**
   * Get order items count
   */
  async getItemsCount(): Promise<number> {
    const items = await this.page.locator(`${this.orderItems} [data-testid="order-item"]`).all();
    return items.length;
  }

  /**
   * Check if specific product is in order
   */
  async hasProduct(productName: string) {
    await expect(this.page.locator(this.orderItems)).toContainText(productName);
  }
}