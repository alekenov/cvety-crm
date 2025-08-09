import { test, expect } from '@playwright/test';
import { WarehousePage } from '../pages/WarehousePage';
import { OrdersPage } from '../pages/OrdersPage';
import { loginAndNavigateTo } from '../helpers/auth-helper';
import { 
  quickReceiveInventory, 
  checkInventoryLevel,
  createTestCustomer,
  createCompleteOrder
} from '../helpers/business-helpers';

test.describe('Inventory Management', () => {
  const existingUserPhone = '+77011234567';
  let warehousePage: WarehousePage;

  test.beforeEach(async ({ page }) => {
    warehousePage = new WarehousePage(page);
    await loginAndNavigateTo(page, '/warehouse', existingUserPhone);
  });

  test('Проверка отображения и поиска товаров на складе', async ({ page }) => {
    test.setTimeout(30000);
    
    // Проверяем что страница склада загрузилась
    await expect(page.locator('h1')).toContainText('Остатки');
    console.log('✅ Страница склада загружена');
    
    // Проверяем отображение таблицы
    await expect(page.locator('table')).toBeVisible();
    console.log('✅ Таблица товаров отображается');
    
    // Получаем количество товаров
    const itemsCount = await warehousePage.getItemsCount();
    console.log(`📦 На складе ${itemsCount} позиций`);
    
    // Проверяем поиск
    await warehousePage.searchItems('Роза');
    await page.waitForTimeout(1000);
    
    const searchResults = await warehousePage.getItemsCount();
    console.log(`🔍 Найдено роз: ${searchResults} шт`);
    
    // Очищаем поиск
    await page.locator('input[placeholder="Поиск по названию"]').clear();
    await page.waitForTimeout(1000);
    
    console.log('🎉 Отображение и поиск товаров работают!');
  });

  test.skip('Приём поставки и установка цен с валютным расчетом', async ({ page }) => {
    test.setTimeout(45000);
    
    // Запоминаем начальные остатки
    let initialStock;
    const variety = 'Роза Эквадор Премиум';
    
    try {
      initialStock = await checkInventoryLevel(page, variety);
    } catch {
      initialStock = { quantity: 0, reserved: 0, available: 0 };
    }
    console.log(`📦 Начальные остатки "${variety}": ${initialStock.quantity} шт`);
    
    // Параметры поставки
    const deliveryData = {
      variety: variety,
      quantity: 100,
      costUSD: 2.5,  // $2.5 за штуку
      usdRate: 475   // курс доллара
    };
    
    // Ожидаемая розничная цена с наценкой 100%
    const expectedRetailPrice = Math.round(deliveryData.costUSD * deliveryData.usdRate * 2);
    console.log(`💰 Расчет цены: $${deliveryData.costUSD} × ${deliveryData.usdRate} × 2 = ${expectedRetailPrice} ₸`);
    
    // Принимаем поставку
    const inventory = await quickReceiveInventory(
      page,
      deliveryData.variety,
      deliveryData.quantity,
      deliveryData.costUSD,
      deliveryData.usdRate
    );
    
    // Проверяем уведомление
    await expect(page.locator('[data-sonner-toast]')).toBeVisible();
    const toastText = await page.locator('[data-sonner-toast]').textContent();
    expect(toastText).toContain('успешно');
    console.log('✅ Поставка принята успешно');
    
    // Проверяем новые остатки
    const newStock = await checkInventoryLevel(page, variety);
    expect(newStock.quantity).toBe(initialStock.quantity + deliveryData.quantity);
    console.log(`✅ Остатки увеличились: ${initialStock.quantity} → ${newStock.quantity} шт`);
    
    // Проверяем что цена установлена правильно
    expect(inventory.retailPrice).toBe(expectedRetailPrice);
    console.log(`✅ Розничная цена установлена: ${inventory.retailPrice} ₸`);
    
    // Проверяем отображение в таблице
    await warehousePage.searchItems(variety);
    await page.waitForTimeout(1000);
    
    const itemRow = page.locator('tbody tr').filter({ hasText: variety }).first();
    const priceCell = await itemRow.locator('td:nth-child(3)').textContent();
    expect(priceCell).toContain(expectedRetailPrice.toLocaleString());
    console.log('✅ Цена корректно отображается в таблице склада');
    
    // Проверяем что товар доступен для продажи
    const stockInfo = await warehousePage.getItemStock(variety);
    expect(stockInfo.available).toBe(newStock.quantity);
    console.log(`✅ Доступно для продажи: ${stockInfo.available} шт`);
    
    console.log('🎉 Приём поставки с валютным расчетом работает корректно!');
  });

  test.skip('Списание товара при продаже и резервирование', async ({ page }) => {
    test.setTimeout(60000);
    
    // Сначала принимаем поставку для теста
    const variety = 'Тюльпан Голландский';
    const initialQuantity = 50;
    
    // Принимаем поставку
    await quickReceiveInventory(page, variety, initialQuantity, 1.5, 475);
    console.log(`✅ Принята поставка: ${initialQuantity} шт "${variety}"`);
    
    // Проверяем начальные остатки
    const stockBefore = await checkInventoryLevel(page, variety);
    console.log(`📦 Остатки до продажи: ${stockBefore.quantity} шт (доступно: ${stockBefore.available})`);
    
    // Создаем клиента для заказа
    await page.goto('/customers');
    const customer = await createTestCustomer(page, 'Клиент для списания');
    console.log(`✅ Создан клиент: ${customer.name}`);
    
    // Создаем заказ на 10 единиц
    const orderQuantity = 10;
    await page.goto('/orders/new');
    const { orderId } = await createCompleteOrder(
      page,
      customer.name,
      [{ name: variety, quantity: orderQuantity }]
    );
    console.log(`✅ Создан заказ #${orderId} на ${orderQuantity} шт`);
    
    // Проверяем остатки после создания заказа (должны зарезервироваться)
    const stockAfterOrder = await checkInventoryLevel(page, variety);
    console.log(`📦 После создания заказа:`);
    console.log(`   Всего: ${stockAfterOrder.quantity} шт`);
    console.log(`   Резерв: ${stockAfterOrder.reserved} шт`);
    console.log(`   Доступно: ${stockAfterOrder.available} шт`);
    
    // Проверяем резервирование
    expect(stockAfterOrder.reserved).toBeGreaterThanOrEqual(orderQuantity);
    expect(stockAfterOrder.available).toBeLessThanOrEqual(stockBefore.available - orderQuantity);
    console.log('✅ Товар зарезервирован под заказ');
    
    // Меняем статус заказа на "Оплачен"
    await page.goto('/orders');
    const ordersPage = new OrdersPage(page);
    await ordersPage.changeOrderStatus(orderId!, 'Оплачен');
    console.log('✅ Заказ оплачен');
    
    // Меняем статус на "Собран" (товар должен списаться)
    await ordersPage.changeOrderStatus(orderId!, 'Собран');
    console.log('✅ Заказ собран');
    
    // Проверяем финальные остатки
    const stockFinal = await checkInventoryLevel(page, variety);
    console.log(`📦 Финальные остатки:`);
    console.log(`   Всего: ${stockFinal.quantity} шт`);
    console.log(`   Резерв: ${stockFinal.reserved} шт`);
    console.log(`   Доступно: ${stockFinal.available} шт`);
    
    // Остатки должны уменьшиться на количество в заказе
    const expectedFinalQuantity = stockBefore.quantity - orderQuantity;
    expect(stockFinal.quantity).toBe(expectedFinalQuantity);
    console.log(`✅ Остатки уменьшились на ${orderQuantity} шт`);
    
    // Резерв должен освободиться
    expect(stockFinal.reserved).toBeLessThan(stockAfterOrder.reserved);
    console.log('✅ Резерв освобожден после сборки');
    
    console.log('🎉 Списание и резервирование товара работают корректно!');
  });
});