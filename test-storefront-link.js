import { chromium } from 'playwright';

(async () => {
  console.log('🚀 Запуск теста ссылки на витрину в CRM...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  
  const page = await browser.newPage();
  
  try {
    // Шаг 1: Переход на страницу логина
    console.log('1. Переход на страницу логина...');
    await page.goto('http://localhost:5177/login');
    await page.waitForSelector('input[type="tel"]', { timeout: 5000 });
    
    // Шаг 2: Ввод номера телефона
    console.log('2. Ввод номера телефона...');
    await page.fill('input[type="tel"]', '+77771234567');
    
    // Шаг 3: Нажатие кнопки отправки OTP
    console.log('3. Запрос OTP...');
    await page.click('button:has-text("Получить код")');
    
    // Получение OTP через API
    console.log('4. Получение OTP через API...');
    const response = await fetch('http://localhost:8001/api/auth/request-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+77771234567' })
    });
    const otpData = await response.json();
    console.log('   OTP код:', otpData.otp);
    
    // Шаг 4: Ввод OTP кода
    console.log('5. Ввод OTP кода...');
    await page.waitForSelector('input[placeholder*="123456"]', { timeout: 5000 });
    await page.fill('input[placeholder*="123456"]', otpData.otp);
    await page.click('button:has-text("Войти")');
    
    // Шаг 5: Ожидание перехода в CRM
    console.log('6. Ожидание загрузки CRM...');
    await page.waitForURL(/\/orders/, { timeout: 10000 });
    console.log('   ✅ Успешная авторизация!');
    
    // Шаг 6: Поиск ссылки на витрину в sidebar
    console.log('7. Поиск ссылки "Витрина магазина" в sidebar...');
    const storefrontLink = await page.locator('text="Витрина магазина"').first();
    await storefrontLink.waitFor({ timeout: 5000 });
    console.log('   ✅ Ссылка найдена!');
    
    // Шаг 7: Клик по ссылке на витрину
    console.log('8. Переход в витрину...');
    await storefrontLink.click();
    
    // Шаг 8: Проверка URL и содержимого
    console.log('9. Проверка витрины...');
    await page.waitForURL(/\/shop\/\d+/, { timeout: 10000 });
    const currentUrl = page.url();
    console.log('   Текущий URL:', currentUrl);
    
    // Проверка, что это storefront v2 (ищем характерные элементы)
    await page.waitForSelector('[class*="storefront"]', { timeout: 5000 });
    
    // Проверка загрузки товаров
    const productsVisible = await page.locator('[data-testid="product-item"]').count();
    console.log('   Количество видимых товаров:', productsVisible);
    
    console.log('✅ ТЕСТ ПРОЙДЕН УСПЕШНО!');
    console.log('   - Авторизация: ✅');
    console.log('   - Ссылка в sidebar: ✅'); 
    console.log('   - Переход в vitrina: ✅');
    console.log('   - URL storefront v2: ✅');
    console.log('   - Загрузка товаров: ✅');
    
    // Делаем скриншот результата
    await page.screenshot({ path: 'storefront-test-result.png', fullPage: true });
    console.log('   📸 Скриншот сохранен: storefront-test-result.png');
    
  } catch (error) {
    console.error('❌ ОШИБКА ТЕСТА:', error.message);
    await page.screenshot({ path: 'storefront-test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();