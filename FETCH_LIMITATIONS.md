# Ограничения при фетчинге документации

## Проблема

Страница документации Swagger UI не доступна для фетчинга через некоторые инструменты из-за большого размера результирующего DOM.

### Причины:

1. **Большая OpenAPI схема**: ~163KB JSON файл с описанием 100+ эндпоинтов
2. **Swagger UI рендеринг**: Создает интерактивные элементы для каждого эндпоинта
3. **Результирующий DOM**: >48000 токенов после рендеринга

## Решения

### 1. Использовать прямые ссылки на схему

Вместо загрузки Swagger UI страницы, используйте OpenAPI схему напрямую:

```bash
# Получить OpenAPI схему
curl https://cvety-kz-production.up.railway.app/openapi.json

# Или для ReDoc
curl https://cvety-kz-production.up.railway.app/redoc
```

### 2. Разделить документацию по модулям

Создать отдельные страницы для каждого модуля:
- `/docs/auth` - только авторизация
- `/docs/orders` - только заказы
- `/docs/products` - только товары
- и т.д.

### 3. Использовать статическую документацию

Сгенерировать статический HTML без JavaScript:

```bash
# Использовать redoc-cli для генерации статического HTML
npx redoc-cli bundle openapi.json -o static-docs.html
```

### 4. Оптимизировать OpenAPI схему

```python
# В FastAPI можно исключить некоторые эндпоинты из документации
@app.get("/internal-endpoint", include_in_schema=False)
def internal_endpoint():
    pass
```

### 5. Использовать пагинацию в Swagger UI

```javascript
// Настройка Swagger UI с пагинацией
const ui = SwaggerUIBundle({
    url: '/openapi.json',
    dom_id: "#swagger-ui",
    deepLinking: true,
    docExpansion: "none",  // Не раскрывать все эндпоинты сразу
    defaultModelsExpandDepth: -1,  // Скрыть модели по умолчанию
    displayRequestDuration: true,
    filter: true  // Включить фильтр
})
```

## Альтернативные способы доступа

### 1. Postman коллекция
Импортировать OpenAPI схему в Postman:
```bash
curl https://cvety-kz-production.up.railway.app/openapi.json > cvety-api.json
# Импортировать cvety-api.json в Postman
```

### 2. Использовать ReDoc
ReDoc обычно более легковесный:
https://cvety-kz-production.up.railway.app/redoc

### 3. Локальная документация
```bash
# Скачать схему и открыть локально
curl https://cvety-kz-production.up.railway.app/openapi.json > openapi.json
npx swagger-ui-react-cli openapi.json
```

### 4. API клиенты
Использовать готовые клиенты из `/docs/examples/`:
- Python: `docs/examples/python/client.py`
- JavaScript: `docs/examples/javascript/client.js`
- Telegram Bot: `docs/examples/telegram-bot/bot.py`

## Рекомендации для разработчиков

1. **Для просмотра документации**: Используйте браузер напрямую
2. **Для автоматизации**: Используйте OpenAPI JSON схему
3. **Для тестирования**: Импортируйте в Postman или Insomnia
4. **Для интеграции**: Используйте примеры кода

## Технические детали

```yaml
Размеры:
  HTML страница: 944 байта
  OpenAPI JSON: 163 KB
  Рендеренный DOM: >2 MB
  Токены в DOM: >48000
```

## Будущие улучшения

1. Разделить API на микросервисы с отдельной документацией
2. Создать упрощенную версию документации для быстрого доступа
3. Настроить CDN для статических ресурсов
4. Использовать GraphQL с интроспекцией вместо REST