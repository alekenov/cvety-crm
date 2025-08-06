# Redis Setup Guide for Railway Production

This guide will help you set up Redis on Railway for your Cvety.kz production application.

## Current Status

✅ **Redis client code**: Already implemented in `backend/app/services/redis_service.py`  
✅ **Redis dependency**: Already in `requirements.txt` (redis==5.0.1)  
✅ **Configuration**: Ready in `backend/app/core/config.py`  
❌ **Redis service**: Not yet provisioned on Railway  
❌ **REDIS_URL**: Environment variable not set  

## Step 1: Add Redis Service on Railway

### Option A: Via Railway Dashboard (Recommended)

1. **Open your Railway project**:
   - Go to https://railway.app/project/26613e59-06b5-409b-ad5c-08da9ee7777d
   - This is your `cvety-kz` project

2. **Add Redis service**:
   - Click the **"+ New"** button in your project
   - Select **"Database"**
   - Choose **"Add Redis"**
   - Railway will automatically provision Redis and generate connection variables

3. **Verify Redis was added**:
   - You should see a new Redis service in your project dashboard
   - Check the **Variables** tab - you should now have `REDIS_URL`

### Option B: Via Railway CLI (if TTY issues are resolved)

```bash
# In your project directory
railway add
# Select "Database" → "Redis"
```

## Step 2: Verify Redis Configuration

Once Redis is added, run this command to verify the connection:

```bash
railway run python3 backend/scripts/verify_redis.py
```

This script will:
- Check if `REDIS_URL` environment variable exists
- Test Redis connection and basic operations
- Verify all OTP service operations work correctly

## Step 3: Redeploy Your Application

After adding Redis, redeploy your application:

```bash
railway up -c
```

Railway will:
- Automatically inject the `REDIS_URL` environment variable
- Your app will use real Redis instead of MockRedisClient
- OTP codes will persist between requests

## Step 4: Test OTP Functionality

### Test Authentication Flow

1. **Request OTP**:
```bash
curl -X POST https://cvety-kz-production.up.railway.app/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+77771234567"}'
```

2. **Verify OTP** (use any 6-digit code in production):
```bash
curl -X POST https://cvety-kz-production.up.railway.app/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+77771234567", "otp_code": "123456"}'
```

### Expected Behavior

- **Before Redis**: OTP verification fails with 500 errors
- **After Redis**: OTP codes persist and verification works correctly

## Redis Configuration Details

### Automatic Environment Variables

Railway will automatically provide:
- `REDIS_URL`: Complete Redis connection string
- Format: `redis://default:password@host:port`

### Your App Configuration

Your app is already configured to use Redis:

```python
# In redis_service.py
redis_url = settings.REDIS_URL
if redis_url:
    # Use real Redis
    self._client = redis.Redis.from_url(redis_url)
else:
    # Fallback to MockRedisClient (in-memory)
    self._client = MockRedisClient()
```

### Redis Operations Used

Your app uses these Redis operations:
- `setex`: Store OTP with TTL (5 minutes)
- `get`: Retrieve OTP for verification  
- `delete`: Remove OTP after verification
- `incrby`: Rate limiting counters
- `ttl`: Check expiration times
- `exists`: Check if keys exist

## Production Security

### Railway Redis Features

- **Private networking**: Redis only accessible from your Railway services
- **Automatic backups**: Railway handles Redis persistence
- **SSL/TLS encryption**: Secure connections
- **Memory limits**: Appropriate for your usage patterns

### Rate Limiting

Your app implements rate limiting:
- **OTP generation**: Max 10 requests per minute per phone
- **Verification attempts**: Max 3 attempts per OTP
- **TTL**: OTP expires after 5 minutes

## Troubleshooting

### Common Issues

1. **"REDIS_URL not found"**:
   - Redis service not added to Railway project
   - Need to redeploy after adding Redis

2. **Connection timeout**:
   - Check Redis service status in Railway dashboard
   - Verify service is running in same project/environment

3. **OTP still not persisting**:
   - Check Railway logs: `railway logs --tail`
   - Run verification script: `railway run python3 backend/scripts/verify_redis.py`

### Verification Commands

```bash
# Check environment variables
railway variables

# Test Redis connection
railway run python3 backend/scripts/verify_redis.py

# Check application logs
railway logs --tail

# Monitor Redis usage (if needed)
railway connect redis  # Opens Redis CLI
```

## Cost Considerations

Railway Redis pricing:
- **Starter**: $5/month (256MB memory, sufficient for OTP storage)
- **Pro**: $20/month (1GB memory, production recommended)

Your usage (OTP codes):
- **Memory per OTP**: ~200 bytes
- **Concurrent OTPs**: ~1000 codes = 200KB
- **Rate limit counters**: Minimal additional memory
- **Estimated usage**: <10MB total

## Next Steps

1. ✅ **Add Redis service** in Railway dashboard
2. ✅ **Verify connection** with verification script  
3. ✅ **Redeploy application** with `railway up -c`
4. ✅ **Test OTP flow** with real phone numbers
5. ✅ **Monitor performance** in Railway dashboard

## Support

If you encounter issues:
- Check Railway status: https://status.railway.app
- Railway docs: https://docs.railway.app/databases/redis
- Your verification script: `backend/scripts/verify_redis.py`