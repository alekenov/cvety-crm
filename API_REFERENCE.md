# API Reference - Cvety.kz

Comprehensive API documentation for integrating with Cvety.kz flower shop management system.

## Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [API Modules](#api-modules)
  - [Orders](#orders-заказы)
  - [Products](#products-товары)
  - [Customers](#customers-клиенты)
  - [Warehouse](#warehouse-склад)
  - [Production](#production-производство)
  - [Tracking](#tracking-отслеживание)
- [Integration Examples](#integration-examples)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

## Overview

### Base URL
```
Production: https://api.cvety.kz/api
Development: http://localhost:8000/api
```

### API Documentation
- **Interactive Docs (Swagger UI)**: `/docs`
- **ReDoc**: `/redoc`
- **OpenAPI Schema**: `/openapi.json`

### Request Format
- **Content-Type**: `application/json`
- **Accept**: `application/json`
- **Authorization**: `Bearer <JWT_TOKEN>` (for protected endpoints)

### Response Format
All list endpoints return paginated responses:
```json
{
  "items": [...],
  "total": 100
}
```

### Date/Time Format
- All dates use ISO 8601 format: `2024-12-26T14:30:00`
- Timezone: UTC (convert to Almaty time +6 for display)

### Phone Format
- Kazakhstan format required: `+7XXXXXXXXXX`
- Example: `+77011234567`

### Currency
- All amounts in KZT (Kazakhstani Tenge)
- No decimal places for amounts

## Authentication

### Overview
Cvety.kz uses Telegram OTP-based authentication with JWT tokens.

### Authentication Flow

#### 1. Request OTP
```http
POST /api/auth/request-otp
Content-Type: application/json

{
  "phone": "+77011234567"
}
```

**Response:**
```json
{
  "message": "OTP sent to your Telegram",
  "delivery_method": "telegram"
}
```

**Delivery Methods:**
- `telegram` - Sent via @cvety_kz_bot
- `sms` - SMS delivery (coming soon)
- `debug` - Returns OTP in response (development only)

#### 2. Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "phone": "+77011234567",
  "otp_code": "123456"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "shop_id": 1,
  "shop_name": "Цветочный магазин 4567"
}
```

#### 3. Use Token
Include the token in all subsequent requests:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Security Notes
- OTP expires in 5 minutes
- JWT token valid for 24 hours
- Rate limit: 3 OTP requests per minute
- After 3 failed attempts, temporary lock

## API Modules

### Orders (Заказы)

Order management with status workflow tracking.

#### Order Status Flow
```
new → paid → assembled → delivery/self_pickup → delivered → completed
         ↓
       issue (can happen at any stage)
```

#### Get Orders
```http
GET /api/orders/
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (int): Page number, starting from 1
- `limit` (int): Items per page (max 100)
- `status` (string): Filter by status
- `search` (string): Search in phones/names/ID
- `dateFrom` (string): Start date ISO 8601
- `dateTo` (string): End date ISO 8601

**Example Response:**
```json
{
  "items": [
    {
      "id": 1,
      "created_at": "2024-12-26T10:00:00",
      "status": "paid",
      "customer_phone": "+77011234567",
      "recipient_name": "Айгуль Касымова",
      "address": "г. Алматы, пр. Достык 89",
      "delivery_method": "delivery",
      "delivery_window": {
        "from": "2024-12-26T14:00:00",
        "to": "2024-12-26T16:00:00"
      },
      "flower_sum": 25000,
      "delivery_fee": 2000,
      "total": 27000,
      "tracking_token": "x5DHe_tWzKa3L8uEf3Ldqw",
      "customer": {
        "id": 10,
        "name": "Иван Петров",
        "orders_count": 5,
        "total_spent": 125000
      },
      "items": [
        {
          "product_name": "Букет роз 'Классика'",
          "quantity": 1,
          "price": 25000,
          "total": 25000
        }
      ]
    }
  ],
  "total": 150
}
```

#### Create Order
```http
POST /api/orders/
Authorization: Bearer <token>
Content-Type: application/json

{
  "customer_phone": "+77011234567",
  "recipient_phone": "+77017654321",
  "recipient_name": "Айгуль Касымова",
  "address": "г. Алматы, пр. Достык 89, кв. 45",
  "delivery_method": "delivery",
  "delivery_window": {
    "from_time": "2024-12-26T14:00:00",
    "to_time": "2024-12-26T16:00:00"
  },
  "flower_sum": 25000,
  "delivery_fee": 2000,
  "total": 27000
}
```

#### Update Order Status
```http
PATCH /api/orders/{order_id}/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "paid"
}
```

**Valid Status Transitions:**
- `new` → `paid`
- `paid` → `assembled`
- `assembled` → `delivery` or `self_pickup`
- `delivery/self_pickup` → `delivered`
- `delivered` → `completed`
- Any status → `issue`

#### Report Issue
```http
PATCH /api/orders/{order_id}/issue
Authorization: Bearer <token>
Content-Type: application/json

{
  "issue_type": "wrong_address",
  "comment": "Клиент указал неправильный адрес"
}
```

**Issue Types:**
- `wrong_address` - Неправильный адрес
- `recipient_unavailable` - Получатель недоступен
- `quality_issue` - Проблема с качеством
- `wrong_order` - Неправильный заказ
- `delivery_delay` - Задержка доставки
- `other` - Другое

#### Create Order with Items
```http
POST /api/orders/with-items
Authorization: Bearer <token>
Content-Type: application/json

{
  "customer_phone": "+77011234567",
  "recipient_name": "Айгуль",
  "address": "пр. Достык 89",
  "delivery_method": "delivery",
  "delivery_fee": 2000,
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    },
    {
      "product_id": 5,
      "quantity": 1
    }
  ]
}
```

#### Payment Webhook
```http
POST /api/orders/{order_id}/payment-webhook
Content-Type: application/json

{
  "payment_method": "kaspi",
  "payment_id": "KASPI-12345",
  "amount": 27000,
  "status": "success"
}
```

### Products (Товары)

Product catalog management.

#### Get Products
```http
GET /api/products/
Authorization: Bearer <token>
```

**Query Parameters:**
- `category`: Filter by category (bouquet, composition, gift, other)
- `search`: Search in name/description
- `is_popular`: Filter popular items
- `is_new`: Filter new items
- `min_price`: Minimum price
- `max_price`: Maximum price
- `on_sale`: Items on sale

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "name": "Букет роз 'Классика'",
      "category": "bouquet",
      "description": "25 красных роз премиум класса",
      "cost_price": 12000,
      "retail_price": 25000,
      "sale_price": null,
      "is_active": true,
      "is_popular": true,
      "is_new": false,
      "current_price": 25000,
      "discount_percentage": 0
    }
  ],
  "total": 50
}
```

#### Product Categories
- `bouquet` - Букеты
- `composition` - Композиции
- `gift` - Подарки
- `other` - Другое

### Customers (Клиенты)

CRM functionality for customer management.

#### Get Customers
```http
GET /api/customers/
Authorization: Bearer <token>
```

**Query Parameters:**
- `search`: Search by phone/name/email
- `has_orders`: Filter customers with orders
- `min_spent`: Minimum total spent
- `page`, `limit`: Pagination

#### Create Customer
```http
POST /api/customers/
Authorization: Bearer <token>
Content-Type: application/json

{
  "phone": "+77017654321",
  "name": "Мария Иванова",
  "email": "maria@example.com",
  "address": "ул. Сатпаева 22",
  "birth_date": "1990-05-15",
  "preferences": "Любит белые розы"
}
```

#### Add Important Date
```http
POST /api/customers/{customer_id}/important-dates
Authorization: Bearer <token>
Content-Type: application/json

{
  "date_type": "birthday",
  "date": "1990-05-15",
  "description": "День рождения",
  "reminder_days": 3
}
```

**Date Types:**
- `birthday` - День рождения
- `anniversary` - Годовщина
- `other` - Другое

### Warehouse (Склад)

Inventory management with multi-currency support.

#### Get Warehouse Items
```http
GET /api/warehouse/
Authorization: Bearer <token>
```

**Query Parameters:**
- `variety`: Filter by flower variety
- `supplier`: Filter by supplier
- `onShowcase`: Items on display
- `toWriteOff`: Items to write off

#### Create Supply Delivery
```http
POST /api/warehouse/deliveries
Authorization: Bearer <token>
Content-Type: application/json

{
  "supplier": "Flower Direct",
  "farm": "Ecuador Roses",
  "delivery_date": "2024-12-20T10:00:00",
  "currency": "USD",
  "rate": 470.0,
  "positions": [
    {
      "variety": "Роза Красная",
      "height_cm": 50,
      "qty": 200,
      "cost_per_stem": 0.5
    }
  ]
}
```

**Supported Currencies:**
- `USD` - US Dollar
- `EUR` - Euro
- `KZT` - Tenge (no conversion)

### Production (Производство)

Task queue for florists.

#### Get Production Tasks
```http
GET /api/production/tasks/
Authorization: Bearer <token>
```

**Task Statuses:**
- `pending` - Ожидает
- `assigned` - Назначено
- `in_progress` - В работе
- `completed` - Завершено

#### Create Task
```http
POST /api/production/tasks/
Authorization: Bearer <token>
Content-Type: application/json

{
  "order_id": 1,
  "task_type": "bouquet",
  "priority": "urgent",
  "deadline": "2024-12-26T14:00:00",
  "items": [
    {
      "product_name": "Букет роз",
      "quantity": 1,
      "special_requests": "Добавить открытку"
    }
  ]
}
```

**Task Types:**
- `bouquet` - Букет
- `composition` - Композиция
- `wedding` - Свадебное оформление
- `event` - Оформление мероприятия

**Priorities:**
- `low` - Низкий
- `normal` - Обычный
- `high` - Высокий
- `urgent` - Срочный

### Tracking (Отслеживание)

Public order tracking (no authentication required).

#### Get Tracking Info
```http
GET /api/tracking/{tracking_token}
```

**Response:**
```json
{
  "status": "delivery",
  "updated_at": "2024-12-26T12:00:00",
  "delivery_method": "delivery",
  "delivery_window": {
    "from": "2024-12-26T14:00:00",
    "to": "2024-12-26T16:00:00"
  },
  "address": "г. Алматы, пр. ***** д. 89",
  "photos": [],
  "tracking_token": "x5DHe_tWzKa3L8uEf3Ldqw"
}
```

**Privacy:**
- Address is partially masked
- No personal information exposed
- Photos only show flowers

## Integration Examples

### Telegram Bot Integration
```python
import httpx
from aiogram import Bot, Dispatcher, types

# Authentication
async def get_token(phone: str, otp: str):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.cvety.kz/api/auth/verify-otp",
            json={"phone": phone, "otp_code": otp}
        )
        return response.json()["access_token"]

# Create order
async def create_order(token: str, order_data: dict):
    headers = {"Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.cvety.kz/api/orders/",
            headers=headers,
            json=order_data
        )
        return response.json()

# Bot handler
@dp.message_handler(commands=['order'])
async def handle_order(message: types.Message):
    # Get user's shop token from database
    token = await get_user_token(message.from_user.id)
    
    # Create order
    order = await create_order(token, {
        "customer_phone": "+77011234567",
        "recipient_name": "Получатель",
        "address": "ул. Абая 10",
        "delivery_method": "delivery",
        "flower_sum": 25000,
        "delivery_fee": 2000,
        "total": 27000
    })
    
    await message.reply(
        f"Заказ создан! Номер: {order['id']}\n"
        f"Отслеживание: https://cvety.kz/tracking/{order['tracking_token']}"
    )
```

### Mobile App Integration (React Native)
```typescript
// api/client.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'https://api.cvety.kz/api';

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth service
export const authService = {
  async requestOTP(phone: string) {
    const response = await client.post('/auth/request-otp', { phone });
    return response.data;
  },

  async verifyOTP(phone: string, otp_code: string) {
    const response = await client.post('/auth/verify-otp', { phone, otp_code });
    await AsyncStorage.setItem('authToken', response.data.access_token);
    return response.data;
  },
};

// Orders service
export const ordersService = {
  async getOrders(params?: { status?: string; page?: number }) {
    const response = await client.get('/orders/', { params });
    return response.data;
  },

  async createOrder(orderData: CreateOrderDto) {
    const response = await client.post('/orders/', orderData);
    return response.data;
  },

  async trackOrder(token: string) {
    const response = await client.get(`/tracking/${token}`);
    return response.data;
  },
};
```

### WhatsApp Business Integration
```javascript
// webhook handler for WhatsApp Business API
app.post('/whatsapp/webhook', async (req, res) => {
  const { from, body } = req.body;
  
  // Parse order from message
  if (body.toLowerCase().includes('заказ')) {
    // Get shop token for this WhatsApp number
    const token = await getShopToken(from);
    
    // Create order via API
    const order = await fetch('https://api.cvety.kz/api/orders/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer_phone: from,
        recipient_name: 'Из WhatsApp',
        delivery_method: 'delivery',
        // ... parse other details from message
      }),
    }).then(r => r.json());
    
    // Send tracking link back
    await sendWhatsAppMessage(from, 
      `Ваш заказ №${order.id} принят!\n` +
      `Отслеживать: https://cvety.kz/tracking/${order.tracking_token}`
    );
  }
  
  res.sendStatus(200);
});
```

## Error Handling

### Standard Error Response
```json
{
  "detail": "Error message description"
}
```

### Validation Error Response
```json
{
  "detail": [
    {
      "loc": ["body", "phone"],
      "msg": "Invalid phone format",
      "type": "value_error"
    }
  ]
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (no access to resource)
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

### Error Handling Best Practices
1. Always check response status code
2. Parse error details for user-friendly messages
3. Implement retry logic for 5xx errors
4. Respect rate limits (429 errors)
5. Log errors for debugging

## Rate Limiting

### Current Limits
- **Authentication**: 3 OTP requests per minute
- **API Calls**: 1000 requests per hour per shop
- **File Uploads**: 10 MB max file size

### Rate Limit Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1703606400
```

### Handling Rate Limits
When rate limited, API returns `429` status with:
```json
{
  "detail": "Rate limit exceeded",
  "retry_after": 60
}
```

Best practice: Implement exponential backoff
```javascript
async function apiCallWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.response?.status === 429) {
        const retryAfter = error.response.data.retry_after || 60;
        await sleep(retryAfter * 1000 * Math.pow(2, i));
      } else {
        throw error;
      }
    }
  }
}
```

## Webhooks

### Available Webhooks
1. **Order Status Changed**
2. **Payment Received**
3. **New Customer Registered**

### Webhook Configuration
Contact support to configure webhook URLs for your shop.

### Webhook Payload Example
```json
{
  "event": "order.status_changed",
  "timestamp": "2024-12-26T14:30:00",
  "shop_id": 1,
  "data": {
    "order_id": 123,
    "old_status": "new",
    "new_status": "paid",
    "tracking_token": "x5DHe_tWzKa3L8uEf3Ldqw"
  }
}
```

### Webhook Security
All webhooks include HMAC-SHA256 signature:
```
X-Webhook-Signature: sha256=abc123...
```

Verify signature:
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

## SDK/Client Libraries

### Official SDKs
- Python: `pip install cvety-kz-sdk` (coming soon)
- JavaScript/TypeScript: `npm install @cvety-kz/sdk` (coming soon)

### Generate Client from OpenAPI
```bash
# Using openapi-generator
openapi-generator generate \
  -i https://api.cvety.kz/openapi.json \
  -g typescript-axios \
  -o ./generated-client

# Using openapi-typescript-codegen
npx openapi-typescript-codegen \
  --input https://api.cvety.kz/openapi.json \
  --output ./src/api
```

## Support

- **Email**: dev@cvety.kz
- **Telegram**: @cvety_kz_support
- **Documentation**: https://docs.cvety.kz
- **Status Page**: https://status.cvety.kz