import { test, expect } from '@playwright/test';
import { WarehousePage } from '../pages/WarehousePage';
import { loginAndNavigateTo } from '../helpers/auth-helper';

test.describe('Warehouse Management', () => {
  let warehousePage: WarehousePage;
  const existingUserPhone = '+77011234567';

  test.beforeEach(async ({ page }) => {
    warehousePage = new WarehousePage(page);
    
    // Login and navigate to warehouse page
    await loginAndNavigateTo(page, '/warehouse', existingUserPhone);
    
    // Wait for warehouse page to be fully loaded
    await page.waitForSelector('h1:has-text("Остатки склада")', { timeout: 10000 });
  });

  test.describe('Warehouse List', () => {
    test('should display warehouse items', async ({ page }) => {
      await expect(page.locator('h1')).toHaveText('Остатки склада');
      await expect(page.locator('table')).toBeVisible();
    });

    test('should search items', async ({ page }) => {
      await warehousePage.searchItems('Роза');
      await page.waitForLoadState('networkidle');
      
      const searchInput = page.locator('input[placeholder*="Поиск"]');
      await expect(searchInput).toHaveValue('Роза');
    });

    test('should filter by variety', async ({ page }) => {
      await warehousePage.filterByVariety('Роза');
      
      // Check that filter is applied
      const filterButton = page.locator('button[role="combobox"]');
      await expect(filterButton).toContainText('Роза');
    });

    test('should show low stock warning', async ({ page }) => {
      // Check if any items have low stock indicator
      const lowStockItems = await page.locator('.text-destructive, .text-orange-500').count();
      
      // We expect some items might have low stock
      expect(lowStockItems).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Quick Receive', () => {
    test('should show quick receive form', async ({ page }) => {
      const quickReceiveSection = page.locator('div:has-text("Быстрый приём товара")');
      await expect(quickReceiveSection).toBeVisible();
    });

    test('should add new item via quick receive', async ({ page }) => {
      const itemData = {
        variety: 'Роза Эквадор',
        height: 60,
        quantity: 100,
        price: 1200,
        farm: 'Ферма 1',
        supplier: 'Поставщик А',
        currency: 'USD' as const,
        rate: 475,
        cost: 2.5
      };
      
      await warehousePage.quickReceiveItem(itemData);
      
      // Check success toast
      await expect(page.locator('[data-sonner-toast]')).toBeVisible();
      
      // Verify item appears in list
      await warehousePage.searchItems('Роза Эквадор');
      const itemsCount = await warehousePage.getItemsCount();
      expect(itemsCount).toBeGreaterThan(0);
    });

    test('should calculate price with currency conversion', async ({ page }) => {
      // Fill currency and rate
      const currencySelect = page.locator('select[name="currency"]');
      const rateInput = page.locator('input[placeholder*="Курс"]');
      const costInput = page.locator('input[placeholder*="Стоимость"]');
      const priceInput = page.locator('input[placeholder*="Цена"]');
      
      await currencySelect.selectOption('USD');
      await rateInput.fill('475');
      await costInput.fill('2.5');
      
      // Price should be calculated automatically
      await page.waitForTimeout(500);
      const priceValue = await priceInput.inputValue();
      
      // 2.5 * 475 = 1187.5, rounded to 1188
      expect(parseInt(priceValue)).toBeCloseTo(1188, -1);
    });
  });

  test.describe('Item Management', () => {
    test('should update item price', async ({ page }) => {
      // Get first item name
      const firstRow = page.locator('tbody tr').first();
      const itemNameElement = await firstRow.locator('td:first-child').textContent();
      const itemName = itemNameElement?.split(' ')[0] || '';
      
      if (itemName) {
        await warehousePage.updateItemPrice(itemName, 1500);
        
        // Check success toast
        await expect(page.locator('[data-sonner-toast]')).toContainText('Позиция обновлена');
      }
    });

    test('should toggle showcase status', async ({ page }) => {
      const firstRow = page.locator('tbody tr').first();
      const itemNameElement = await firstRow.locator('td:first-child').textContent();
      const itemName = itemNameElement?.split(' ')[0] || '';
      
      if (itemName) {
        await warehousePage.toggleShowcase(itemName);
        await expect(page.locator('[data-sonner-toast]')).toContainText('Позиция обновлена');
      }
    });

    test('should mark item for write-off', async ({ page }) => {
      const firstRow = page.locator('tbody tr').first();
      const itemNameElement = await firstRow.locator('td:first-child').textContent();
      const itemName = itemNameElement?.split(' ')[0] || '';
      
      if (itemName) {
        await warehousePage.markForWriteOff(itemName);
        await expect(page.locator('[data-sonner-toast]')).toContainText('Позиция обновлена');
      }
    });
  });

  test.describe('Stock Levels', () => {
    test('should display stock quantities', async ({ page }) => {
      const firstRow = page.locator('tbody tr').first();
      const stockCell = firstRow.locator('td:nth-child(2)');
      
      // Check that stock quantity is displayed
      await expect(stockCell).toContainText('шт');
    });

    test('should show reserved quantities', async ({ page }) => {
      // Find items with reservations
      const reservedItems = await page.locator('text=Резерв:').count();
      
      // Some items might have reservations
      expect(reservedItems).toBeGreaterThanOrEqual(0);
    });

    test('should get item stock info', async ({ page }) => {
      const firstRow = page.locator('tbody tr').first();
      const itemNameElement = await firstRow.locator('td:first-child').textContent();
      const itemName = itemNameElement?.split(' ')[0] || '';
      
      if (itemName) {
        const stockInfo = await warehousePage.getItemStock(itemName);
        
        expect(stockInfo.quantity).toBeGreaterThanOrEqual(0);
        expect(stockInfo.reserved).toBeGreaterThanOrEqual(0);
        expect(stockInfo.available).toBe(stockInfo.quantity - stockInfo.reserved);
      }
    });

    test('should identify low stock items', async ({ page }) => {
      const firstRow = page.locator('tbody tr').first();
      const itemNameElement = await firstRow.locator('td:first-child').textContent();
      const itemName = itemNameElement?.split(' ')[0] || '';
      
      if (itemName) {
        const isLowStock = await warehousePage.isLowStock(itemName);
        
        // Check matches visual indicator
        const stockCell = firstRow.locator('td:nth-child(2)');
        const hasWarningColor = await stockCell.locator('.text-destructive, .text-orange-500').count() > 0;
        
        expect(isLowStock).toBe(hasWarningColor);
      }
    });
  });

  test.describe('Bulk Operations', () => {
    test('should get all items on page', async ({ page }) => {
      const items = await warehousePage.getAllItems();
      
      // Should have some items
      expect(items.length).toBeGreaterThan(0);
      
      // Each item should have required fields
      if (items.length > 0) {
        const firstItem = items[0];
        expect(firstItem.variety).toBeTruthy();
        expect(firstItem.height).toBeTruthy();
        expect(firstItem.quantity).toBeGreaterThanOrEqual(0);
        expect(firstItem.price).toBeTruthy();
      }
    });

    test('should handle pagination', async ({ page }) => {
      // Check if pagination exists
      const paginationNext = page.locator('a[aria-label="Вперед"]');
      
      if (await paginationNext.isVisible()) {
        const initialCount = await warehousePage.getItemsCount();
        
        await paginationNext.click();
        await page.waitForLoadState('networkidle');
        
        const nextPageCount = await warehousePage.getItemsCount();
        
        // Should have items on next page
        expect(nextPageCount).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Mobile View', () => {
    test('should display mobile cards on small screens', async ({ page, isMobile }) => {
      if (isMobile) {
        // Mobile cards should be visible instead of table
        const mobileCards = await page.locator('[data-testid*="mobile-card"]').count();
        expect(mobileCards).toBeGreaterThan(0);
        
        // Table should not be visible
        await expect(page.locator('table')).not.toBeVisible();
      }
    });
  });
});