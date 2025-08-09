import { Page, expect } from '@playwright/test';
import { waitForTableData, waitForToast, safeFillInput, waitForLoadingComplete } from '../helpers/wait-helpers';

export class WarehousePage {
  constructor(private page: Page) {}

  // Locators
  private searchInput = 'input[placeholder*="Поиск по названию"]';
  private varietyFilter = 'button[role="combobox"]';
  private varietyOption = '[role="option"]';
  private warehouseTable = 'table';
  private warehouseRow = 'tbody tr';
  
  // Quick Receive form locators
  private quickReceiveSection = 'div:has-text("Быстрый приём товара")';
  private varietyInput = 'input[placeholder*="Сорт"]';
  private heightInput = 'input[placeholder*="Высота"]';
  private quantityInput = 'input[placeholder*="Количество"]';
  private priceInput = 'input[placeholder*="Цена"]';
  private farmInput = 'input[placeholder*="Ферма"]';
  private supplierInput = 'input[placeholder*="Поставщик"]';
  private currencySelect = 'select[name="currency"]';
  private rateInput = 'input[placeholder*="Курс"]';
  private costInput = 'input[placeholder*="Стоимость"]';
  private addButton = 'button:has-text("Добавить")';
  
  // Item details dialog
  private itemDialog = '[role="dialog"]';
  private saveButton = 'button:has-text("Сохранить")';
  private cancelButton = 'button:has-text("Отмена")';
  
  /**
   * Navigate to warehouse page
   */
  async goto() {
    await this.page.goto('/warehouse');
    await this.page.waitForLoadState('networkidle');
    await waitForTableData(this.page, this.warehouseTable, 0); // Wait for table even if empty
  }

  /**
   * Search items
   */
  async searchItems(query: string) {
    await safeFillInput(this.page, this.searchInput, query);
    await this.page.waitForTimeout(500); // Wait for debounce
    await waitForLoadingComplete(this.page);
  }

  /**
   * Filter by variety
   */
  async filterByVariety(variety: string) {
    await this.page.waitForSelector(this.varietyFilter, { timeout: 5000 });
    await this.page.click(this.varietyFilter);
    await this.page.waitForSelector(this.varietyOption, { timeout: 3000 });
    await this.page.click(`${this.varietyOption}:has-text("${variety}")`);
    await waitForLoadingComplete(this.page);
  }

  /**
   * Get items count
   */
  async getItemsCount(): Promise<number> {
    const rows = await this.page.locator(this.warehouseRow).count();
    return rows;
  }

  /**
   * Quick receive item
   */
  async quickReceiveItem(data: {
    variety: string;
    height: number;
    quantity: number;
    price: number;
    farm?: string;
    supplier?: string;
    currency?: 'USD' | 'EUR' | 'KZT';
    rate?: number;
    cost?: number;
  }) {
    // Fill variety
    await safeFillInput(this.page, this.varietyInput, data.variety);
    
    // Fill height
    await safeFillInput(this.page, this.heightInput, data.height.toString());
    
    // Fill quantity
    await safeFillInput(this.page, this.quantityInput, data.quantity.toString());
    
    // Fill price
    await safeFillInput(this.page, this.priceInput, data.price.toString());
    
    // Optional fields
    if (data.farm) {
      await this.page.fill(this.farmInput, data.farm);
    }
    
    if (data.supplier) {
      await this.page.fill(this.supplierInput, data.supplier);
    }
    
    if (data.currency) {
      await this.page.selectOption(this.currencySelect, data.currency);
    }
    
    if (data.rate) {
      await this.page.fill(this.rateInput, data.rate.toString());
    }
    
    if (data.cost) {
      await this.page.fill(this.costInput, data.cost.toString());
    }
    
    // Submit
    await this.page.click(this.addButton);
    
    // Wait for success toast
    await waitForToast(this.page);
  }

  /**
   * Open item details
   */
  async openItemDetails(itemName: string) {
    const row = this.page.locator(this.warehouseRow).filter({ hasText: itemName });
    const rowCount = await row.count();
    
    if (rowCount === 0) {
      throw new Error(`Item "${itemName}" not found in warehouse`);
    }
    
    await row.first().click();
    await this.page.waitForSelector(this.itemDialog, { timeout: 5000 });
  }

  /**
   * Update item price
   */
  async updateItemPrice(itemName: string, newPrice: number) {
    await this.openItemDetails(itemName);
    
    const priceField = this.page.locator(this.itemDialog).locator('input[name="price"]');
    await priceField.clear();
    await priceField.fill(newPrice.toString());
    
    await this.page.click(this.saveButton);
    await waitForToast(this.page);
  }

  /**
   * Toggle showcase status
   */
  async toggleShowcase(itemName: string) {
    await this.openItemDetails(itemName);
    
    const showcaseCheckbox = this.page.locator(this.itemDialog).locator('input[name="onShowcase"]');
    await showcaseCheckbox.click();
    
    await this.page.click(this.saveButton);
    await waitForToast(this.page);
  }

  /**
   * Mark for write-off
   */
  async markForWriteOff(itemName: string) {
    await this.openItemDetails(itemName);
    
    const writeOffCheckbox = this.page.locator(this.itemDialog).locator('input[name="toWriteOff"]');
    await writeOffCheckbox.click();
    
    await this.page.click(this.saveButton);
    await waitForToast(this.page);
  }

  /**
   * Get item stock info
   */
  async getItemStock(itemName: string): Promise<{
    quantity: number;
    reserved: number;
    available: number;
  }> {
    const row = this.page.locator(this.warehouseRow).filter({ hasText: itemName });
    
    const qtyText = await row.locator('td:nth-child(2)').textContent();
    const quantity = parseInt(qtyText?.match(/\d+/)?.[0] || '0');
    
    const reservedText = await row.locator('.text-muted-foreground').textContent();
    const reserved = parseInt(reservedText?.match(/\d+/)?.[0] || '0');
    
    return {
      quantity,
      reserved,
      available: quantity - reserved
    };
  }

  /**
   * Check if item is low stock
   */
  async isLowStock(itemName: string): Promise<boolean> {
    const row = this.page.locator(this.warehouseRow).filter({ hasText: itemName });
    const stockCell = row.locator('td:nth-child(2)');
    
    // Check for warning color classes
    const hasWarning = await stockCell.locator('.text-destructive, .text-orange-500').count() > 0;
    return hasWarning;
  }

  /**
   * Get all items on page
   */
  async getAllItems(): Promise<Array<{
    variety: string;
    height: string;
    quantity: number;
    price: string;
  }>> {
    const rows = await this.page.locator(this.warehouseRow).all();
    const items = [];
    
    for (const row of rows) {
      const varietyText = await row.locator('td:nth-child(1)').textContent();
      const qtyText = await row.locator('td:nth-child(2)').textContent();
      const priceText = await row.locator('td:nth-child(3)').textContent();
      
      const varietyMatch = varietyText?.match(/(.+)\s+(\d+)см/);
      const qtyMatch = qtyText?.match(/(\d+)/);
      
      if (varietyMatch && qtyMatch) {
        items.push({
          variety: varietyMatch[1].trim(),
          height: varietyMatch[2],
          quantity: parseInt(qtyMatch[1]),
          price: priceText || ''
        });
      }
    }
    
    return items;
  }

  /**
   * Check if quick receive form is visible
   */
  async isQuickReceiveVisible(): Promise<boolean> {
    return await this.page.locator(this.quickReceiveSection).isVisible();
  }

  /**
   * Expand/collapse quick receive form
   */
  async toggleQuickReceive() {
    const toggleButton = this.page.locator('button[aria-expanded]').filter({ hasText: /Быстрый приём/ });
    await toggleButton.click();
    await this.page.waitForTimeout(300); // Wait for animation
  }
}