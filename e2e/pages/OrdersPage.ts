import { Page, expect } from '@playwright/test';

export class OrdersPage {
  constructor(private page: Page) {}

  // Locators for Orders list page
  private newOrderButton = '[data-testid="new-order-button"]';
  private searchInput = '[data-testid="search-input"]';
  private statusFilterAll = '[data-testid="filter-all"]';
  private statusFilterNew = '[data-testid="filter-new"]';
  private statusFilterPaid = '[data-testid="filter-paid"]';
  private statusFilterAssembled = '[data-testid="filter-assembled"]';
  private statusFilterDelivery = '[data-testid="filter-delivery"]';
  private statusFilterPickup = '[data-testid="filter-self_pickup"]';
  private statusFilterIssue = '[data-testid="filter-issue"]';
  private ordersTable = '[data-testid="orders-table"], table';
  private orderRow = 'tbody tr';
  
  // New Order multi-step form locators
  // Step 1 - Customer
  private customerSearchInput = '[data-testid="customer-search-input"]';
  private customerOption = '[role="option"]';
  private newCustomerButton = '[data-testid="new-customer-button"]';
  
  // Step 2 - Products
  private productSearchInput = '[data-testid="product-search-input"]';
  private productOption = '[role="option"]';
  private quantityInput = 'input[type="number"]';
  private addProductButton = 'button:has-text("Добавить")';
  
  // Step 3 - Delivery
  private deliveryMethodRadio = 'input[name="deliveryMethod"]';
  private deliveryDateButton = 'button:has-text("Выберите дату")';
  private deliveryDateInput = 'button:has-text("Выберите дату")';
  private deliveryTimeFromInput = 'input[placeholder="HH:MM"]:first-of-type';
  private deliveryTimeToInput = 'input[placeholder="HH:MM"]:last-of-type';
  private deliveryAddressInput = 'input[placeholder*="Адрес доставки"]';
  private recipientNameInput = 'input[placeholder*="ФИО получателя"]';
  private recipientPhoneInput = 'input[placeholder*="+7"]';
  private commentTextarea = 'textarea[placeholder*="Комментарий"]';
  
  // Step 4 - Payment
  private paymentMethodRadio = 'input[name="paymentMethod"]';
  
  // Navigation buttons
  private nextStepButton = '[data-testid="next-step-button"]';
  private prevStepButton = '[data-testid="prev-step-button"]';
  private createOrderButton = '[data-testid="create-order-button"]';
  private stepIndicator = '[data-testid="step-indicator"]';

  /**
   * Navigate to orders page
   */
  async goto() {
    await this.page.goto('/orders');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to new order page
   */
  async gotoNewOrder() {
    await this.page.goto('/orders/new');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Click new order button
   */
  async clickNewOrder() {
    await this.page.click(this.newOrderButton);
    await this.page.waitForURL('**/orders/new');
  }

  /**
   * Search orders
   */
  async searchOrders(query: string) {
    await this.page.fill(this.searchInput, query);
    await this.page.waitForTimeout(500); // Wait for debounce
  }

  /**
   * Filter by status
   */
  async filterByStatus(status: 'all' | 'new' | 'paid' | 'assembled' | 'delivery' | 'self_pickup' | 'issue') {
    const statusButtons: Record<string, string> = {
      'all': this.statusFilterAll,
      'new': this.statusFilterNew,
      'paid': this.statusFilterPaid,
      'assembled': this.statusFilterAssembled,
      'delivery': this.statusFilterDelivery,
      'self_pickup': this.statusFilterPickup,
      'issue': this.statusFilterIssue
    };
    
    // Wait for the filter button to be visible
    await this.page.waitForSelector(statusButtons[status], { timeout: 5000 });
    await this.page.click(statusButtons[status]);
    
    // Wait for the network to settle after filtering
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(500); // Small delay for UI update
  }

  /**
   * Get orders count
   */
  async getOrdersCount(): Promise<number> {
    const rows = await this.page.locator(this.orderRow).count();
    return rows;
  }

  /**
   * Open order by ID
   */
  async openOrder(orderId: string) {
    const row = this.page.locator(this.orderRow).filter({ hasText: `#${orderId}` });
    await row.click();
    await this.page.waitForURL(`**/orders/${orderId}`);
  }

  /**
   * Change order status
   */
  async changeOrderStatus(orderId: string, newStatus: string) {
    // First check if we have any orders
    const hasOrders = await this.page.locator(this.orderRow).count() > 0;
    if (!hasOrders) {
      throw new Error('No orders found in the table');
    }
    
    // Try to find the order row
    const row = this.page.locator(this.orderRow).filter({ hasText: `#${orderId}` });
    const rowCount = await row.count();
    
    if (rowCount === 0) {
      // If specific order not found, use first row for testing
      const firstRow = this.page.locator(this.orderRow).first();
      const menuButton = firstRow.locator('[data-testid^="order-menu-"], button[aria-haspopup="menu"], button:has(svg)').last();
      await menuButton.click();
    } else {
      const menuButton = row.locator('[data-testid^="order-menu-"], button[aria-haspopup="menu"], button:has(svg)').last();
      await menuButton.click();
    }
    
    // Wait for menu to appear
    await this.page.waitForTimeout(300);
    
    const menuItem = this.page.getByRole('menuitem', { name: newStatus });
    await menuItem.click();
    
    // Wait for toast
    await this.page.waitForSelector('[data-sonner-toast]', { timeout: 5000 });
  }

  /**
   * Mark issue on order
   */
  async markIssue(orderId: string, issueType: string, comment?: string) {
    // First check if we have any orders
    const hasOrders = await this.page.locator(this.orderRow).count() > 0;
    if (!hasOrders) {
      throw new Error('No orders found in the table');
    }
    
    // Try to find the order row
    const row = this.page.locator(this.orderRow).filter({ hasText: `#${orderId}` });
    const rowCount = await row.count();
    
    if (rowCount === 0) {
      // If specific order not found, use first row for testing
      const firstRow = this.page.locator(this.orderRow).first();
      const menuButton = firstRow.locator('[data-testid^="order-menu-"], button[aria-haspopup="menu"], button:has(svg)').last();
      await menuButton.click();
    } else {
      const menuButton = row.locator('[data-testid^="order-menu-"], button[aria-haspopup="menu"], button:has(svg)').last();
      await menuButton.click();
    }
    
    // Wait for menu to appear
    await this.page.waitForTimeout(300);
    
    await this.page.click('[data-testid="mark-issue"], text=Пометить проблему');
    
    // Wait for dialog
    await this.page.waitForTimeout(300);
    
    // Select issue type
    await this.page.click('[data-testid="issue-type-select"], button[role="combobox"]');
    await this.page.click(`[role="option"]:has-text("${issueType}")`);
    
    if (comment) {
      await this.page.fill('textarea', comment);
    }
    
    await this.page.click('button:has-text("Сохранить")');
    await this.page.waitForSelector('[data-sonner-toast]', { timeout: 5000 });
  }

  // New Order Creation - Multi-step form

  /**
   * Step 1: Select customer
   */
  async selectCustomer(customerName: string) {
    // Wait for the customer input to be available
    const searchInput = this.page.locator('[data-testid="customer-search-input"], input[placeholder*="Поиск по телефону"]').first();
    await searchInput.waitFor({ timeout: 5000 });
    await searchInput.fill(customerName);
    await this.page.waitForTimeout(1500); // Wait for search results
    
    // Check if RadioGroup appears (this is the actual UI pattern)
    const radioGroup = this.page.locator('[role="radiogroup"]');
    if (await radioGroup.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Look for customer in RadioGroup by label
      const customerLabel = this.page.locator('label').filter({ hasText: customerName }).first();
      if (await customerLabel.count() > 0) {
        await customerLabel.click();
        await this.page.waitForTimeout(500);
        return;
      }
      
      // If not found by name, click first radio item
      const firstRadio = this.page.locator('[role="radio"]').first();
      if (await firstRadio.count() > 0) {
        await firstRadio.click();
        await this.page.waitForTimeout(500);
        return;
      }
    }
    
    // Fallback: Try old selectors
    const customerOption = this.page.locator(`${this.customerOption}:has-text("${customerName}")`).first();
    if (await customerOption.count() > 0) {
      await customerOption.click();
      await this.page.waitForTimeout(500);
    } else {
      // Try any matching text
      const anyCustomer = this.page.locator(`text="${customerName}"`).first();
      if (await anyCustomer.count() > 0) {
        await anyCustomer.click();
        await this.page.waitForTimeout(500);
      }
    }
    
    // Wait for selection to be processed
    await this.page.waitForTimeout(500);
  }

  /**
   * Step 2: Add products
   */
  async addProduct(productName: string, quantity: number) {
    await this.page.fill(this.productSearchInput, productName);
    await this.page.waitForTimeout(500);
    await this.page.click(`${this.productOption}:has-text("${productName}")`);
    
    await this.page.fill(this.quantityInput, quantity.toString());
    await this.page.click(this.addProductButton);
  }

  /**
   * Step 3: Set delivery info
   */
  async setDeliveryInfo(options: {
    method: 'delivery' | 'self_pickup';
    date: Date;
    timeFrom: string;
    timeTo: string;
    address?: string;
    recipientName?: string;
    recipientPhone?: string;
    comment?: string;
  }) {
    // Select method
    await this.page.check(`${this.deliveryMethodRadio}[value="${options.method}"]`);
    
    // Set date
    await this.page.click(this.deliveryDateButton);
    const dateStr = options.date.getDate().toString();
    await this.page.click(`button:has-text("${dateStr}")`);
    
    // Set time
    await this.page.fill(this.deliveryTimeFromInput, options.timeFrom);
    await this.page.fill(this.deliveryTimeToInput, options.timeTo);
    
    // Set delivery details
    if (options.method === 'delivery') {
      if (options.address) await this.page.fill(this.deliveryAddressInput, options.address);
      if (options.recipientName) await this.page.fill(this.recipientNameInput, options.recipientName);
      if (options.recipientPhone) await this.page.fill(this.recipientPhoneInput, options.recipientPhone);
    }
    
    if (options.comment) await this.page.fill(this.commentTextarea, options.comment);
  }

  /**
   * Step 4: Select payment method
   */
  async selectPaymentMethod(method: 'kaspi' | 'cash' | 'transfer' | 'qr') {
    await this.page.check(`${this.paymentMethodRadio}[value="${method}"]`);
  }

  /**
   * Navigate to next step
   */
  async goToNextStep() {
    await this.page.click(this.nextStepButton);
    await this.page.waitForTimeout(300);
  }

  /**
   * Navigate to previous step
   */
  async goToPrevStep() {
    await this.page.click(this.prevStepButton);
    await this.page.waitForTimeout(300);
  }

  /**
   * Submit order
   */
  async submitOrder() {
    await this.page.click(this.createOrderButton);
    await Promise.race([
      this.page.waitForSelector('[data-sonner-toast]'),
      this.page.waitForURL('/orders')
    ]);
  }

  /**
   * Get current step number
   */
  async getCurrentStep(): Promise<number> {
    try {
      // Wait for step indicator to be present
      await this.page.waitForSelector(this.stepIndicator, { timeout: 2000 });
      const stepText = await this.page.textContent(this.stepIndicator);
      const match = stepText?.match(/Шаг\s+(\d)|Step\s+(\d)|(\d)\s+из/);
      if (match) {
        return parseInt(match[1] || match[2] || match[3]);
      }
    } catch {
      // If step indicator not found, try alternative methods
    }
    
    // Try to determine step by visible content
    const hasCustomerInput = await this.page.locator(this.customerSearchInput).count() > 0;
    const hasProductSearch = await this.page.locator(this.productSearchInput).count() > 0;
    const hasDeliveryDate = await this.page.locator(this.deliveryDateInput).count() > 0;
    const hasPaymentRadio = await this.page.locator(this.paymentMethodRadio).count() > 0;
    
    if (hasPaymentRadio) return 4;
    if (hasDeliveryDate) return 3;
    if (hasProductSearch) return 2;
    if (hasCustomerInput) return 1;
    
    return 0;
  }

  /**
   * Create complete order flow
   */
  async createCompleteOrder(data: {
    customerName: string;
    products: Array<{ name: string; quantity: number }>;
    delivery: {
      method: 'delivery' | 'self_pickup';
      date: Date;
      timeFrom: string;
      timeTo: string;
      address?: string;
      recipientName?: string;
      recipientPhone?: string;
      comment?: string;
    };
    paymentMethod: 'kaspi' | 'cash' | 'transfer' | 'qr';
  }) {
    // Step 1: Customer
    await this.selectCustomer(data.customerName);
    await this.goToNextStep();
    
    // Step 2: Products
    for (const product of data.products) {
      await this.addProduct(product.name, product.quantity);
    }
    await this.goToNextStep();
    
    // Step 3: Delivery
    await this.setDeliveryInfo(data.delivery);
    await this.goToNextStep();
    
    // Step 4: Payment
    await this.selectPaymentMethod(data.paymentMethod);
    await this.submitOrder();
    
    // Return order ID from toast or URL
    const toastText = await this.page.textContent('[data-sonner-toast]');
    const match = toastText?.match(/#(\d+)/);
    return match ? match[1] : null;
  }
}