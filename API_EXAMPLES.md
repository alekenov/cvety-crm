# API Examples - Cvety.kz

This document provides working examples for all API endpoints with correct request/response formats.

## Base URL
```
http://localhost:8000/api
```

## Orders API

### Get All Orders
```http
GET /api/orders/
```

Response:
```json
{
  "items": [
    {
      "id": 1,
      "customer_phone": "+77001234567",
      "recipient_phone": null,
      "recipient_name": "Test Recipient",
      "address": "ул. Абая, д. 10",
      "delivery_method": "delivery",
      "flower_sum": 15000.0,
      "delivery_fee": 1500.0,
      "total": 16500.0,
      "status": "new",
      "tracking_token": "x5DHe_tWzKa3L8uEf3Ldqw",
      "delivery_window": {
        "from": "2024-12-26T14:00:00",
        "to": "2024-12-26T16:00:00"
      }
    }
  ],
  "total": 1
}
```

### Create Order
```http
POST /api/orders/
Content-Type: application/json

{
  "customer_phone": "+77001234567",
  "recipient_phone": "+77007654321",
  "recipient_name": "Получатель",
  "address": "ул. Достык, д. 5",
  "delivery_method": "delivery",
  "flower_sum": 25000,
  "delivery_fee": 2000,
  "total": 27000,
  "delivery_window": {
    "from_time": "2024-12-26T14:00:00",
    "to_time": "2024-12-26T16:00:00"
  }
}
```

### Update Order Status
```http
PATCH /api/orders/{order_id}/status
Content-Type: application/json

{
  "status": "paid"
}
```

### Add Issue to Order
```http
PATCH /api/orders/{order_id}/issue
Content-Type: application/json

{
  "issue_type": "wrong_address",
  "comment": "Клиент указал неправильный адрес"
}
```

## Products API

### Get All Products
```http
GET /api/products/
```

Response:
```json
{
  "items": [
    {
      "id": 1,
      "name": "Букет роз 'Классика'",
      "category": "bouquet",
      "description": "Классический букет из красных роз",
      "cost_price": 5000.0,
      "retail_price": 10000.0,
      "sale_price": null,
      "is_active": true,
      "is_popular": true,
      "is_new": false,
      "current_price": 10000.0,
      "discount_percentage": 0
    }
  ],
  "total": 1
}
```

### Create Product
```http
POST /api/products/
Content-Type: application/json

{
  "name": "Букет тюльпанов",
  "category": "bouquet",
  "description": "Весенний букет из тюльпанов",
  "cost_price": 3000,
  "retail_price": 6000,
  "is_active": true,
  "is_popular": false,
  "is_new": true
}
```

### Update Product
```http
PUT /api/products/{product_id}
Content-Type: application/json

{
  "name": "Букет тюльпанов 'Весна'",
  "category": "bouquet",
  "description": "Обновленное описание",
  "cost_price": 3500,
  "retail_price": 7000,
  "sale_price": 5500,
  "is_active": true,
  "is_popular": true,
  "is_new": false
}
```

## Customers API

### Get All Customers
```http
GET /api/customers/
```

Response:
```json
{
  "items": [
    {
      "id": 1,
      "phone": "+77001234567",
      "name": "Иван Петров",
      "email": "ivan@example.com",
      "address": "ул. Абая, д. 10",
      "orders_count": 5,
      "total_spent": 125000.0,
      "last_order_date": "2024-12-25T10:00:00"
    }
  ],
  "total": 1
}
```

### Create Customer
```http
POST /api/customers/
Content-Type: application/json

{
  "phone": "+77007654321",
  "name": "Мария Иванова",
  "email": "maria@example.com",
  "address": "пр. Назарбаева, д. 100"
}
```

### Add Customer Address
```http
POST /api/customers/{customer_id}/addresses
Content-Type: application/json

{
  "address": "ул. Сатпаева, д. 22",
  "is_primary": false
}
```

### Add Important Date
```http
POST /api/customers/{customer_id}/important-dates
Content-Type: application/json

{
  "date_type": "birthday",
  "date": "1990-05-15",
  "description": "День рождения"
}
```

## Warehouse API

### Get All Items
```http
GET /api/warehouse/
```

Query parameters:
- `variety` - фильтр по сорту
- `heightCm` - фильтр по высоте
- `farm` - фильтр по ферме
- `supplier` - фильтр по поставщику
- `onShowcase` - на витрине (true/false)
- `toWriteOff` - на списание (true/false)
- `page` - номер страницы
- `limit` - количество записей

### Create Warehouse Item
```http
POST /api/warehouse/
Content-Type: application/json

{
  "sku": "РОЗ-КР-50",
  "batch_code": "B2024-001",
  "variety": "Роза Красная",
  "height_cm": 50,
  "farm": "Ecuador Roses",
  "supplier": "Flower Direct",
  "delivery_date": "2024-12-20T00:00:00",
  "currency": "USD",
  "rate": 470.0,
  "cost": 0.5,
  "markup_pct": 100.0,
  "qty": 200,
  "price": 500
}
```

### Create Delivery
```http
POST /api/warehouse/deliveries
Content-Type: application/json

{
  "supplier": "Flower Direct",
  "farm": "Ecuador Roses",
  "delivery_date": "2024-12-20T10:00:00",
  "currency": "USD",
  "rate": 470.0,
  "comment": "Поставка роз к праздникам",
  "positions": [
    {
      "variety": "Роза Красная",
      "height_cm": 50,
      "qty": 200,
      "cost_per_stem": 0.5
    },
    {
      "variety": "Роза Белая",
      "height_cm": 60,
      "qty": 150,
      "cost_per_stem": 0.6
    }
  ]
}
```

### Get Warehouse Stats
```http
GET /api/warehouse/stats
```

Response:
```json
{
  "total_items": 25,
  "total_value": 1250000.0,
  "critical_items": 3,
  "showcase_items": 10,
  "writeoff_items": 2,
  "by_variety": {
    "Роза": 500,
    "Тюльпан": 300,
    "Хризантема": 200
  },
  "by_supplier": {
    "Flower Direct": 600,
    "Local Flowers": 400
  }
}
```

## Production API

### Get All Tasks
```http
GET /api/production/tasks/
```

### Create Task
```http
POST /api/production/tasks/
Content-Type: application/json

{
  "order_id": 1,
  "task_type": "bouquet",
  "priority": "urgent",
  "estimated_minutes": 30,
  "deadline": "2024-12-26T14:00:00",
  "items": [
    {
      "product_name": "Букет роз 'Классика'",
      "quantity": 1,
      "special_requests": "Добавить поздравительную открытку"
    }
  ]
}
```

### Assign Task to Florist
```http
POST /api/production/tasks/{task_id}/assign
Content-Type: application/json

{
  "florist_id": "florist_001"
}
```

### Start Task
```http
POST /api/production/tasks/{task_id}/start
```

### Complete Task
```http
POST /api/production/tasks/{task_id}/complete
Content-Type: application/json

{
  "actual_minutes": 25,
  "florist_notes": "Использовал 25 роз вместо 20 для пышности"
}
```

### Get Queue Stats
```http
GET /api/production/queue/stats
```

Response:
```json
{
  "pending_tasks": 5,
  "assigned_tasks": 3,
  "in_progress_tasks": 2,
  "overdue_tasks": 1,
  "urgent_tasks": 2,
  "tasks_by_type": {
    "bouquet": 5,
    "composition": 3,
    "wedding": 2
  }
}
```

## Tracking API

### Get Order Tracking Info
```http
GET /api/tracking/{tracking_token}
```

Response:
```json
{
  "status": "delivery",
  "updated_at": "2024-12-26T10:30:00",
  "photos": [
    {
      "url": "https://example.com/photo1.jpg",
      "caption": "Букет готов к доставке"
    }
  ],
  "delivery_window": {
    "from": "2024-12-26T14:00:00",
    "to": "2024-12-26T16:00:00"
  },
  "delivery_method": "delivery",
  "address": "ул. ***** д. 10",
  "tracking_token": "x5DHe_tWzKa3L8uEf3Ldqw",
  "views_count": 5
}
```

## Settings API

### Get Company Settings
```http
GET /api/settings/
```

Response:
```json
{
  "id": 1,
  "name": "Цветы Казахстан",
  "address": "г. Алматы, пр. Достык 89",
  "email": "info@cvety.kz",
  "phones": ["+7 (700) 123-45-67", "+7 (727) 123-45-67"],
  "working_hours": {
    "from": "09:00",
    "to": "20:00"
  },
  "delivery_zones": [
    {"name": "Центр города", "price": 2000},
    {"name": "Алмалинский район", "price": 2500},
    {"name": "Бостандыкский район", "price": 3000}
  ]
}
```

### Update Settings
```http
PATCH /api/settings/
Content-Type: application/json

{
  "name": "Cvety.kz - Доставка цветов",
  "address": "г. Алматы, пр. Достык 89, офис 301",
  "phones": ["+7 (700) 123-45-67", "+7 (727) 123-45-67", "+7 (708) 123-45-67"],
  "working_hours": {
    "from": "08:00",
    "to": "21:00"
  },
  "delivery_zones": [
    {"name": "Центр города", "price": 2000},
    {"name": "Алмалинский район", "price": 2500},
    {"name": "Бостандыкский район", "price": 3000},
    {"name": "Медеуский район", "price": 3500}
  ]
}
```

## Common Response Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `404` - Not Found
- `422` - Unprocessable Entity (invalid data format)
- `500` - Internal Server Error

## Pagination

Most list endpoints support pagination:
```http
GET /api/orders/?page=1&limit=20
```

## Filtering

Many endpoints support filtering:
```http
GET /api/orders/?status=paid&delivery_method=delivery
GET /api/products/?category=bouquet&is_active=true
GET /api/warehouse/?variety=Роза&onShowcase=true
```

## Date Format

All dates should be in ISO 8601 format:
- Date: `2024-12-26`
- DateTime: `2024-12-26T14:30:00`
- DateTime with timezone: `2024-12-26T14:30:00+06:00`

## Phone Format

Kazakhstan phone numbers should include country code:
- `+77001234567`
- `+77271234567`