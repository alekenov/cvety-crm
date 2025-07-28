# Railway Deployment Guide for Cvety.kz

## 🚀 Quick Start

### 1. Prepare Railway Project

1. Create new project on [Railway](https://railway.app)
2. Add PostgreSQL service from Railway marketplace
3. Note the `DATABASE_URL` from PostgreSQL service

### 2. Configure Environment Variables

In Railway project settings, add these variables:

```env
# Database (Railway provides this automatically when you add PostgreSQL)
DATABASE_URL=postgresql://...

# Security - Generate a secure key
SECRET_KEY=your-very-secure-secret-key-here

# Optional - Railway sets these automatically
PORT=8000
RAILWAY_ENVIRONMENT=production
```

### 3. Deploy from GitHub

1. Connect your GitHub repository to Railway
2. Railway will automatically detect and use the configuration:
   - `railway.toml` for deployment settings
   - `Dockerfile` for build process
   - Environment variables from Railway dashboard

### 4. Run Database Migrations

After first deployment, run migrations in Railway shell:

```bash
# Open Railway shell for your service
cd backend
alembic upgrade head

# Import existing data (if migrating from SQLite)
python import_to_postgres.py
```

## 📋 Pre-deployment Checklist

- [ ] Update `DATABASE_URL` in Railway environment variables
- [ ] Set secure `SECRET_KEY` in Railway environment variables
- [ ] Ensure `railway.toml` is committed to repository
- [ ] Export SQLite data using `export_sqlite_data.py` (if migrating)
- [ ] Test PostgreSQL connection locally with Railway DATABASE_URL

## 🔧 Configuration Files

### railway.toml
```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "./Dockerfile"

[deploy]
startCommand = "cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (provided by Railway)
- `SECRET_KEY` - JWT secret for authentication
- `PORT` - Server port (Railway sets this)

## 🗄️ Database Migration

### From SQLite to PostgreSQL

1. Export SQLite data:
```bash
cd backend
python export_sqlite_data.py
```

2. After deploying to Railway, import data:
```bash
# In Railway shell
cd backend
python import_to_postgres.py
```

### Using Alembic for Schema Changes

```bash
# Create new migration
alembic revision -m "Description of changes"

# Auto-generate migration from model changes
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback last migration
alembic downgrade -1
```

## 🔍 Monitoring

### Health Checks
- Main health: `https://your-app.railway.app/health`
- Database health: `https://your-app.railway.app/api/health/db`

### Logs
View logs in Railway dashboard or use Railway CLI:
```bash
railway logs
```

## ⚠️ Important Notes

1. **Database URL Format**: Railway may provide `postgres://` URLs. The app automatically converts these to `postgresql://` format required by SQLAlchemy.

2. **Static Files**: Frontend build files are served by the backend from `/dist` directory.

3. **CORS**: Update `BACKEND_CORS_ORIGINS` in `config.py` if using custom domain.

4. **SSL**: Railway provides SSL automatically for `*.railway.app` domains.

## 🆘 Troubleshooting

### Database Connection Issues
- Check DATABASE_URL format (should start with `postgresql://`)
- Verify PostgreSQL service is running in Railway
- Check connection pool settings in `session.py`

### Build Failures
- Check `requirements.txt` for all dependencies
- Ensure Node.js version in Dockerfile matches local development
- Verify frontend builds successfully

### Migration Issues
- Ensure all models are imported in `db/base.py`
- Check Alembic configuration in `alembic/env.py`
- Verify table creation order respects foreign keys