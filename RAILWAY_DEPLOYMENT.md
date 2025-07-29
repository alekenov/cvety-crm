# Railway Deployment Guide for Cvety.kz

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

3. **Python Environment Variables**:
   ```dockerfile
   ENV PYTHONUNBUFFERED=1 \
       PIP_NO_CACHE_DIR=1 \
       PYTHONDONTWRITEBYTECODE=1 \
       PIP_DISABLE_PIP_VERSION_CHECK=1
   ```

4. **PORT Handling**: Proper Railway PORT environment variable support
   - Dockerfile exposes `${PORT}`
   - Entrypoint script reads PORT dynamically
   - Uvicorn binds to `0.0.0.0:${PORT}`

5. **Non-root User**: Application runs as `appuser` for security

6. **Comprehensive .dockerignore**: Excludes unnecessary files from build context

### Railway Configuration Files:

- **railway.json**: Specifies Docker as builder
- **Dockerfile**: Optimized multi-stage build
- **docker-entrypoint.sh**: Handles migrations and startup
- **.dockerignore**: Reduces build context size

### Deployment Commands:

```bash
# Link to Railway project
railway link

# Deploy to Railway
railway up

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

```bash
# Build image
docker build -t cvety-kz .

# Run with test PORT
docker run -p 8000:8000 -e PORT=8000 cvety-kz

# Test health endpoint
curl http://localhost:8000/health
```