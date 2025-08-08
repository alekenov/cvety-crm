# Railway Deployment Guide for Cvety.kz - Complete Setup

## Quick Start

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login and link project
railway login
railway link

# 3. Deploy with CI mode
railway up -c
```

## Deployment Configuration Summary

This project is configured for Railway deployment using an optimized Docker setup.

### Key Optimizations Applied:

1. **Base Image**: Changed from `alpine` to `slim` variants
   - `node:18-slim` for frontend build
   - `python:3.9-slim` for runtime
   - Avoids C-extension compatibility issues common with alpine

2. **Multi-stage Build**: Separate build and runtime stages
   - Frontend built in isolated stage
   - Only production artifacts copied to final image
   - Reduces final image size significantly

3. **Layer Caching Optimization** (NEW!):
   - Dependencies copied and installed first
   - Source code copied after dependencies
   - Railway reuses cached layers between deployments
   - Speeds up deployments by 5-10x when only code changes

4. **Python Environment Variables**:
   ```dockerfile
   ENV PYTHONUNBUFFERED=1 \
       PIP_NO_CACHE_DIR=1 \
       PYTHONDONTWRITEBYTECODE=1 \
       PIP_DISABLE_PIP_VERSION_CHECK=1 \
       PYTHONOPTIMIZE=1  # Added for production
   ```

5. **PORT Handling**: Proper Railway PORT environment variable support
   - Dockerfile exposes `${PORT}`
   - Entrypoint script reads PORT dynamically
   - Uvicorn binds to `0.0.0.0:${PORT}`

6. **Health Check** (NEW!):
   - Built-in Docker health check for Railway monitoring
   - Automatic container restart on failures

7. **Non-root User**: Application runs as `appuser` for security

8. **Comprehensive .dockerignore**: Excludes unnecessary files from build context

### Railway Configuration Files:

- **railway.json**: Specifies Docker as builder
- **Dockerfile**: Optimized multi-stage build
- **docker-entrypoint.sh**: Handles migrations and startup
- **.dockerignore**: Reduces build context size

### Deployment Commands:

```bash
# Link to Railway project
railway link

# Deploy to Railway (CI mode)
railway up -c

# Check deployment logs
railway logs

# Check deployment status
railway status
```

### Environment Variables Required:

- `DATABASE_URL`: PostgreSQL connection string (Railway provides this)
- `SECRET_KEY`: JWT secret key
- `RAILWAY_ENVIRONMENT`: Set by Railway automatically
- `PORT`: Set by Railway automatically

### Troubleshooting:

1. **"Application failed to respond"**: Check that app binds to `0.0.0.0:${PORT}`
2. **Memory issues**: Already optimized with slim images and proper Python settings
3. **Build failures**: Check Railway logs with `railway logs`
4. **Database connection**: Ensure DATABASE_URL is properly set in Railway

### Testing Locally:

#### Quick Test:
```bash
# Build image
docker build -t cvety-kz .

# Run with test PORT
docker run -p 8000:8000 -e PORT=8000 cvety-kz

# Test health endpoint
curl http://localhost:8000/health
```

#### Full Railway Simulation:
```bash
# Use the provided test script
./test-railway-deploy.sh
```

#### Docker Compose (Development):
```bash
# Start all services locally
make up

# View logs
make logs

# Stop services
make down
```

### Best Practices:

1. **Environment Variables**:
   - Use `.env.example` as template
   - Never commit `.env` files
   - Set all production values in Railway Dashboard

2. **Performance Optimization**:
   - Keep image size under 500MB
   - Use single worker for Railway free tier
   - Enable gzip compression in nginx/uvicorn

3. **Security**:
   - Generate strong SECRET_KEY: `openssl rand -hex 32`
   - Run as non-root user
   - Keep dependencies updated

4. **Monitoring**:
   - Use `/health` endpoint for uptime monitoring
   - Check Railway metrics dashboard
   - Set up error tracking (Sentry)

5. **Deployment Workflow**:
   ```bash
   # 1. Test locally
   make up
   
   # 2. Test Railway-like environment
   ./test-railway-deploy.sh
   
   # 3. Deploy to Railway
   make deploy
   ```

## Required Services Setup

### PostgreSQL Database
1. Add PostgreSQL service in Railway dashboard
2. Railway auto-provides DATABASE_URL
3. Migrations run automatically on deploy

### Redis Cache (for OTP)
1. Add Redis service in Railway dashboard
2. Copy REDIS_URL from service variables
3. Add to your app's environment variables

### Environment Variables (Required)
```env
# Auto-provided by Railway
DATABASE_URL=postgresql://...
PORT=...

# Must set manually
SECRET_KEY=your-32-char-hex-key
REDIS_URL=redis://...
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_WEBHOOK_URL=https://your-app.railway.app
DEBUG=False
```

## Deployment Commands

```bash
# Deploy
railway up -c

# Check logs
railway logs -f

# Run migrations manually
railway run alembic upgrade head

# Test database connection
railway run python -c "from app.db.session import engine; print(engine)"
```