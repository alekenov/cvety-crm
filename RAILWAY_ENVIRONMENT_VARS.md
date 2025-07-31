# Railway Environment Variables

Add these environment variables to your Railway service:

## Required Variables

```bash
# Security (IMPORTANT: Generate a secure key for production)
SECRET_KEY=your-super-secure-secret-key-change-this-in-production

# Telegram Bot (provided by user)
TELEGRAM_BOT_TOKEN=823344503:AAHOW_tV8bppI21XSpWpge0jTxbC541ZMhI

# Telegram Webhook URL (replace with your Railway app URL)
TELEGRAM_WEBHOOK_URL=https://cvety-kz-production.up.railway.app
```

## Automatically Provided by Railway

These are automatically set by Railway plugins:

```bash
# Database (provided by PostgreSQL plugin)
DATABASE_URL=postgresql://...

# Redis (provided by Redis plugin)
REDIS_URL=redis://...

# Port (provided by Railway)
PORT=...

# Environment
RAILWAY_ENVIRONMENT=production
```

## How to Add Variables in Railway

1. Go to your Railway project
2. Select your service
3. Go to "Variables" tab
4. Click "Add Variable"
5. Add each variable from the "Required Variables" section above

## Security Note

- Generate a secure SECRET_KEY for production using:
  ```python
  import secrets
  print(secrets.token_urlsafe(32))
  ```
- Never commit real tokens or secrets to Git