// Тестовый скрипт для проверки интеграции
const axios = require('axios');

async function testIntegration() {
  console.log('🔍 Тестирование интеграции фронтенда и бэкенда...\n');
  
  try {
    // 1. Проверка API документации
    console.log('1. Проверка API документации:');
    const docsResponse = await axios.get('http://localhost:8000/api/docs');
    console.log('✅ API документация доступна\n');
    
    // 2. Получение списка заказов
    console.log('2. Получение списка заказов:');
    const ordersResponse = await axios.get('http://localhost:8000/api/orders/');
    console.log(`✅ Найдено заказов: ${ordersResponse.data.total}`);
    console.log('Заказы:', ordersResponse.data.items.map(order => ({
      id: order.id,
      status: order.status,
      customer: order.customer_phone,
      total: order.total
    })));
    console.log();
    
    // 3. Проверка трекинга
    console.log('3. Проверка трекинга:');
    const trackingToken = ordersResponse.data.items[0]?.tracking_token;
    if (trackingToken) {
      const trackingResponse = await axios.get(`http://localhost:8000/api/tracking/${trackingToken}`);
      console.log('✅ Трекинг работает:', {
        status: trackingResponse.data.status,
        address: trackingResponse.data.address
      });
    }
    console.log();
    
    // 4. Проверка прокси через фронтенд
    console.log('4. Проверка прокси через фронтенд:');
    try {
      const proxyResponse = await axios.get('http://localhost:5174/api/orders/');
      console.log('✅ Прокси работает корректно');
      console.log(`   Получено заказов через прокси: ${proxyResponse.data.total}`);
    } catch (error) {
      console.log('❌ Прокси не настроен или не работает');
    }
    
    console.log('\n✨ Интеграция работает успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    if (error.response) {
      console.error('   Статус:', error.response.status);
      console.error('   Данные:', error.response.data);
    }
  }
}

testIntegration();