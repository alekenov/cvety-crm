# Railway Environment Variables Setup

## 🔐 Critical Security Variables

### 1. SECRET_KEY
Generate a secure secret key:
```bash
openssl rand -hex 32
```

Example output: `2ac64827d6a2aa0f134aed6c184427742d6540d0847cae0a68732174df49e0d9`

**Add to Railway:**
1. Go to Railway dashboard
2. Select your project
3. Go to Variables tab
4. Add: `SECRET_KEY=<your-generated-key>`

### 2. TELEGRAM_BOT_TOKEN
Get from @BotFather:
1. Open Telegram
2. Search for @BotFather
3. Send `/newbot` or use existing bot
4. Copy the token

**Add to Railway:**
Add: `TELEGRAM_BOT_TOKEN=<your-bot-token>`

### 3. DATABASE_URL
Railway provides this automatically when you add a PostgreSQL database.

## 📝 All Required Variables

```env
# Auto-provided by Railway
DATABASE_URL=postgresql://...
PORT=...
RAILWAY_ENVIRONMENT=production

# Must be added manually
SECRET_KEY=<generate-with-openssl>
TELEGRAM_BOT_TOKEN=<from-botfather>
DEBUG=false
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## ⚠️ Important Notes

1. **Never commit real secrets to git**
2. **Use different SECRET_KEY for each environment**
3. **Set DEBUG=false in production**
4. **Railway automatically injects DATABASE_URL and PORT**

## 🚀 Quick Setup Commands

```bash
# Generate secret key
openssl rand -hex 32

# Set variables in Railway CLI
railway variables set SECRET_KEY=<your-key>
railway variables set TELEGRAM_BOT_TOKEN=<your-token>
railway variables set DEBUG=false

# Or use Railway dashboard UI
```