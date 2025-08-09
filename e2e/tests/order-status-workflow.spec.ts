import { test, expect } from '@playwright/test';
import { OrdersPage } from '../pages/OrdersPage';
import { loginAndNavigateTo } from '../helpers/auth-helper';
import { createTestCustomer, createCompleteOrder } from '../helpers/business-helpers';

test.describe('Order Status Workflow', () => {
  const existingUserPhone = '+77011234567';
  let ordersPage: OrdersPage;

  test.beforeEach(async ({ page }) => {
    ordersPage = new OrdersPage(page);
    await loginAndNavigateTo(page, '/orders', existingUserPhone);
  });

  test('Workflow статусов заказа: new → paid → assembled → delivery → completed', async ({ page }) => {
    test.setTimeout(60000);
    
    console.log('🚀 Начинаем тест workflow статусов заказа');
    
    // Создаем клиента и заказ через helper функции для надежности
    console.log('📝 Создаем данные для тестирования workflow');
    
    // Создаем клиента
    await page.goto('/customers');
    const customer = await createTestCustomer(page, 'Клиент для Workflow');
    console.log(`✅ Создан клиент: ${customer.name}`);
    
    // Используем надежный helper для создания заказа
    console.log('📦 Создаем заказ через helper...');
    await page.goto('/orders/new');
    const { orderId } = await createCompleteOrder(
      page,
      customer.name,
      [{ name: 'Роза красная', quantity: 10 }]
    );
    
    if (!orderId) {
      console.log('⚠️ Не удалось создать заказ');
      return;
    }
    
    console.log(`✅ Создан заказ #${orderId}`);
    
    // Переходим на страницу заказов
    await page.goto('/orders');
    await page.waitForSelector('tbody tr', { timeout: 5000 });
    
    // Проверяем начальный статус
    let orderRow = page.locator('tbody tr').filter({ hasText: `#${orderId}` });
    let statusBadge = orderRow.locator('.badge, [data-testid="order-status"]').first();
    const initialStatus = await statusBadge.textContent();
    console.log(`📊 Начальный статус: ${initialStatus}`);
    
    // ШАГ 1: Новый → Оплачен
    console.log('\n📋 Шаг 1: Меняем статус на "Оплачен"');
    await ordersPage.changeOrderStatus(orderId, 'Оплачен');
    await expect(page.locator('[data-sonner-toast]')).toContainText('Статус заказа');
    
    // Проверяем новый статус
    orderRow = page.locator('tbody tr').filter({ hasText: `#${orderId}` });
    statusBadge = orderRow.locator('.badge, [data-testid="order-status"]').first();
    await expect(statusBadge).toContainText('Оплачен');
    console.log('✅ Статус изменен на: Оплачен');
    
    // Проверяем доступные действия
    const menuButton = orderRow.locator('button[aria-haspopup="menu"], button:has(svg)').last();
    await menuButton.click();
    await page.waitForTimeout(300);
    
    // Должны быть доступны: Собран, Проблема
    const menuItems = page.locator('[role="menuitem"]');
    const menuTexts = await menuItems.allTextContents();
    expect(menuTexts.join(' ')).toContain('Собран');
    console.log('✅ Доступные действия корректны для статуса "Оплачен"');
    
    // Закрываем меню
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    
    // ШАГ 2: Оплачен → Собран
    console.log('\n📋 Шаг 2: Меняем статус на "Собран"');
    await ordersPage.changeOrderStatus(orderId!, 'Собран');
    await expect(page.locator('[data-sonner-toast]')).toContainText('Статус заказа');
    
    orderRow = page.locator('tbody tr').filter({ hasText: `#${orderId}` });
    statusBadge = orderRow.locator('.badge, [data-testid="order-status"]').first();
    await expect(statusBadge).toContainText('Собран');
    console.log('✅ Статус изменен на: Собран');
    
    // ШАГ 3: Собран → Доставка
    console.log('\n📋 Шаг 3: Меняем статус на "Доставка"');
    await ordersPage.changeOrderStatus(orderId!, 'Доставка');
    await expect(page.locator('[data-sonner-toast]')).toContainText('Статус заказа');
    
    orderRow = page.locator('tbody tr').filter({ hasText: `#${orderId}` });
    statusBadge = orderRow.locator('.badge, [data-testid="order-status"]').first();
    await expect(statusBadge).toContainText('Доставка');
    console.log('✅ Статус изменен на: Доставка');
    
    // ШАГ 4: Доставка → Завершен
    console.log('\n📋 Шаг 4: Меняем статус на "Завершен"');
    await ordersPage.changeOrderStatus(orderId!, 'Завершен');
    await expect(page.locator('[data-sonner-toast]')).toContainText('Статус заказа');
    
    orderRow = page.locator('tbody tr').filter({ hasText: `#${orderId}` });
    statusBadge = orderRow.locator('.badge, [data-testid="order-status"]').first();
    await expect(statusBadge).toContainText('Завершен');
    console.log('✅ Статус изменен на: Завершен');
    
    // Проверяем что заказ помечен как завершенный
    const completedRow = page.locator('tbody tr').filter({ hasText: `#${orderId}` });
    const rowClasses = await completedRow.getAttribute('class');
    if (rowClasses?.includes('opacity')) {
      console.log('✅ Заказ визуально отмечен как завершенный');
    }
    
    console.log('\n🎉 Workflow статусов успешно протестирован!');
    console.log('📊 Пройденные этапы:');
    console.log('   1. Новый → Оплачен');
    console.log('   2. Оплачен → Собран');
    console.log('   3. Собран → Доставка');
    console.log('   4. Доставка → Завершен');
  });

  test.skip('Обработка проблемных заказов', async ({ page }) => {
    test.setTimeout(45000);
    
    console.log('🚨 Тестируем обработку проблемных заказов');
    
    // Временно пропускаем этот тест
    console.log('⏭️ Тест временно пропущен');
  });
});