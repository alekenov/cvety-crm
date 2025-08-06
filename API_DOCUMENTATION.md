# 🌸 Cvety.kz API Documentation

> **Полная документация API для интеграции с системой управления цветочным магазином**

[![API Version](https://img.shields.io/badge/API-v1.0.0-blue)](https://api.cvety.kz)
[![OpenAPI](https://img.shields.io/badge/OpenAPI-3.0-green)](https://api.cvety.kz/openapi.json)
[![Status](https://img.shields.io/badge/Status-Production-success)](https://status.cvety.kz)

## 📚 Содержание

- [Быстрый старт](#-быстрый-старт)
- [Базовая информация](#-базовая-информация)
- [Аутентификация](#-аутентификация)
- [Основные модули API](#-основные-модули-api)
  - [Заказы (Orders)](#-заказы-orders)
  - [Товары (Products)](#-товары-products)
  - [Клиенты (Customers)](#-клиенты-customers)
  - [Склад (Warehouse)](#-склад-warehouse)
  - [Производство (Production)](#-производство-production)
  - [Отслеживание (Tracking)](#-отслеживание-tracking)
- [Публичные API](#-публичные-api)
- [Webhooks](#-webhooks)
- [Примеры интеграций](#-примеры-интеграций)
- [Обработка ошибок](#-обработка-ошибок)
- [Rate Limiting](#-rate-limiting)
- [SDK и библиотеки](#-sdk-и-библиотеки)
- [FAQ](#-faq)

---

## 🚀 Быстрый старт

### 1. Получите доступ к API

```bash
# Запросите OTP код
curl -X POST https://api.cvety.kz/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+77011234567"}'

# Подтвердите OTP и получите токен
curl -X POST https://api.cvety.kz/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+77011234567", "otp_code": "123456"}'
```

### 2. Используйте токен для запросов

```bash
# Получите список заказов
curl -X GET https://api.cvety.kz/api/orders/ \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. Тестовая среда

Для разработки используйте тестовую среду:
- **URL**: `https://test.api.cvety.kz`
- **Тестовый телефон**: `+77011234567`
- **OTP код**: любой 6-значный (например, `123456`)

---

## 📋 Базовая информация

### Endpoints

| Среда | URL | Описание |
|-------|-----|----------|
| Production | `https://api.cvety.kz/api` | Основной API |
| Testing | `https://test.api.cvety.kz/api` | Тестовая среда |
| Local | `http://localhost:8000/api` | Локальная разработка |

### Документация

| Тип | URL | Описание |
|-----|-----|----------|
| Swagger UI | `/docs` | Интерактивная документация |
| ReDoc | `/redoc` | Альтернативная документация |
| OpenAPI Schema | `/openapi.json` | OpenAPI 3.0 спецификация |
| Postman | [Download](https://api.cvety.kz/postman.json) | Postman коллекция |

### Форматы данных

| Тип данных | Формат | Пример |
|------------|--------|--------|
| Дата/время | ISO 8601 | `2024-12-26T14:30:00+06:00` |
| Телефон | `+7XXXXXXXXXX` | `+77011234567` |
| Валюта | KZT (тенге) | `25000` (без копеек) |
| Tracking Token | 9 цифр | `123456789` |

---

## 🔐 Аутентификация

### Схема аутентификации

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Telegram
    participant User
    
    Client->>API: POST /auth/request-otp
    API->>Telegram: Отправка OTP
    Telegram->>User: OTP код в @cvety_kz_bot
    User->>Client: Вводит OTP
    Client->>API: POST /auth/verify-otp
    API->>Client: JWT Token
    Client->>API: Запросы с Bearer Token
```

### 1. Запрос OTP кода

<details>
<summary><b>POST</b> <code>/api/auth/request-otp</code></summary>

#### Запрос
```json
{
  "phone": "+77011234567"
}
```

#### Успешный ответ (201)
```json
{
  "message": "OTP отправлен на ваш Telegram",
  "delivery_method": "telegram",
  "expires_in": 300
}
```

#### Ошибка - превышен лимит (429)
```json
{
  "detail": "Превышен лимит запросов. Попробуйте через 60 секунд",
  "retry_after": 60
}
```

#### Примеры на разных языках

**Python:**
```python
import requests

response = requests.post(
    "https://api.cvety.kz/api/auth/request-otp",
    json={"phone": "+77011234567"}
)
print(response.json())
```

**JavaScript:**
```javascript
const response = await fetch('https://api.cvety.kz/api/auth/request-otp', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({phone: '+77011234567'})
});
const data = await response.json();
```

**PHP:**
```php
$client = new \GuzzleHttp\Client();
$response = $client->post('https://api.cvety.kz/api/auth/request-otp', [
    'json' => ['phone' => '+77011234567']
]);
```
</details>

### 2. Подтверждение OTP

<details>
<summary><b>POST</b> <code>/api/auth/verify-otp</code></summary>

#### Запрос
```json
{
  "phone": "+77011234567",
  "otp_code": "123456"
}
```

#### Успешный ответ (200)
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 86400,
  "shop_id": 1,
  "shop_name": "Цветочный магазин 4567",
  "permissions": ["orders", "products", "customers"]
}
```

#### Ошибка - неверный код (400)
```json
{
  "detail": "Неверный или истекший OTP код"
}
```

#### Использование токена
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```
</details>

### 3. Обновление токена

<details>
<summary><b>POST</b> <code>/api/auth/refresh</code></summary>

#### Запрос
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Ответ
```json
{
  "access_token": "new_token_here",
  "expires_in": 86400
}
```
</details>

---

## 📦 Основные модули API

## 📦 Заказы (Orders)

Управление полным жизненным циклом заказов.

### Статусы заказов

```mermaid
graph LR
    new[Новый] --> paid[Оплачен]
    paid --> assembled[Собран]
    assembled --> delivery[Доставка]
    assembled --> self_pickup[Самовывоз]
    delivery --> delivered[Доставлен]
    self_pickup --> completed[Выполнен]
    delivered --> completed
    
    new -.-> cancelled[Отменен]
    paid -.-> issue[Проблема]
    assembled -.-> issue
    delivery -.-> issue
```

### Получение списка заказов

<details>
<summary><b>GET</b> <code>/api/orders/</code></summary>

#### Параметры запроса

| Параметр | Тип | Описание | Пример |
|----------|-----|----------|--------|
| `page` | int | Номер страницы (от 1) | `1` |
| `limit` | int | Записей на странице (макс 100) | `20` |
| `status` | string | Фильтр по статусу | `paid` |
| `search` | string | Поиск по телефону/имени/ID | `Айгуль` |
| `dateFrom` | datetime | Начальная дата | `2024-12-01T00:00:00` |
| `dateTo` | datetime | Конечная дата | `2024-12-31T23:59:59` |
| `sort` | string | Сортировка | `-created_at` |

#### Пример запроса
```bash
curl -X GET "https://api.cvety.kz/api/orders/?status=paid&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Успешный ответ (200)
```json
{
  "items": [
    {
      "id": 1234,
      "created_at": "2024-12-26T10:30:00+06:00",
      "updated_at": "2024-12-26T11:00:00+06:00",
      "status": "paid",
      "status_display": "Оплачен",
      "customer_phone": "+77011234567",
      "customer_name": "Иван Петров",
      "recipient_phone": "+77017654321",
      "recipient_name": "Айгуль Касымова",
      "address": "г. Алматы, пр. Достык 89, кв. 45",
      "delivery_method": "delivery",
      "delivery_window": {
        "from": "2024-12-26T14:00:00+06:00",
        "to": "2024-12-26T16:00:00+06:00"
      },
      "delivery_fee": 2000,
      "flower_sum": 25000,
      "discount": 0,
      "total": 27000,
      "payment_method": "kaspi",
      "payment_status": "paid",
      "tracking_token": "123456789",
      "tracking_url": "https://cvety.kz/tracking/123456789",
      "comment": "Позвонить за час до доставки",
      "florist": {
        "id": 5,
        "name": "Марина",
        "phone": "+77051234567"
      },
      "customer": {
        "id": 100,
        "name": "Иван Петров",
        "phone": "+77011234567",
        "orders_count": 5,
        "total_spent": 125000,
        "last_order_date": "2024-12-20T15:30:00+06:00"
      },
      "items": [
        {
          "id": 1,
          "product_id": 10,
          "product_name": "Букет роз 'Классика'",
          "product_category": "bouquet",
          "quantity": 1,
          "price": 25000,
          "total": 25000,
          "notes": "25 красных роз"
        }
      ],
      "photos": [
        {
          "id": 1,
          "url": "https://api.cvety.kz/uploads/orders/1234/photo1.jpg",
          "thumbnail": "https://api.cvety.kz/uploads/orders/1234/photo1_thumb.jpg",
          "uploaded_at": "2024-12-26T13:00:00+06:00"
        }
      ],
      "history": [
        {
          "status": "new",
          "changed_at": "2024-12-26T10:30:00+06:00",
          "changed_by": "Система"
        },
        {
          "status": "paid",
          "changed_at": "2024-12-26T10:35:00+06:00",
          "changed_by": "Kaspi Pay"
        }
      ]
    }
  ],
  "total": 150,
  "page": 1,
  "pages": 15,
  "has_next": true,
  "has_prev": false
}
```
</details>

### Создание заказа

<details>
<summary><b>POST</b> <code>/api/orders/</code></summary>

#### Запрос
```json
{
  "customer_phone": "+77011234567",
  "customer_name": "Иван Петров",
  "recipient_phone": "+77017654321",
  "recipient_name": "Айгуль Касымова",
  "address": "г. Алматы, пр. Достык 89, кв. 45",
  "delivery_method": "delivery",
  "delivery_date": "2024-12-26",
  "delivery_window": {
    "from_time": "14:00",
    "to_time": "16:00"
  },
  "flower_sum": 25000,
  "delivery_fee": 2000,
  "discount": 0,
  "total": 27000,
  "payment_method": "kaspi",
  "comment": "Позвонить за час до доставки",
  "source": "website"
}
```

#### Успешный ответ (201)
```json
{
  "id": 1235,
  "tracking_token": "987654321",
  "tracking_url": "https://cvety.kz/tracking/987654321",
  "status": "new",
  "created_at": "2024-12-26T12:00:00+06:00"
}
```

#### Валидационная ошибка (422)
```json
{
  "detail": [
    {
      "loc": ["body", "customer_phone"],
      "msg": "Неверный формат телефона",
      "type": "value_error"
    }
  ]
}
```
</details>

### Создание заказа с позициями

<details>
<summary><b>POST</b> <code>/api/orders/with-items</code></summary>

#### Запрос
```json
{
  "customer_phone": "+77011234567",
  "recipient_name": "Айгуль",
  "address": "пр. Достык 89",
  "delivery_method": "delivery",
  "delivery_date": "2024-12-26",
  "delivery_window": {
    "from_time": "14:00",
    "to_time": "16:00"
  },
  "delivery_fee": 2000,
  "items": [
    {
      "product_id": 10,
      "quantity": 1,
      "price": 25000,
      "notes": "С красной лентой"
    },
    {
      "product_id": 15,
      "quantity": 2,
      "price": 5000,
      "notes": null
    }
  ],
  "comment": "Доставить точно в указанное время"
}
```

#### Успешный ответ (201)
```json
{
  "id": 1236,
  "tracking_token": "456789123",
  "status": "new",
  "flower_sum": 35000,
  "delivery_fee": 2000,
  "total": 37000,
  "items": [
    {
      "id": 100,
      "product_id": 10,
      "product_name": "Букет роз 'Классика'",
      "quantity": 1,
      "price": 25000,
      "total": 25000
    },
    {
      "id": 101,
      "product_id": 15,
      "product_name": "Открытка",
      "quantity": 2,
      "price": 5000,
      "total": 10000
    }
  ]
}
```
</details>

### Обновление статуса заказа

<details>
<summary><b>PATCH</b> <code>/api/orders/{order_id}/status</code></summary>

#### Запрос
```json
{
  "status": "paid",
  "comment": "Оплачено через Kaspi Pay"
}
```

#### Успешный ответ (200)
```json
{
  "id": 1234,
  "status": "paid",
  "status_display": "Оплачен",
  "updated_at": "2024-12-26T12:30:00+06:00"
}
```

#### Ошибка - недопустимый переход (400)
```json
{
  "detail": "Невозможно изменить статус с 'delivered' на 'paid'"
}
```
</details>

### Отметка проблемы

<details>
<summary><b>PATCH</b> <code>/api/orders/{order_id}/issue</code></summary>

#### Запрос
```json
{
  "issue_type": "wrong_address",
  "comment": "Клиент указал неправильный адрес. Новый адрес: ул. Сатпаева 22"
}
```

#### Типы проблем
- `wrong_address` - Неправильный адрес
- `recipient_unavailable` - Получатель недоступен
- `quality_issue` - Проблема с качеством
- `wrong_order` - Неправильный заказ
- `delivery_delay` - Задержка доставки
- `payment_issue` - Проблема с оплатой
- `other` - Другое

#### Успешный ответ (200)
```json
{
  "id": 1234,
  "status": "issue",
  "issue_type": "wrong_address",
  "issue_comment": "Клиент указал неправильный адрес. Новый адрес: ул. Сатпаева 22",
  "issue_reported_at": "2024-12-26T15:00:00+06:00"
}
```
</details>

---

## 🌷 Товары (Products)

### Получение каталога товаров

<details>
<summary><b>GET</b> <code>/api/products/</code></summary>

#### Параметры запроса

| Параметр | Тип | Описание | Значения |
|----------|-----|----------|----------|
| `category` | string | Категория | `bouquet`, `composition`, `gift`, `other` |
| `search` | string | Поиск по названию | - |
| `is_popular` | bool | Популярные | `true`, `false` |
| `is_new` | bool | Новинки | `true`, `false` |
| `on_sale` | bool | Со скидкой | `true`, `false` |
| `min_price` | int | Мин. цена | - |
| `max_price` | int | Макс. цена | - |
| `is_active` | bool | Активные | `true`, `false` |

#### Пример запроса
```bash
curl -X GET "https://api.cvety.kz/api/products/?category=bouquet&is_popular=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Успешный ответ (200)
```json
{
  "items": [
    {
      "id": 10,
      "name": "Букет роз 'Классика'",
      "category": "bouquet",
      "category_display": "Букет",
      "description": "25 красных роз премиум класса из Эквадора",
      "cost_price": 12000,
      "retail_price": 25000,
      "sale_price": 22500,
      "discount_percentage": 10,
      "current_price": 22500,
      "is_active": true,
      "is_popular": true,
      "is_new": false,
      "in_stock": true,
      "stock_quantity": 15,
      "images": [
        {
          "id": 1,
          "url": "https://api.cvety.kz/uploads/products/10/main.jpg",
          "thumbnail": "https://api.cvety.kz/uploads/products/10/thumb.jpg",
          "is_main": true
        }
      ],
      "ingredients": [
        {
          "id": 1,
          "name": "Роза красная 50см",
          "quantity": 25,
          "unit": "шт"
        },
        {
          "id": 2,
          "name": "Упаковка крафт",
          "quantity": 1,
          "unit": "шт"
        }
      ],
      "stats": {
        "orders_count": 45,
        "revenue": 1125000,
        "last_ordered": "2024-12-25T18:30:00+06:00"
      }
    }
  ],
  "total": 50
}
```
</details>

### Создание товара

<details>
<summary><b>POST</b> <code>/api/products/</code></summary>

#### Запрос
```json
{
  "name": "Букет тюльпанов 'Весна'",
  "category": "bouquet",
  "description": "31 тюльпан в стильной упаковке",
  "cost_price": 8000,
  "retail_price": 18000,
  "sale_price": null,
  "is_active": true,
  "is_popular": false,
  "is_new": true,
  "ingredients": [
    {
      "name": "Тюльпан",
      "quantity": 31,
      "unit": "шт"
    }
  ]
}
```

#### Успешный ответ (201)
```json
{
  "id": 11,
  "name": "Букет тюльпанов 'Весна'",
  "created_at": "2024-12-26T16:00:00+06:00"
}
```
</details>

---

## 👥 Клиенты (Customers)

### Получение списка клиентов

<details>
<summary><b>GET</b> <code>/api/customers/</code></summary>

#### Параметры запроса

| Параметр | Тип | Описание |
|----------|-----|----------|
| `search` | string | Поиск по телефону/имени/email |
| `has_orders` | bool | Только с заказами |
| `min_spent` | int | Минимальная сумма покупок |
| `sort` | string | Сортировка (`-total_spent`, `name`) |

#### Успешный ответ (200)
```json
{
  "items": [
    {
      "id": 100,
      "phone": "+77011234567",
      "name": "Иван Петров",
      "email": "ivan@example.com",
      "birth_date": "1990-05-15",
      "address": "ул. Абая 10",
      "preferences": "Любит белые розы",
      "orders_count": 5,
      "total_spent": 125000,
      "average_order": 25000,
      "last_order_date": "2024-12-20T15:30:00+06:00",
      "created_at": "2024-01-15T10:00:00+06:00",
      "tags": ["VIP", "Постоянный"],
      "important_dates": [
        {
          "id": 1,
          "date_type": "birthday",
          "date": "1990-05-15",
          "description": "День рождения",
          "reminder_days": 3
        }
      ],
      "addresses": [
        {
          "id": 1,
          "address": "ул. Абая 10",
          "is_default": true
        }
      ]
    }
  ],
  "total": 500
}
```
</details>

### Создание клиента

<details>
<summary><b>POST</b> <code>/api/customers/</code></summary>

#### Запрос
```json
{
  "phone": "+77017654321",
  "name": "Мария Иванова",
  "email": "maria@example.com",
  "birth_date": "1992-03-08",
  "address": "пр. Достык 50",
  "preferences": "Предпочитает пастельные тона",
  "tags": ["Новый клиент"]
}
```

#### Успешный ответ (201)
```json
{
  "id": 101,
  "phone": "+77017654321",
  "name": "Мария Иванова",
  "created_at": "2024-12-26T17:00:00+06:00"
}
```
</details>

### История заказов клиента

<details>
<summary><b>GET</b> <code>/api/customers/{customer_id}/orders</code></summary>

#### Успешный ответ (200)
```json
{
  "items": [
    {
      "id": 1234,
      "created_at": "2024-12-20T15:30:00+06:00",
      "status": "completed",
      "total": 27000,
      "tracking_token": "123456789",
      "items_count": 2
    }
  ],
  "total": 5,
  "stats": {
    "total_orders": 5,
    "total_spent": 125000,
    "average_order": 25000,
    "favorite_category": "bouquet"
  }
}
```
</details>

---

## 📊 Склад (Warehouse)

### Получение складских позиций

<details>
<summary><b>GET</b> <code>/api/warehouse/</code></summary>

#### Параметры запроса

| Параметр | Тип | Описание |
|----------|-----|----------|
| `variety` | string | Сорт цветов |
| `supplier` | string | Поставщик |
| `farm` | string | Ферма |
| `onShowcase` | bool | На витрине |
| `toWriteOff` | bool | К списанию |
| `search` | string | Поиск |

#### Успешный ответ (200)
```json
{
  "items": [
    {
      "id": 1,
      "variety": "Роза Красная",
      "height_cm": 50,
      "supplier": "Flower Direct",
      "farm": "Ecuador Roses",
      "arrival_date": "2024-12-20T10:00:00+06:00",
      "qty_initial": 200,
      "qty_current": 150,
      "qty_sold": 50,
      "qty_writeoff": 0,
      "cost_per_stem": 235,
      "currency": "KZT",
      "total_cost": 47000,
      "on_showcase": true,
      "days_in_stock": 6,
      "freshness_status": "fresh"
    }
  ],
  "total": 25,
  "stats": {
    "total_value": 1250000,
    "total_stems": 3500,
    "suppliers_count": 5
  }
}
```
</details>

### Создание поставки

<details>
<summary><b>POST</b> <code>/api/warehouse/deliveries</code></summary>

#### Запрос
```json
{
  "supplier": "Flower Direct",
  "farm": "Ecuador Roses",
  "delivery_date": "2024-12-26T10:00:00",
  "currency": "USD",
  "exchange_rate": 470.0,
  "positions": [
    {
      "variety": "Роза Красная",
      "height_cm": 50,
      "qty": 200,
      "cost_per_stem": 0.5,
      "packaging": "Коробка 25шт"
    },
    {
      "variety": "Роза Белая",
      "height_cm": 60,
      "qty": 150,
      "cost_per_stem": 0.6
    }
  ],
  "delivery_cost": 50,
  "notes": "Премиум качество"
}
```

#### Успешный ответ (201)
```json
{
  "id": 100,
  "delivery_number": "DEL-2024-100",
  "total_stems": 350,
  "total_cost_original": 225,
  "total_cost_kzt": 105750,
  "created_at": "2024-12-26T10:00:00+06:00"
}
```
</details>

---

## 🎨 Производство (Production)

### Получение задач производства

<details>
<summary><b>GET</b> <code>/api/production/tasks/</code></summary>

#### Параметры запроса

| Параметр | Тип | Описание |
|----------|-----|----------|
| `status` | string | Статус задачи |
| `priority` | string | Приоритет |
| `florist_id` | int | ID флориста |
| `order_id` | int | ID заказа |

#### Статусы задач
- `pending` - Ожидает
- `assigned` - Назначено
- `in_progress` - В работе
- `completed` - Завершено
- `cancelled` - Отменено

#### Приоритеты
- `low` - Низкий
- `normal` - Обычный
- `high` - Высокий
- `urgent` - Срочный

#### Успешный ответ (200)
```json
{
  "items": [
    {
      "id": 50,
      "order_id": 1234,
      "task_type": "bouquet",
      "priority": "urgent",
      "status": "assigned",
      "deadline": "2024-12-26T13:00:00+06:00",
      "florist": {
        "id": 5,
        "name": "Марина",
        "phone": "+77051234567"
      },
      "items": [
        {
          "product_name": "Букет роз 'Классика'",
          "quantity": 1,
          "special_requests": "Добавить открытку с поздравлением"
        }
      ],
      "assigned_at": "2024-12-26T10:00:00+06:00",
      "started_at": null,
      "completed_at": null,
      "time_estimate_minutes": 30,
      "photos": []
    }
  ],
  "total": 15
}
```
</details>

### Создание задачи производства

<details>
<summary><b>POST</b> <code>/api/production/tasks/</code></summary>

#### Запрос
```json
{
  "order_id": 1235,
  "task_type": "bouquet",
  "priority": "high",
  "deadline": "2024-12-26T14:00:00",
  "florist_id": 5,
  "items": [
    {
      "product_name": "Букет тюльпанов",
      "quantity": 2,
      "special_requests": "Яркая упаковка"
    }
  ],
  "time_estimate_minutes": 45,
  "notes": "Клиент заберет в 14:00"
}
```

#### Успешный ответ (201)
```json
{
  "id": 51,
  "status": "assigned",
  "created_at": "2024-12-26T11:00:00+06:00"
}
```
</details>

---

## 📍 Отслеживание (Tracking)

### Публичное отслеживание заказа

<details>
<summary><b>GET</b> <code>/api/tracking/{tracking_token}</code> 🔓 Без авторизации</summary>

#### Пример запроса
```bash
curl -X GET "https://api.cvety.kz/api/tracking/123456789"
```

#### Успешный ответ (200)
```json
{
  "tracking_token": "123456789",
  "status": "delivery",
  "status_display": "В доставке",
  "updated_at": "2024-12-26T13:00:00+06:00",
  "delivery_method": "delivery",
  "delivery_window": {
    "from": "2024-12-26T14:00:00+06:00",
    "to": "2024-12-26T16:00:00+06:00"
  },
  "address_masked": "г. Алматы, пр. ******, д. 89",
  "courier": {
    "name": "Курьер",
    "phone": "+7705*****67"
  },
  "timeline": [
    {
      "status": "new",
      "status_display": "Новый заказ",
      "timestamp": "2024-12-26T10:30:00+06:00"
    },
    {
      "status": "paid",
      "status_display": "Оплачен",
      "timestamp": "2024-12-26T10:35:00+06:00"
    },
    {
      "status": "assembled",
      "status_display": "Собран",
      "timestamp": "2024-12-26T12:00:00+06:00"
    },
    {
      "status": "delivery",
      "status_display": "В доставке",
      "timestamp": "2024-12-26T13:00:00+06:00"
    }
  ],
  "photos": [
    {
      "url": "https://api.cvety.kz/uploads/orders/1234/photo1.jpg",
      "uploaded_at": "2024-12-26T12:30:00+06:00"
    }
  ],
  "can_leave_feedback": true
}
```

#### Ошибка - заказ не найден (404)
```json
{
  "detail": "Заказ с указанным номером отслеживания не найден"
}
```
</details>

---

## 🌐 Публичные API

### Получение информации о магазине

<details>
<summary><b>GET</b> <code>/api/public/shops/{shop_id}</code> 🔓 Без авторизации</summary>

#### Успешный ответ (200)
```json
{
  "id": 1,
  "name": "Цветочный магазин Cvety.kz",
  "phone": "+77011234567",
  "whatsapp": "+77011234567",
  "telegram": "@cvety_kz",
  "instagram": "@cvety.kz",
  "address": "г. Алматы, пр. Достык 89",
  "working_hours": {
    "weekdays": "09:00 - 20:00",
    "saturday": "10:00 - 18:00",
    "sunday": "10:00 - 16:00"
  },
  "delivery_zones": [
    {
      "name": "Центр города",
      "price": 2000
    },
    {
      "name": "Окраины",
      "price": 3000
    }
  ],
  "payment_methods": ["kaspi", "cash", "card"],
  "rating": 4.8,
  "reviews_count": 245
}
```
</details>

### Публичный каталог товаров

<details>
<summary><b>GET</b> <code>/api/public/products</code> 🔓 Без авторизации</summary>

#### Параметры запроса

| Параметр | Тип | Описание |
|----------|-----|----------|
| `shop_id` | int | ID магазина (обязательно) |
| `category` | string | Категория |
| `min_price` | int | Мин. цена |
| `max_price` | int | Макс. цена |

#### Успешный ответ (200)
```json
{
  "items": [
    {
      "id": 10,
      "name": "Букет роз 'Классика'",
      "category": "bouquet",
      "price": 25000,
      "sale_price": 22500,
      "images": [
        "https://api.cvety.kz/uploads/products/10/main.jpg"
      ],
      "in_stock": true
    }
  ],
  "total": 50
}
```
</details>

### Создание заказа с витрины

<details>
<summary><b>POST</b> <code>/api/public/orders</code> 🔓 Без авторизации</summary>

#### Запрос
```json
{
  "shop_id": 1,
  "customer_phone": "+77011234567",
  "customer_name": "Иван",
  "recipient_phone": "+77017654321",
  "recipient_name": "Айгуль",
  "address": "пр. Достык 89",
  "delivery_date": "2024-12-26",
  "delivery_time": "14:00-16:00",
  "items": [
    {
      "product_id": 10,
      "quantity": 1
    }
  ],
  "comment": "Позвонить за час",
  "payment_method": "kaspi"
}
```

#### Успешный ответ (201)
```json
{
  "order_id": 1236,
  "tracking_token": "987654321",
  "tracking_url": "https://cvety.kz/tracking/987654321",
  "payment_url": "https://kaspi.kz/pay/...",
  "total": 27000
}
```
</details>

---

## 🔔 Webhooks

### Настройка webhooks

Webhooks настраиваются через API или в личном кабинете.

### Доступные события

| Событие | Описание |
|---------|----------|
| `order.created` | Создан новый заказ |
| `order.status_changed` | Изменен статус заказа |
| `order.paid` | Заказ оплачен |
| `order.completed` | Заказ выполнен |
| `payment.received` | Получена оплата |
| `customer.created` | Новый клиент |

### Формат webhook запроса

```json
{
  "event": "order.status_changed",
  "timestamp": "2024-12-26T14:30:00+06:00",
  "shop_id": 1,
  "data": {
    "order_id": 1234,
    "old_status": "new",
    "new_status": "paid",
    "tracking_token": "123456789"
  }
}
```

### Проверка подписи

Все webhooks содержат HMAC-SHA256 подпись в заголовке `X-Webhook-Signature`.

```python
import hmac
import hashlib

def verify_webhook(payload: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)
```

---

## 💻 Примеры интеграций

### Python (requests)

```python
import requests
from typing import Dict, Optional

class CvetyKzAPI:
    def __init__(self, base_url: str = "https://api.cvety.kz"):
        self.base_url = base_url
        self.token: Optional[str] = None
        
    def authenticate(self, phone: str, otp: str) -> str:
        """Аутентификация и получение токена"""
        response = requests.post(
            f"{self.base_url}/api/auth/verify-otp",
            json={"phone": phone, "otp_code": otp}
        )
        response.raise_for_status()
        self.token = response.json()["access_token"]
        return self.token
    
    def get_orders(self, status: Optional[str] = None) -> Dict:
        """Получение списка заказов"""
        headers = {"Authorization": f"Bearer {self.token}"}
        params = {"status": status} if status else {}
        
        response = requests.get(
            f"{self.base_url}/api/orders/",
            headers=headers,
            params=params
        )
        response.raise_for_status()
        return response.json()
    
    def create_order(self, order_data: Dict) -> Dict:
        """Создание нового заказа"""
        headers = {"Authorization": f"Bearer {self.token}"}
        
        response = requests.post(
            f"{self.base_url}/api/orders/",
            headers=headers,
            json=order_data
        )
        response.raise_for_status()
        return response.json()

# Использование
api = CvetyKzAPI()
api.authenticate("+77011234567", "123456")

# Получить оплаченные заказы
orders = api.get_orders(status="paid")
print(f"Найдено заказов: {orders['total']}")

# Создать заказ
new_order = api.create_order({
    "customer_phone": "+77011234567",
    "recipient_name": "Айгуль",
    "address": "пр. Достык 89",
    "delivery_method": "delivery",
    "flower_sum": 25000,
    "delivery_fee": 2000,
    "total": 27000
})
print(f"Создан заказ: {new_order['tracking_token']}")
```

### JavaScript/TypeScript (axios)

```typescript
import axios, { AxiosInstance } from 'axios';

interface AuthResponse {
  access_token: string;
  shop_id: number;
  shop_name: string;
}

interface Order {
  id: number;
  tracking_token: string;
  status: string;
  total: number;
}

class CvetyKzAPI {
  private client: AxiosInstance;
  private token?: string;

  constructor(baseURL: string = 'https://api.cvety.kz') {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Добавляем токен к запросам
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });
  }

  async authenticate(phone: string, otpCode: string): Promise<AuthResponse> {
    const { data } = await this.client.post<AuthResponse>('/api/auth/verify-otp', {
      phone,
      otp_code: otpCode,
    });
    this.token = data.access_token;
    return data;
  }

  async getOrders(params?: { status?: string; page?: number }): Promise<{
    items: Order[];
    total: number;
  }> {
    const { data } = await this.client.get('/api/orders/', { params });
    return data;
  }

  async createOrder(orderData: any): Promise<Order> {
    const { data } = await this.client.post('/api/orders/', orderData);
    return data;
  }

  async trackOrder(token: string): Promise<any> {
    const { data } = await this.client.get(`/api/tracking/${token}`);
    return data;
  }
}

// Использование
const api = new CvetyKzAPI();

async function main() {
  // Аутентификация
  await api.authenticate('+77011234567', '123456');

  // Получить заказы
  const orders = await api.getOrders({ status: 'paid' });
  console.log(`Найдено заказов: ${orders.total}`);

  // Создать заказ
  const newOrder = await api.createOrder({
    customer_phone: '+77011234567',
    recipient_name: 'Айгуль',
    address: 'пр. Достык 89',
    delivery_method: 'delivery',
    flower_sum: 25000,
    delivery_fee: 2000,
    total: 27000,
  });
  console.log(`Создан заказ: ${newOrder.tracking_token}`);
}

main().catch(console.error);
```

### Telegram Bot (Python + aiogram)

```python
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
import httpx

bot = Bot(token="YOUR_BOT_TOKEN")
dp = Dispatcher()

# API клиент
api_client = httpx.AsyncClient(base_url="https://api.cvety.kz")

@dp.message(Command("start"))
async def start_handler(message: types.Message):
    await message.answer(
        "🌸 Добро пожаловать в Cvety.kz Bot!\n"
        "Команды:\n"
        "/orders - Мои заказы\n"
        "/track <номер> - Отследить заказ"
    )

@dp.message(Command("orders"))
async def orders_handler(message: types.Message):
    # Получаем токен пользователя из БД
    token = await get_user_token(message.from_user.id)
    
    if not token:
        await message.answer("Сначала авторизуйтесь: /auth")
        return
    
    # Запрашиваем заказы
    headers = {"Authorization": f"Bearer {token}"}
    response = await api_client.get("/api/orders/", headers=headers)
    
    if response.status_code == 200:
        orders = response.json()
        if orders["items"]:
            text = "📦 Ваши заказы:\n\n"
            for order in orders["items"][:5]:
                text += (
                    f"#{order['id']} - {order['status_display']}\n"
                    f"Сумма: {order['total']} ₸\n"
                    f"Отслеживание: /track_{order['tracking_token']}\n\n"
                )
            await message.answer(text)
        else:
            await message.answer("У вас пока нет заказов")
    else:
        await message.answer("Ошибка при получении заказов")

@dp.message(Command("track"))
async def track_handler(message: types.Message):
    parts = message.text.split()
    if len(parts) != 2:
        await message.answer("Использование: /track <номер_отслеживания>")
        return
    
    tracking_token = parts[1].replace("_", "")
    
    # Публичный эндпоинт - не требует авторизации
    response = await api_client.get(f"/api/tracking/{tracking_token}")
    
    if response.status_code == 200:
        data = response.json()
        text = (
            f"📍 Статус заказа: {data['status_display']}\n"
            f"📅 Доставка: {data['delivery_window']['from']} - {data['delivery_window']['to']}\n"
            f"📍 Адрес: {data['address_masked']}\n"
        )
        
        if data.get("photos"):
            text += f"\n📸 Фото готового букета доступны"
        
        await message.answer(text)
    else:
        await message.answer("Заказ не найден")

# Запуск бота
if __name__ == "__main__":
    import asyncio
    asyncio.run(dp.start_polling(bot))
```

### React Native мобильное приложение

```typescript
// api/client.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

class CvetyKzMobileAPI {
  private baseURL = 'https://api.cvety.kz';
  
  async request(endpoint: string, options: RequestInit = {}) {
    const token = await AsyncStorage.getItem('authToken');
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  }
  
  async login(phone: string, otp: string) {
    const data = await this.request('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp_code: otp }),
    });
    
    await AsyncStorage.setItem('authToken', data.access_token);
    await AsyncStorage.setItem('shopId', String(data.shop_id));
    
    return data;
  }
  
  async getOrders(status?: string) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    
    return this.request(`/api/orders/?${params}`);
  }
  
  async createOrder(orderData: any) {
    return this.request('/api/orders/', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }
}

// components/OrdersList.tsx
import React, { useEffect, useState } from 'react';
import { FlatList, Text, View, TouchableOpacity } from 'react-native';

export function OrdersList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const api = new CvetyKzMobileAPI();
  
  useEffect(() => {
    loadOrders();
  }, []);
  
  const loadOrders = async () => {
    try {
      const data = await api.getOrders();
      setOrders(data.items);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.orderCard}>
          <Text style={styles.orderId}>Заказ #{item.id}</Text>
          <Text style={styles.status}>{item.status_display}</Text>
          <Text style={styles.price}>{item.total} ₸</Text>
          <Text style={styles.tracking}>
            Отслеживание: {item.tracking_token}
          </Text>
        </TouchableOpacity>
      )}
      refreshing={loading}
      onRefresh={loadOrders}
    />
  );
}
```

---

## ❌ Обработка ошибок

### Стандартные коды ошибок

| Код | Статус | Описание |
|-----|--------|----------|
| 200 | OK | Успешный запрос |
| 201 | Created | Ресурс создан |
| 204 | No Content | Успешно, без содержимого |
| 400 | Bad Request | Неверный запрос |
| 401 | Unauthorized | Не авторизован |
| 403 | Forbidden | Доступ запрещен |
| 404 | Not Found | Не найдено |
| 422 | Unprocessable Entity | Ошибка валидации |
| 429 | Too Many Requests | Превышен лимит запросов |
| 500 | Internal Server Error | Внутренняя ошибка сервера |
| 503 | Service Unavailable | Сервис недоступен |

### Формат ошибок

#### Простая ошибка
```json
{
  "detail": "Заказ не найден"
}
```

#### Ошибка валидации
```json
{
  "detail": [
    {
      "loc": ["body", "phone"],
      "msg": "Неверный формат телефона",
      "type": "value_error"
    },
    {
      "loc": ["body", "total"],
      "msg": "Сумма должна быть положительной",
      "type": "value_error"
    }
  ]
}
```

#### Rate limit ошибка
```json
{
  "detail": "Rate limit exceeded",
  "retry_after": 60
}
```

### Обработка ошибок в коде

```javascript
async function apiCall(endpoint, options) {
  try {
    const response = await fetch(endpoint, options);
    
    if (!response.ok) {
      const error = await response.json();
      
      switch (response.status) {
        case 401:
          // Обновить токен
          await refreshToken();
          return apiCall(endpoint, options);
        
        case 429:
          // Подождать и повторить
          const retryAfter = error.retry_after || 60;
          await sleep(retryAfter * 1000);
          return apiCall(endpoint, options);
        
        case 422:
          // Показать ошибки валидации
          showValidationErrors(error.detail);
          break;
        
        default:
          throw new Error(error.detail || 'API Error');
      }
    }
    
    return response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}
```

---

## ⏱️ Rate Limiting

### Лимиты

| Эндпоинт | Лимит | Период |
|----------|-------|--------|
| `/auth/request-otp` | 3 | 1 минута |
| `/auth/verify-otp` | 5 | 1 минута |
| API вызовы (общие) | 1000 | 1 час |
| Создание заказов | 100 | 1 час |
| Загрузка файлов | 50 | 1 час |

### Заголовки Rate Limit

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1703606400
```

### Стратегия retry

```python
import time
import random

def retry_with_backoff(func, max_retries=3):
    """Retry с экспоненциальной задержкой"""
    for attempt in range(max_retries):
        try:
            return func()
        except RateLimitError as e:
            if attempt == max_retries - 1:
                raise
            
            # Экспоненциальная задержка с jitter
            delay = (2 ** attempt) + random.uniform(0, 1)
            time.sleep(delay)
    
    raise Exception("Max retries exceeded")
```

---

## 📚 SDK и библиотеки

### Официальные SDK

```bash
# Python
pip install cvety-kz-sdk

# JavaScript/TypeScript
npm install @cvety-kz/sdk

# PHP
composer require cvety-kz/sdk

# Go
go get github.com/cvety-kz/go-sdk
```

### Генерация клиента из OpenAPI

```bash
# TypeScript (axios)
npx openapi-typescript-codegen \
  --input https://api.cvety.kz/openapi.json \
  --output ./src/api \
  --client axios

# Python
openapi-generator generate \
  -i https://api.cvety.kz/openapi.json \
  -g python \
  -o ./cvety-kz-client

# PHP
openapi-generator generate \
  -i https://api.cvety.kz/openapi.json \
  -g php \
  -o ./cvety-kz-php
```

### Postman коллекция

1. Скачайте [коллекцию](https://api.cvety.kz/postman.json)
2. Импортируйте в Postman
3. Настройте переменные окружения:
   - `base_url`: `https://api.cvety.kz`
   - `token`: Ваш JWT токен

---

## ❓ FAQ

### Как получить тестовый доступ?

В режиме разработки используйте:
- URL: `https://test.api.cvety.kz`
- Телефон: `+77011234567`
- OTP: любой 6-значный код

### Как долго действует токен?

JWT токен действует 24 часа. Используйте refresh token для обновления.

### Какие форматы изображений поддерживаются?

- Форматы: JPEG, PNG, WebP, GIF
- Максимальный размер: 10 MB
- Рекомендуемое разрешение: 1200x1200px

### Как тестировать webhooks локально?

Используйте [ngrok](https://ngrok.com) для туннелирования:
```bash
ngrok http 3000
```

### Есть ли песочница для тестирования?

Да, используйте `https://test.api.cvety.kz` с тестовыми данными.

### Как мигрировать с v0.9 на v1.0?

См. [Migration Guide](https://docs.cvety.kz/migration)

---

## 📞 Поддержка

### Контакты

- **Email**: dev@cvety.kz
- **Telegram**: [@cvety_kz_dev](https://t.me/cvety_kz_dev)
- **GitHub**: [github.com/cvety-kz/api](https://github.com/cvety-kz/api)

### Полезные ссылки

- [Статус API](https://status.cvety.kz)
- [Changelog](https://docs.cvety.kz/changelog)
- [Roadmap](https://docs.cvety.kz/roadmap)
- [Terms of Service](https://cvety.kz/terms)

### Сообщить об ошибке

Создайте issue в [GitHub](https://github.com/cvety-kz/api/issues) или напишите на dev@cvety.kz

---

*Последнее обновление: 2025-01-06*