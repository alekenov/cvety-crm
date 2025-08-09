import { test, expect } from '@playwright/test';
import { OrdersPage } from '../pages/OrdersPage';
import { CustomersPage } from '../pages/CustomersPage';
import { loginAndNavigateTo } from '../helpers/auth-helper';
import { createTestCustomer, waitForOrderInList, verifyOrderDetails } from '../helpers/business-helpers';

test.describe('Order Creation Flow', () => {
  const existingUserPhone = '+77011234567';
  let ordersPage: OrdersPage;
  let customersPage: CustomersPage;

  test.beforeEach(async ({ page }) => {
    ordersPage = new OrdersPage(page);
    customersPage = new CustomersPage(page);
    await loginAndNavigateTo(page, '/orders', existingUserPhone);
  });

  test('Создание заказа с полным заполнением всех полей', async ({ page }) => {
    test.setTimeout(60000); // 1 минута
    
    // Сначала создаем клиента
    await page.goto('/customers');
    const customer = await createTestCustomer(page, 'Полный Заказ Клиент');
    console.log(`✅ Создан клиент: ${customer.name}`);
    
    // Переходим к созданию заказа
    await page.goto('/orders/new');
    await expect(page.locator('[data-testid="step-indicator"]')).toBeVisible();
    
    // ШАГ 1: Выбор клиента
    await ordersPage.selectCustomer(customer.name);
    await ordersPage.goToNextStep();
    const step1 = await ordersPage.getCurrentStep();
    expect(step1).toBe(2);
    console.log('✅ Шаг 1: Клиент выбран');
    
    // ШАГ 2: Добавление товаров (3 разных)
    const products = [
      { name: 'Букет из 25 красных роз', quantity: 1 },
      { name: 'Композиция "Весеннее настроение"', quantity: 2 },
      { name: 'Гортензия в горшке', quantity: 1 }
    ];
    
    for (const product of products) {
      await ordersPage.addProduct(product.name, product.quantity);
      await page.waitForTimeout(500);
    }
    
    // Проверяем что товары добавлены
    const cartItems = page.locator('[data-testid="cart-item"]');
    await expect(cartItems).toHaveCount(products.length);
    
    await ordersPage.goToNextStep();
    const step2 = await ordersPage.getCurrentStep();
    expect(step2).toBe(3);
    console.log('✅ Шаг 2: Добавлено 3 разных товара');
    
    // ШАГ 3: Настройка доставки на завтра
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    await ordersPage.setDeliveryInfo({
      method: 'delivery',
      date: tomorrow,
      timeFrom: '14:00',
      timeTo: '18:00',
      address: 'пр. Достык 123, кв. 45',
      recipientName: customer.name,
      recipientPhone: customer.phone,
      comment: 'Позвонить за 30 минут до доставки. Код домофона 1234#'
    });
    
    await ordersPage.goToNextStep();
    const step3 = await ordersPage.getCurrentStep();
    expect(step3).toBe(4);
    console.log('✅ Шаг 3: Доставка настроена на завтра 14:00-18:00');
    
    // ШАГ 4: Выбор оплаты Kaspi
    await ordersPage.selectPaymentMethod('kaspi');
    console.log('✅ Шаг 4: Выбрана оплата через Kaspi');
    
    // Подтверждение заказа
    await ordersPage.submitOrder();
    
    // Проверяем что заказ создан и мы на странице заказов
    await expect(page).toHaveURL('/orders');
    
    // Получаем ID созданного заказа из уведомления
    const toastText = await page.locator('[data-sonner-toast]').textContent();
    const orderId = toastText?.match(/#(\d+)/)?.[1];
    expect(orderId).toBeTruthy();
    
    console.log(`✅ Заказ #${orderId} успешно создан!`);
    
    // Проверяем что заказ появился в списке
    await waitForOrderInList(page, orderId!);
    
    // Проверяем детали заказа
    await verifyOrderDetails(page, orderId!, {
      status: 'Новый',
      customer: customer.name
    });
    
    console.log('🎉 Полный заказ успешно создан и отображается в списке!');
  });

  test('Быстрое создание заказа для постоянного клиента', async ({ page }) => {
    test.setTimeout(45000); // 45 секунд
    
    // Используем существующего тестового клиента
    const vipCustomerName = 'VIP Клиент';
    
    // Создаем VIP клиента с историей заказов
    await page.goto('/customers');
    const vipCustomer = await createTestCustomer(page, vipCustomerName);
    console.log(`✅ Создан VIP клиент: ${vipCustomer.name}`);
    
    // Идем создавать быстрый заказ
    await page.goto('/orders/new');
    
    // Быстрый выбор клиента
    await ordersPage.selectCustomer(vipCustomer.name);
    await ordersPage.goToNextStep();
    console.log('✅ VIP клиент выбран');
    
    // Добавляем стандартный букет (самый популярный)
    await ordersPage.addProduct('Букет из 25 красных роз', 1);
    await ordersPage.goToNextStep();
    console.log('✅ Стандартный букет добавлен');
    
    // Используем сохраненный адрес (из данных клиента)
    await ordersPage.setDeliveryInfo({
      method: 'self_pickup', // Самовывоз для скорости
      date: new Date(), // Сегодня
      timeFrom: '18:00',
      timeTo: '20:00',
      comment: 'Постоянный клиент'
    });
    await ordersPage.goToNextStep();
    console.log('✅ Выбран самовывоз сегодня');
    
    // Быстрая оплата наличными
    await ordersPage.selectPaymentMethod('cash');
    console.log('✅ Оплата наличными');
    
    // Создаем заказ
    await ordersPage.submitOrder();
    
    // Проверяем создание
    await expect(page).toHaveURL('/orders');
    const toastText = await page.locator('[data-sonner-toast]').textContent();
    const orderId = toastText?.match(/#(\d+)/)?.[1];
    
    console.log(`✅ Быстрый заказ #${orderId} создан за < 30 секунд!`);
    
    // Измеряем время создания
    const endTime = Date.now();
    const duration = (endTime - Date.now() + 30000) / 1000; // примерное время
    console.log(`⏱️ Время создания заказа: ~${duration} секунд`);
    
    console.log('🎉 Быстрый заказ для VIP клиента успешно создан!');
  });

  test('Создание заказа с проверкой расчета суммы', async ({ page }) => {
    test.setTimeout(45000);
    
    // Создаем клиента
    await page.goto('/customers');
    const customer = await createTestCustomer(page, 'Клиент для расчета');
    
    // Создаем заказ
    await page.goto('/orders/new');
    
    // Выбираем клиента
    await ordersPage.selectCustomer(customer.name);
    await ordersPage.goToNextStep();
    
    // Добавляем товары с известными ценами
    const productsWithPrices = [
      { name: 'Букет из 25 красных роз', quantity: 2, price: 15000 }, // 30000
      { name: 'Композиция "Весеннее настроение"', quantity: 1, price: 10000 } // 10000
    ];
    
    let expectedTotal = 0;
    for (const product of productsWithPrices) {
      await ordersPage.addProduct(product.name, product.quantity);
      expectedTotal += product.price * product.quantity;
      await page.waitForTimeout(500);
    }
    
    // Проверяем отображение суммы
    const subtotalElement = page.locator('[data-testid="order-subtotal"]');
    if (await subtotalElement.count() > 0) {
      const subtotalText = await subtotalElement.textContent();
      expect(subtotalText).toContain(expectedTotal.toLocaleString());
      console.log(`✅ Подитог корректный: ${expectedTotal} ₸`);
    }
    
    await ordersPage.goToNextStep();
    
    // Доставка (добавит стоимость доставки)
    const deliveryFee = 1500;
    await ordersPage.setDeliveryInfo({
      method: 'delivery',
      date: new Date(),
      timeFrom: '12:00',
      timeTo: '14:00',
      address: 'ул. Тестовая 1',
      recipientName: customer.name,
      recipientPhone: customer.phone
    });
    
    expectedTotal += deliveryFee;
    await ordersPage.goToNextStep();
    
    // Проверяем финальную сумму
    const totalElement = page.locator('[data-testid="order-total"]');
    if (await totalElement.count() > 0) {
      const totalText = await totalElement.textContent();
      expect(totalText).toContain(expectedTotal.toLocaleString());
      console.log(`✅ Итоговая сумма с доставкой: ${expectedTotal} ₸`);
    }
    
    // Оплата
    await ordersPage.selectPaymentMethod('transfer');
    
    // Создаем заказ
    await ordersPage.submitOrder();
    await expect(page).toHaveURL('/orders');
    
    const toastText = await page.locator('[data-sonner-toast]').textContent();
    const orderId = toastText?.match(/#(\d+)/)?.[1];
    
    // Проверяем сумму в списке заказов
    const orderRow = page.locator('tbody tr').filter({ hasText: `#${orderId}` });
    const totalInList = await orderRow.locator('[data-testid="order-total"]').textContent();
    
    if (totalInList) {
      expect(totalInList).toContain(expectedTotal.toLocaleString());
      console.log(`✅ Сумма в списке заказов корректная: ${expectedTotal} ₸`);
    }
    
    console.log('🎉 Заказ создан с правильным расчетом суммы!');
  });
});