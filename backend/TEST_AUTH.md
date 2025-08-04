# Тестовая авторизация

## Быстрый старт

### 1. Создание тестового магазина

#### Вариант A: Через API endpoint (только в DEBUG режиме)
```bash
curl -X POST http://localhost:8000/api/auth/create-test-shop
```

#### Вариант B: Через скрипт
```bash
cd backend
python scripts/create_test_shop.py
```

### 2. Вход в систему

Используйте следующие данные для входа:

- **Телефон**: `+7 701 123 45 67`
- **Код подтверждения**: Любой 6-значный код (например, `123456`)

> **Важно**: Это работает только когда `DEBUG=True` в настройках

### 3. Проверка авторизации

После входа вы получите JWT токен. Используйте его для доступа к API:

```bash
# Получить информацию о текущем магазине
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/auth/me

# Получить список заказов
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/orders/
```

## Production режим

В production режиме:
1. Endpoint `/api/auth/create-test-shop` недоступен
2. OTP коды отправляются через Telegram бот @lekenbot
3. Необходимо использовать реальный номер телефона

## Troubleshooting

### Ошибка "Not authenticated"
- Убедитесь что токен сохранен в localStorage
- Проверьте что токен передается в заголовке Authorization
- Проверьте срок действия токена (30 минут по умолчанию)

### Ошибка "API endpoint not found"
- Проверьте что бэкенд запущен
- Убедитесь что используется правильный URL
- Проверьте логи бэкенда на наличие ошибок маршрутизации