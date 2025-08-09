import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Генерирует уникальный номер телефона для тестов
 * Использует timestamp для уникальности
 */
export function generateUniquePhone(): string {
  // Используем последние 7 цифр timestamp для уникальности
  const timestamp = Date.now();
  const lastDigits = timestamp.toString().slice(-7);
  // Формат: +7 777 XXX XX XX
  return `+7777${lastDigits}`;
}

/**
 * Очищает rate limit для номера телефона в Redis
 */
export async function clearRateLimit(phone: string): Promise<void> {
  try {
    const cleanPhone = phone.replace(/\s/g, '');
    await execAsync(`redis-cli DEL "otp:rate:${cleanPhone}" 2>/dev/null || true`);
  } catch (error) {
    // Игнорируем ошибки если Redis не запущен
    console.log('Redis clear failed (might not be running):', error);
  }
}

/**
 * Очищает все тестовые данные из Redis
 */
export async function clearAllTestData(): Promise<void> {
  try {
    // Очищаем все OTP коды и rate limits для тестовых номеров (+7777*)
    await execAsync(`redis-cli --scan --pattern "otp:*+7777*" | xargs -L 1 redis-cli DEL 2>/dev/null || true`);
    await execAsync(`redis-cli --scan --pattern "session:*" | xargs -L 1 redis-cli DEL 2>/dev/null || true`);
  } catch (error) {
    console.log('Redis cleanup failed:', error);
  }
}

/**
 * Ждёт указанное время (для избежания rate limiting)
 */
export async function waitForRateLimit(ms: number = 1000): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Проверяет доступность сервисов
 */
export async function checkServicesHealth(): Promise<{
  frontend: boolean;
  backend: boolean;
  redis: boolean;
}> {
  const results = {
    frontend: false,
    backend: false,
    redis: false
  };

  // Проверяем frontend
  try {
    const response = await fetch('http://localhost:5182');
    results.frontend = response.ok;
  } catch {
    results.frontend = false;
  }

  // Проверяем backend
  try {
    const response = await fetch('http://localhost:8000/health');
    results.backend = response.ok;
  } catch {
    results.backend = false;
  }

  // Проверяем Redis
  try {
    await execAsync('redis-cli ping');
    results.redis = true;
  } catch {
    results.redis = false;
  }

  return results;
}

/**
 * Создаёт тестовый заказ через API
 */
export async function createTestOrder(authToken: string): Promise<{
  id: number;
  tracking_token: string;
}> {
  const response = await fetch('http://localhost:8000/api/orders/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      customer_phone: generateUniquePhone(),
      customer_name: 'Тестовый клиент',
      items: [
        {
          product_name: 'Тестовый букет',
          quantity: 1,
          price: 10000
        }
      ],
      delivery_address: 'Тестовый адрес',
      delivery_date: new Date().toISOString().split('T')[0],
      delivery_window: {
        from: '10:00',
        to: '12:00'
      },
      total: 10000,
      status: 'new'
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to create test order: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Получает JWT токен для тестов
 */
export async function getTestAuthToken(phone?: string): Promise<string> {
  const testPhone = phone || generateUniquePhone();
  
  // Запрашиваем OTP
  const otpResponse = await fetch('http://localhost:8000/api/auth/request-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: testPhone })
  });

  if (!otpResponse.ok) {
    throw new Error('Failed to request OTP');
  }

  const otpData = await otpResponse.json();
  const otp = otpData.otp; // В DEBUG режиме OTP возвращается в ответе

  // Верифицируем OTP
  const verifyResponse = await fetch('http://localhost:8000/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      phone: testPhone,
      otp_code: otp 
    })
  });

  if (!verifyResponse.ok) {
    throw new Error('Failed to verify OTP');
  }

  const verifyData = await verifyResponse.json();
  return verifyData.access_token;
}