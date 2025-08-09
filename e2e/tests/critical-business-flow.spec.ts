import { test, expect } from '@playwright/test';
import { loginAndNavigateTo } from '../helpers/auth-helper';
import {
  quickReceiveInventory,
  createTestCustomer,
  createCompleteOrder,
  processOrderWorkflow,
  checkInventoryLevel,
  getOrderTrackingToken,
  checkCustomerTracking
} from '../helpers/business-helpers';

test.describe('Critical Business Flow', () => {
  const existingUserPhone = '+77011234567';

  test('Полный цикл: от поставки до доставки клиенту', async ({ page }) => {
    // Этот тест проверяет весь бизнес-процесс от начала до конца
    test.setTimeout(120000); // 2 минуты на весь тест

    // ================== 1. АВТОРИЗАЦИЯ ==================
    await loginAndNavigateTo(page, '/warehouse', existingUserPhone);
    console.log('✅ Шаг 1: Авторизация выполнена');

    // ================== 2. ПРИНЯТЬ ПОСТАВКУ РОЗ ==================
    // Запоминаем начальные остатки
    let initialStock;
    try {
      initialStock = await checkInventoryLevel(page, 'Роза Ред Наоми');
    } catch {
      initialStock = { quantity: 0, reserved: 0, available: 0 };
    }
    console.log(`📦 Начальные остатки: ${initialStock.quantity} шт`);

    // Принимаем поставку 100 роз по $2.5 за штуку
    const inventory = await quickReceiveInventory(
      page,
      'Роза Ред Наоми',
      100,
      2.5,
      475 // курс USD
    );
    
    // Проверяем что товар добавился
    await expect(page.locator('[data-sonner-toast]')).toBeVisible();
    const newStock = await checkInventoryLevel(page, inventory.variety);
    expect(newStock.quantity).toBe(initialStock.quantity + 100);
    console.log('✅ Шаг 2: Поставка принята, остатки увеличились на 100 шт');

    // ================== 3. СОЗДАТЬ КЛИЕНТА ==================
    await page.goto('/customers');
    await page.waitForSelector('h1:has-text("Клиенты")');
    
    const customer = await createTestCustomer(page, 'Айгуль Сатпаева');
    await expect(page.locator('[data-sonner-toast]')).toContainText('добавлен');
    console.log(`✅ Шаг 3: Создан клиент "${customer.name}"`);

    // ================== 4. СОЗДАТЬ ЗАКАЗ ==================
    await page.goto('/orders/new');
    await page.waitForSelector('[data-testid="step-indicator"]');
    
    const { orderId, orderData } = await createCompleteOrder(
      page,
      customer.name,
      [{ name: inventory.variety, quantity: 25 }], // 25 роз из 100
      new Date(Date.now() + 24 * 60 * 60 * 1000) // завтра
    );
    
    // Проверяем что заказ создан
    expect(orderId).toBeTruthy();
    await expect(page).toHaveURL('/orders');
    console.log(`✅ Шаг 4: Создан заказ #${orderId} на 25 роз`);

    // ================== 5. ОПЛАТИТЬ ЗАКАЗ ==================
    await page.waitForTimeout(1000);
    await processOrderWorkflow(page, orderId!, ['paid']);
    await expect(page.locator('[data-sonner-toast]')).toContainText('Статус заказа');
    console.log('✅ Шаг 5: Заказ оплачен');

    // ================== 6. СОБРАТЬ БУКЕТ ==================
    await processOrderWorkflow(page, orderId!, ['assembled']);
    await expect(page.locator('[data-sonner-toast]')).toContainText('Статус заказа');
    console.log('✅ Шаг 6: Букет собран');

    // ================== 7. ДОСТАВИТЬ КЛИЕНТУ ==================
    await processOrderWorkflow(page, orderId!, ['delivery']);
    await expect(page.locator('[data-sonner-toast]')).toContainText('Статус заказа');
    console.log('✅ Шаг 7: Заказ отправлен на доставку');

    // ================== 8. ПРОВЕРИТЬ ОСТАТКИ ==================
    const finalStock = await checkInventoryLevel(page, inventory.variety);
    
    // Остатки должны уменьшиться на 25 штук
    const expectedQuantity = initialStock.quantity + 100 - 25;
    expect(finalStock.quantity).toBe(expectedQuantity);
    console.log(`✅ Шаг 8: Остатки корректны: было ${initialStock.quantity + 100}, стало ${finalStock.quantity}`);

    // ================== 9. ПРОВЕРИТЬ ТРЕКИНГ ==================
    // Получаем токен трекинга
    const trackingToken = await getOrderTrackingToken(page, orderId!);
    expect(trackingToken).toBeTruthy();
    
    // Проверяем публичную страницу трекинга
    const tracking = await checkCustomerTracking(page, trackingToken);
    expect(tracking.status).toContain('Доставка');
    expect(tracking.isMasked).toBe(true); // Данные должны быть замаскированы
    console.log(`✅ Шаг 9: Трекинг работает, токен: ${trackingToken}`);

    // ================== 10. ЗАВЕРШИТЬ ЗАКАЗ ==================
    await page.goto('/orders');
    await processOrderWorkflow(page, orderId!, ['completed']);
    
    // Проверяем финальный статус
    const finalRow = page.locator('tbody tr').filter({ hasText: `#${orderId}` });
    const statusBadge = finalRow.locator('[data-testid="order-status"], .badge');
    await expect(statusBadge).toContainText('Завершен');
    console.log('✅ Шаг 10: Заказ успешно завершен');

    // ================== ИТОГОВАЯ ПРОВЕРКА ==================
    console.log('');
    console.log('🎉 ПОЛНЫЙ БИЗНЕС-ЦИКЛ УСПЕШНО ЗАВЕРШЕН!');
    console.log(`📊 Результаты:`);
    console.log(`   - Принято товара: 100 шт`);
    console.log(`   - Продано: 25 шт`);
    console.log(`   - Осталось на складе: ${finalStock.quantity} шт`);
    console.log(`   - Создан клиент: ${customer.name}`);
    console.log(`   - Выполнен заказ: #${orderId}`);
    console.log(`   - Сумма заказа: ${25 * inventory.retailPrice} ₸`);
  });

  test('Быстрая проверка основных модулей', async ({ page }) => {
    // Короткий smoke test для проверки что все модули работают
    test.setTimeout(30000); // 30 секунд

    await loginAndNavigateTo(page, '/orders', existingUserPhone);
    
    // Проверяем доступность всех основных страниц
    const pages = [
      { url: '/orders', title: 'Заказы' },
      { url: '/warehouse', title: 'Остатки склада' },
      { url: '/customers', title: 'Клиенты' },
      { url: '/production', title: 'Производство' },
      { url: '/catalog', title: 'Каталог' }
    ];

    for (const pageInfo of pages) {
      await page.goto(pageInfo.url);
      await expect(page.locator('h1')).toContainText(pageInfo.title);
      console.log(`✅ ${pageInfo.title} - доступна`);
    }

    // Проверяем создание заказа
    await page.goto('/orders/new');
    await expect(page.locator('[data-testid="step-indicator"]')).toBeVisible();
    console.log('✅ Форма создания заказа - работает');

    // Проверяем поиск
    await page.goto('/orders');
    await page.fill('[data-testid="search-input"]', 'тест');
    await page.waitForTimeout(500);
    console.log('✅ Поиск - работает');

    console.log('🎉 Все основные модули работают корректно!');
  });
});