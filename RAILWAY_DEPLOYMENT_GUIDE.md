# Railway Deployment Guide

This guide explains how to deploy the Cvety.kz application on Railway's free tier by splitting it into separate frontend and backend services.

## Why Split Services?

Railway's free tier has memory constraints that cause build failures (exit code 137) when building both frontend and backend together. By splitting them, each service gets its own memory allocation.

## Deployment Steps

### 1. Create Two Railway Services

1. Log into Railway dashboard
2. Create a new project (or use existing)
3. Add TWO services:
   - **Frontend Service** (React/Vite)
   - **Backend Service** (FastAPI)

### 2. Deploy Backend Service

#### Option A: Using Nixpacks (Recommended)
1. In your backend service settings:
   - Set **Root Directory**: `/backend`
   - Set **Build Command**: Leave empty (uses railway-backend.json)
   - Set **Start Command**: Leave empty (uses railway-backend.json)

2. Add these environment variables:
   ```
   DATABASE_URL=postgresql://user:pass@host:5432/dbname
   SECRET_KEY=your-secret-key-here
   ENVIRONMENT=production
   PORT=8000
   ```

3. Copy `railway-backend.json` to your repo root

#### Option B: Using Docker
1. In your backend service settings:
   - Set **Dockerfile Path**: `Dockerfile.backend`
   - No need to set root directory

2. Add the same environment variables as above

### 3. Deploy Frontend Service

#### Option A: Using Nixpacks (Recommended)
1. In your frontend service settings:
   - Leave **Root Directory** empty
   - Set **Build Command**: Leave empty (uses railway-frontend.json)
   - Set **Start Command**: Leave empty (uses railway-frontend.json)

2. Add environment variable:
   ```
   VITE_API_URL=https://your-backend-service.up.railway.app/api
   PORT=3000
   ```

3. Copy `railway-frontend.json` to your repo root

#### Option B: Using Docker
1. In your frontend service settings:
   - Set **Dockerfile Path**: `Dockerfile.frontend`

2. Add the same environment variables as above

### 4. Connect Services

1. Get your backend service URL from Railway (e.g., `your-backend.up.railway.app`)
2. Update frontend's `VITE_API_URL` to point to backend: `https://your-backend.up.railway.app/api`

### 5. Deploy Order

1. Deploy backend first and wait for it to be running
2. Deploy frontend after backend is confirmed working

## Configuration Files

### Using Nixpacks (Recommended)

**railway-backend.json** - Place in repo root:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "nixpacksPlan": {
      "providers": ["python"],
      "phases": {
        "setup": {
          "nixPkgs": ["python39", "gcc", "postgresql"]
        },
        "install": {
          "cmds": [
            "cd backend",
            "pip install --no-cache-dir --no-compile fastapi==0.109.0 uvicorn[standard]==0.25.0",
            "pip install --no-cache-dir --no-compile sqlalchemy==2.0.23 psycopg2-binary==2.9.9",
            "pip install --no-cache-dir --no-compile alembic==1.13.1 pydantic[email]==2.5.3",
            "pip install --no-cache-dir --no-compile pydantic-settings==2.1.0 python-jose[cryptography]==3.3.0",
            "pip install --no-cache-dir --no-compile passlib[bcrypt]==1.7.4 python-multipart==0.0.6",
            "pip install --no-cache-dir --no-compile python-dotenv==1.0.0 email-validator==2.2.0"
          ]
        }
      }
    }
  },
  "deploy": {
    "startCommand": "cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

**railway-frontend.json** - Place in repo root:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm ci --prefer-offline --no-audit --maxsockets 1 && NODE_OPTIONS='--max-old-space-size=512' npm run build"
  },
  "deploy": {
    "startCommand": "npx serve -s dist -l $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

### Using Docker

Use `Dockerfile.frontend` and `Dockerfile.backend` created in the repo.

## Memory Optimization Tips

1. **Frontend Build**:
   - Uses `NODE_OPTIONS='--max-old-space-size=512'`
   - Installs with `--prefer-offline --no-audit --maxsockets 1`
   - Uses lightweight alpine images

2. **Backend Build**:
   - Installs packages in chunks
   - Uses `--no-cache-dir --no-compile` flags
   - Uses python slim image

## Troubleshooting

### Frontend Build Fails
- Check if all dependencies are listed in package.json
- Try reducing node memory further: `--max-old-space-size=256`
- Consider removing dev dependencies from production build

### Backend Build Fails
- Split pip install into even smaller chunks
- Remove optional dependencies
- Use pre-built wheels when available

### Connection Issues
- Ensure VITE_API_URL includes `/api` path
- Check CORS settings in backend
- Verify both services are running

### Alternative: Single Service with Optimized Dockerfile

If you prefer a single service, create a highly optimized multi-stage Dockerfile:

```dockerfile
# Build frontend with minimal memory
FROM node:18-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --prefer-offline --no-audit
COPY . .
ENV NODE_OPTIONS="--max-old-space-size=256"
RUN npm run build && rm -rf node_modules src

# Build backend with minimal memory
FROM python:3.9-alpine AS backend
RUN apk add --no-cache gcc musl-dev postgresql-dev
WORKDIR /app
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir --no-compile -r requirements.txt

# Final minimal image
FROM python:3.9-alpine
RUN apk add --no-cache libpq
WORKDIR /app
COPY --from=backend /usr/local/lib/python3.9/site-packages /usr/local/lib/python3.9/site-packages
COPY --from=frontend /app/dist ./dist
COPY backend ./backend
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh
EXPOSE 8000
CMD ["./docker-entrypoint.sh"]
```

## Recommended Approach

For Railway free tier, **splitting into two services with Nixpacks** is the most reliable approach. It:
- Gives each service dedicated memory
- Simplifies debugging
- Allows independent scaling
- Works within free tier limits

## Next Steps

1. Choose your deployment method (Nixpacks recommended)
2. Set up services in Railway
3. Configure environment variables
4. Deploy backend first, then frontend
5. Monitor logs for any issues