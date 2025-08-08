# Telegram Bot Setup Guide

## Overview
The application uses Telegram Bot for OTP authentication. Users receive one-time passwords via Telegram instead of SMS.

## Bot Configuration

### 1. Create a Telegram Bot
1. Open Telegram and search for **@BotFather**
2. Send `/newbot` command
3. Choose a name for your bot (e.g., "Cvety.kz Auth")
4. Choose a username (must end with "bot", e.g., "cvety_kz_auth_bot")
5. Save the token you receive (looks like: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. Environment Variables

#### Development (Polling Mode)
```env
# .env file
TELEGRAM_BOT_TOKEN=your-bot-token-here
DEBUG=True
```

#### Production (Webhook Mode)
```env
# Railway environment variables
TELEGRAM_BOT_TOKEN=your-bot-token-here
TELEGRAM_WEBHOOK_URL=https://your-domain.railway.app
DEBUG=False
```

## How It Works

### Authentication Flow
1. User enters phone number on the website
2. System sends a message to the user: "Send your phone to @your_bot"
3. User sends phone number to Telegram bot
4. Bot generates and sends OTP code
5. User enters OTP on website
6. System verifies OTP and creates JWT token

### Telegram Bot Features
- **Phone number extraction**: Supports multiple formats (+7, 8, without code)
- **OTP generation**: 6-digit codes with 5-minute expiration
- **Rate limiting**: Prevents spam and brute force
- **Multi-language**: Russian messages (can be extended)

## Testing

### Local Development
1. Set `TELEGRAM_BOT_TOKEN` in `.env`
2. Start the backend: `uvicorn app.main:app --reload`
3. Bot will start in polling mode automatically
4. Send `/start` to your bot in Telegram

### Test Mode (DEBUG=True)
When `DEBUG=True`, you can use:
- Phone: `+7 701 123 45 67`
- Any 6-digit OTP code will work

### Production Testing
1. Deploy to Railway with `TELEGRAM_BOT_TOKEN`
2. Set `TELEGRAM_WEBHOOK_URL` to your Railway URL
3. Bot will use webhook mode automatically
4. Test with real phone numbers

## Security Considerations

### Token Protection
- Never commit bot token to git
- Use environment variables only
- Rotate token if compromised

### OTP Security
- 5-minute expiration
- Single use only
- Rate limiting (3 attempts per minute)
- Redis storage (not in database)

### User Privacy
- No message history stored
- Only telegram_id linked to phone
- OTP deleted after use
- No personal data in logs

## Troubleshooting

### Bot Not Responding
1. Check token is correct
2. Verify bot is not blocked
3. Check logs: `docker compose logs -f backend`

### OTP Not Received
1. Ensure phone format is correct
2. Check rate limiting (wait 1 minute)
3. Verify Redis is running

### Webhook Issues (Production)
1. URL must be HTTPS
2. Check Railway logs
3. Verify webhook URL in BotFather: `/setwebhook`

## Commands Reference

### BotFather Commands
- `/setname` - Change bot name
- `/setdescription` - Set bot description
- `/setabouttext` - Set about text
- `/setcommands` - Set bot commands
- `/deletebot` - Delete bot (careful!)

### Recommended Bot Settings
```
/setname
Cvety.kz Authorization

/setdescription
Official bot for Cvety.kz flower shop management system authentication

/setabouttext
This bot provides secure OTP authentication for Cvety.kz system

/setcommands
start - Begin authentication process
```

## Integration with Application

### Backend Integration
- Service: `app/services/telegram_service.py`
- OTP Service: `app/services/otp_service.py`
- Auth Endpoint: `app/api/endpoints/auth.py`

### Frontend Integration
- Login Component: `src/components/auth/login-form.tsx`
- API Client: `src/lib/api.ts`

## Future Enhancements

### Planned Features
1. **Order notifications**: New order alerts to managers
2. **Status updates**: Delivery status to customers
3. **Quick actions**: Accept/reject orders via bot
4. **Reports**: Daily sales summary

### Bot Commands (Future)
- `/orders` - View today's orders
- `/stats` - Sales statistics
- `/help` - Get help

## Support

For bot issues:
1. Check this documentation
2. Review logs in Railway
3. Contact development team

## License
Part of Cvety.kz system - Proprietary