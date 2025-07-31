# Telegram OTP Authentication Implementation

## Overview

This implementation provides passwordless authentication using Telegram bot for OTP delivery. Users enter their phone number, receive an OTP code via Telegram, and use it to authenticate.

## Architecture

### Backend Components

1. **Redis Service** (`backend/app/services/redis_service.py`)
   - Manages Redis connections with connection pooling
   - Provides TTL-based storage for OTP codes
   - Includes MockRedisClient for development

2. **OTP Service** (`backend/app/services/otp_service.py`)
   - Generates 6-digit OTP codes
   - Rate limiting (3 requests per minute)
   - Max 3 verification attempts
   - 5-minute TTL for OTP codes

3. **Telegram Service** (`backend/app/services/telegram_service.py`)
   - Handles Telegram bot interactions
   - Sends OTP codes to users
   - Supports webhook (production) and polling (development)

4. **Auth Endpoints** (`backend/app/api/endpoints/auth.py`)
   - `POST /api/auth/request-otp` - Request OTP for phone number
   - `POST /api/auth/verify-otp` - Verify OTP and get JWT token
   - `GET /api/auth/me` - Get current authenticated shop
   - `POST /api/auth/logout` - Logout (client-side token removal)

5. **Shop Model** (`backend/app/models/shop.py`)
   - Multi-tenant shop model for SaaS
   - Stores telegram_id for Telegram authentication
   - Supports multiple languages and currencies

## API Usage

### 1. Request OTP

```bash
curl -X POST "https://your-app.railway.app/api/auth/request-otp" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+77001234567"}'
```

Response:
```json
{
  "message": "OTP sent to your Telegram",
  "delivery_method": "telegram"
}
```

### 2. Verify OTP

```bash
curl -X POST "https://your-app.railway.app/api/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+77001234567", "otp_code": "123456"}'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "shop_id": 1,
  "shop_name": "Цветочный магазин 4567"
}
```

### 3. Use Token for Authenticated Requests

```bash
curl -X GET "https://your-app.railway.app/api/auth/me" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

## Telegram Bot Setup

1. Create a bot with [@BotFather](https://t.me/botfather)
2. Get your bot token
3. Set the token in Railway environment variables

### Bot Commands

- `/start` - Welcome message with instructions
- Send phone number - Receive OTP code

## Railway Configuration

### Environment Variables

```bash
# Required
SECRET_KEY=your-secure-secret-key
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_WEBHOOK_URL=https://your-app.railway.app

# Automatically provided by Railway
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
PORT=...
```

### Redis Plugin

1. Add Redis plugin in Railway dashboard
2. Railway automatically provides REDIS_URL
3. Redis is used for OTP storage with TTL

### Webhook Setup

For production, the bot automatically sets up webhook at:
`https://your-app.railway.app/api/telegram/webhook`

## Security Features

1. **Rate Limiting**: 3 OTP requests per minute per phone
2. **Max Attempts**: 3 verification attempts per OTP
3. **TTL**: OTP expires after 5 minutes
4. **JWT Tokens**: Secure token-based authentication
5. **Phone Validation**: Kazakhstan format (+7XXXXXXXXXX)

## Development vs Production

### Development (DEBUG=true)
- Uses MockRedisClient (no Redis required)
- Telegram bot uses polling
- OTP displayed in response (for testing)

### Production (DEBUG=false)
- Uses real Redis connection
- Telegram bot uses webhook
- OTP only sent via Telegram

## Multi-Tenancy

Each phone number creates/maps to a shop (tenant):
- Shops are isolated from each other
- Each shop has its own data
- JWT token includes shop_id for tenant isolation

## Future Enhancements

1. SMS fallback for non-Telegram users
2. Email authentication option
3. Two-factor authentication
4. Admin panel for shop management
5. Subscription/billing integration