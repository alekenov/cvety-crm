import { Page, expect } from '@playwright/test';
import { waitForTableData, waitForToast, safeFillInput, waitForDialog, waitForLoadingComplete } from '../helpers/wait-helpers';

export class CustomersPage {
  constructor(private page: Page) {}

  // Locators
  private addCustomerButton = 'button:has-text("Добавить клиента")';
  private searchInput = 'input[placeholder*="Поиск"]';
  private customersTable = 'table';
  private customerRow = 'tbody tr';
  
  // Add customer dialog locators
  private addCustomerDialog = '[role="dialog"]:has-text("Новый клиент")';
  private nameInput = 'input#name';
  private phoneInput = 'input#phone';
  private emailInput = 'input#email';
  private addressInput = 'input#address';
  private notesInput = 'input#notes';
  private submitButton = 'button:has-text("Добавить"):not(:has-text("клиента"))';
  private cancelButton = 'button:has-text("Отмена")';
  
  // Customer details page locators
  private customerDetailsName = 'h1';
  private customerDetailsPhone = '.text-muted-foreground:has-text("+7")';
  private createOrderButton = 'button:has-text("Создать заказ")';
  private editCustomerButton = 'button:has-text("Редактировать")';
  private ordersTab = 'button[role="tab"]:has-text("Заказы")';
  private addressesTab = 'button[role="tab"]:has-text("Адреса")';
  private importantDatesTab = 'button[role="tab"]:has-text("Важные даты")';

  /**
   * Navigate to customers page
   */
  async goto() {
    await this.page.goto('/customers');
    await this.page.waitForLoadState('networkidle');
    await waitForTableData(this.page, this.customersTable, 0); // Wait for table even if empty
  }

  /**
   * Search customers
   */
  async searchCustomers(query: string) {
    await safeFillInput(this.page, this.searchInput, query);
    await this.page.waitForTimeout(500); // Wait for debounce
    await waitForLoadingComplete(this.page);
  }

  /**
   * Open add customer dialog
   */
  async openAddCustomerDialog() {
    await this.page.waitForSelector(this.addCustomerButton, { timeout: 5000 });
    await this.page.click(this.addCustomerButton);
    await waitForDialog(this.page, 'Новый клиент');
  }

  /**
   * Add new customer
   */
  async addCustomer(data: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
    notes?: string;
  }) {
    await this.openAddCustomerDialog();
    
    // Fill required fields
    await safeFillInput(this.page, this.nameInput, data.name);
    await safeFillInput(this.page, this.phoneInput, data.phone);
    
    // Fill optional fields
    if (data.email) {
      await safeFillInput(this.page, this.emailInput, data.email);
    }
    if (data.address) {
      await safeFillInput(this.page, this.addressInput, data.address);
    }
    if (data.notes) {
      await safeFillInput(this.page, this.notesInput, data.notes);
    }
    
    // Submit
    await this.page.click(this.submitButton);
    
    // Wait for dialog to close and toast
    await this.page.waitForSelector(this.addCustomerDialog, { state: 'hidden' });
    await waitForToast(this.page);
  }

  /**
   * Get customers count
   */
  async getCustomersCount(): Promise<number> {
    const rows = await this.page.locator(this.customerRow).count();
    return rows;
  }

  /**
   * Open customer details
   */
  async openCustomerDetails(customerName: string) {
    const row = this.page.locator(this.customerRow).filter({ hasText: customerName });
    const rowCount = await row.count();
    
    if (rowCount === 0) {
      throw new Error(`Customer "${customerName}" not found`);
    }
    
    await row.first().click();
    await this.page.waitForURL('**/customers/*', { timeout: 5000 });
  }

  /**
   * Get customer info from list
   */
  async getCustomerInfo(customerName: string): Promise<{
    name: string;
    phone: string;
    ordersCount: number;
    totalSpent: string;
  } | null> {
    const row = this.page.locator(this.customerRow).filter({ hasText: customerName });
    
    if (await row.count() === 0) {
      return null;
    }
    
    const name = await row.locator('td:nth-child(1)').textContent() || '';
    const phone = await row.locator('td:nth-child(2)').textContent() || '';
    const ordersText = await row.locator('td:nth-child(3)').textContent() || '';
    const totalText = await row.locator('td:nth-child(4)').textContent() || '';
    
    const ordersMatch = ordersText.match(/(\d+)/);
    const ordersCount = ordersMatch ? parseInt(ordersMatch[1]) : 0;
    
    return {
      name: name.trim(),
      phone: phone.trim(),
      ordersCount,
      totalSpent: totalText.trim()
    };
  }

  /**
   * Create order for customer
   */
  async createOrderForCustomer(customerName: string) {
    await this.openCustomerDetails(customerName);
    await this.page.click(this.createOrderButton);
    await this.page.waitForURL('**/orders/new?customerId=*');
  }

  /**
   * Edit customer
   */
  async editCustomer(updates: {
    name?: string;
    phone?: string;
    email?: string;
    notes?: string;
  }) {
    await this.page.click(this.editCustomerButton);
    
    // Wait for edit form
    await this.page.waitForSelector(this.nameInput);
    
    // Update fields
    if (updates.name) {
      await safeFillInput(this.page, this.nameInput, updates.name);
    }
    if (updates.phone) {
      await safeFillInput(this.page, this.phoneInput, updates.phone);
    }
    if (updates.email) {
      await safeFillInput(this.page, this.emailInput, updates.email);
    }
    if (updates.notes) {
      await safeFillInput(this.page, this.notesInput, updates.notes);
    }
    
    // Save
    await this.page.click('button:has-text("Сохранить")');
    await waitForToast(this.page);
  }

  /**
   * Add address for customer
   */
  async addAddress(address: string, label?: string) {
    await this.page.click(this.addressesTab);
    await this.page.click('button:has-text("Добавить адрес")');
    
    // Fill address form
    await this.page.fill('input[placeholder*="Адрес"]', address);
    if (label) {
      await this.page.fill('input[placeholder*="Название"]', label);
    }
    
    await this.page.click('button:has-text("Добавить")');
    await waitForToast(this.page);
  }

  /**
   * Add important date
   */
  async addImportantDate(date: string, description: string) {
    await this.page.click(this.importantDatesTab);
    await this.page.click('button:has-text("Добавить дату")');
    
    // Fill date form
    await this.page.fill('input[type="date"]', date);
    await this.page.fill('input[placeholder*="Описание"]', description);
    
    await this.page.click('button:has-text("Добавить")');
    await waitForToast(this.page);
  }

  /**
   * Get customer orders
   */
  async getCustomerOrders(): Promise<Array<{
    id: string;
    date: string;
    status: string;
    total: string;
  }>> {
    await this.page.click(this.ordersTab);
    await this.page.waitForTimeout(500);
    
    const orderRows = await this.page.locator('.order-row').all();
    const orders = [];
    
    for (const row of orderRows) {
      const id = await row.locator('.order-id').textContent() || '';
      const date = await row.locator('.order-date').textContent() || '';
      const status = await row.locator('.order-status').textContent() || '';
      const total = await row.locator('.order-total').textContent() || '';
      
      orders.push({
        id: id.replace('#', ''),
        date,
        status,
        total
      });
    }
    
    return orders;
  }

  /**
   * Check if customer exists
   */
  async hasCustomer(customerName: string): Promise<boolean> {
    const row = this.page.locator(this.customerRow).filter({ hasText: customerName });
    return await row.count() > 0;
  }

  /**
   * Delete customer
   */
  async deleteCustomer(customerName: string) {
    await this.openCustomerDetails(customerName);
    
    // Click delete button
    await this.page.click('button:has-text("Удалить")');
    
    // Confirm deletion
    await this.page.click('button:has-text("Подтвердить")');
    
    // Wait for redirect to customers list
    await this.page.waitForURL('/customers', { timeout: 5000 });
    await waitForToast(this.page);
  }

  /**
   * Get summary stats
   */
  async getSummaryStats(): Promise<{
    totalCustomers: number;
    totalRevenue: string;
  }> {
    const summaryText = await this.page.locator('.text-muted-foreground').textContent();
    
    const customersMatch = summaryText?.match(/Всего клиентов: (\d+)/);
    const revenueMatch = summaryText?.match(/Общая сумма заказов: ([\d\s,₸]+)/);
    
    return {
      totalCustomers: customersMatch ? parseInt(customersMatch[1]) : 0,
      totalRevenue: revenueMatch ? revenueMatch[1] : '0 ₸'
    };
  }

  /**
   * Export customers
   */
  async exportCustomers() {
    await this.page.click('button:has-text("Экспорт")');
    
    // Wait for download
    const download = await this.page.waitForEvent('download');
    return download.suggestedFilename();
  }
}