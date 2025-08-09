import { Page, expect } from '@playwright/test';
import { testData, getTomorrowDate } from '../fixtures/test-data';

export class OrdersPage {
  constructor(private page: Page) {}

  // Locators
  private newOrderButton = 'button:has-text("Новый заказ")';
  private ordersList = '[data-testid="orders-list"]';
  private orderCard = '[data-testid^="order-card-"]';
  private searchInput = 'input[placeholder*="Поиск"]';
  private statusFilter = 'select[name="status"]';
  
  // Order form locators
  private customerPhoneInput = 'input[name="customer_phone"]';
  private customerNameInput = 'input[name="customer_name"]';
  private deliveryAddressInput = 'textarea[name="delivery_address"]';
  private deliveryDateInput = 'input[type="date"]';
  private deliveryTimeSelect = 'select[name="delivery_time"]';
  private notesInput = 'textarea[name="notes"]';
  private addProductButton = 'button:has-text("Добавить товар")';
  private productSearchInput = 'input[placeholder*="Поиск товара"]';
  private productItem = '[data-testid="product-item"]';
  private quantityInput = 'input[name="quantity"]';
  private submitOrderButton = 'button[type="submit"]:has-text("Создать заказ")';
  private cancelButton = 'button:has-text("Отмена")';

  /**
   * Navigate to orders page
   */
  async goto() {
    await this.page.goto('/orders');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Click new order button
   */
  async clickNewOrder() {
    await this.page.click(this.newOrderButton);
    await this.page.waitForSelector(this.customerPhoneInput, { timeout: 5000 });
  }

  /**
   * Fill customer information
   */
  async fillCustomerInfo(customer = testData.customers.regular) {
    await this.page.fill(this.customerPhoneInput, customer.phone);
    await this.page.fill(this.customerNameInput, customer.name);
    await this.page.fill(this.deliveryAddressInput, customer.address);
  }

  /**
   * Set delivery date and time
   */
  async setDeliveryDateTime(date?: string, time: string = '14:00-16:00') {
    const deliveryDate = date || getTomorrowDate();
    await this.page.fill(this.deliveryDateInput, deliveryDate);
    await this.page.selectOption(this.deliveryTimeSelect, time);
  }

  /**
   * Add product to order
   */
  async addProduct(productName: string, quantity: number = 1) {
    await this.page.click(this.addProductButton);
    
    // Search for product
    await this.page.fill(this.productSearchInput, productName);
    await this.page.waitForSelector(this.productItem, { timeout: 5000 });
    
    // Select first matching product
    await this.page.click(`${this.productItem}:first-child`);
    
    // Set quantity
    await this.page.fill(this.quantityInput, quantity.toString());
  }

  /**
   * Fill order notes
   */
  async fillNotes(notes: string) {
    await this.page.fill(this.notesInput, notes);
  }

  /**
   * Submit order form
   */
  async submitOrder() {
    await this.page.click(this.submitOrderButton);
    
    // Wait for success message or redirect
    await Promise.race([
      this.page.waitForURL(/\/orders\/\d+/, { timeout: 10000 }),
      this.page.waitForSelector('[role="alert"].success', { timeout: 5000 })
    ]);
  }

  /**
   * Create a complete order
   */
  async createOrder(orderData?: {
    customer?: any;
    products?: Array<{ name: string; quantity: number }>;
    notes?: string;
    deliveryDate?: string;
    deliveryTime?: string;
  }) {
    const data = {
      customer: orderData?.customer || testData.customers.regular,
      products: orderData?.products || [{ name: '101 роза', quantity: 1 }],
      notes: orderData?.notes || testData.orders.regular.notes,
      deliveryDate: orderData?.deliveryDate,
      deliveryTime: orderData?.deliveryTime || '14:00-16:00'
    };

    await this.clickNewOrder();
    await this.fillCustomerInfo(data.customer);
    await this.setDeliveryDateTime(data.deliveryDate, data.deliveryTime);
    
    for (const product of data.products) {
      await this.addProduct(product.name, product.quantity);
    }
    
    await this.fillNotes(data.notes);
    await this.submitOrder();
    
    // Return order ID from URL
    const url = this.page.url();
    const match = url.match(/\/orders\/(\d+)/);
    return match ? match[1] : null;
  }

  /**
   * Search for order
   */
  async searchOrder(query: string) {
    await this.page.fill(this.searchInput, query);
    await this.page.press(this.searchInput, 'Enter');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Filter orders by status
   */
  async filterByStatus(status: string) {
    await this.page.selectOption(this.statusFilter, status);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Open order details
   */
  async openOrder(orderId: string) {
    await this.page.click(`[data-testid="order-card-${orderId}"]`);
    await this.page.waitForURL(`**/orders/${orderId}`);
  }

  /**
   * Get order count on current page
   */
  async getOrderCount(): Promise<number> {
    const orders = await this.page.locator(this.orderCard).all();
    return orders.length;
  }

  /**
   * Check if order exists in list
   */
  async hasOrder(orderId: string): Promise<boolean> {
    const order = this.page.locator(`[data-testid="order-card-${orderId}"]`);
    return await order.isVisible();
  }
}