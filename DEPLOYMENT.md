# 🚀 Deployment Guide for Cvety.kz

## Quick Start

### Local Development
```bash
# One command to start everything
./dev.sh

# Or using Make
make dev
```

### Deploy to Railway
```bash
# Deploy directly
railway up

# Or using Make
make deploy
```

## Detailed Instructions

### 1. Initial Setup
```bash
# Install dependencies
make setup

# Or manually:
npm install
cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt
```

### 2. Environment Configuration

#### Local Development
Create `backend/.env`:
```env
DATABASE_URL=sqlite:///./flower_shop.db
SECRET_KEY=dev-secret-key
DEBUG=true
PORT=8000
```

#### Production (Railway)
Set these in Railway dashboard:
- `DATABASE_URL` - PostgreSQL connection string (auto-provided by Railway)
- `SECRET_KEY` - Strong secret key for production
- `INIT_DATA` - Set to "true" on first deploy to initialize data

### 3. Database Setup

#### Run Migrations
```bash
make db-migrate
```

#### Initialize Test Data
```bash
make db-init
```

### 4. Testing

#### Test Locally
```bash
# Run linting and tests
make test

# Test Docker build
make build
```

#### Test Railway Deployment Locally
```bash
./test-railway-local.sh
```

### 5. Deployment

#### Railway Deployment
1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Link project: `railway link`
4. Deploy: `railway up`

#### Manual Docker Deployment
```bash
# Build image
docker build -t cvety-kz .

# Run container
docker run -p 8000:8000 \
  -e DATABASE_URL="postgresql://..." \
  -e SECRET_KEY="..." \
  cvety-kz
```

## Troubleshooting

### Common Issues

1. **Database connection errors**
   - Check DATABASE_URL format
   - Ensure PostgreSQL is accessible
   - Run migrations: `make db-migrate`

2. **Build failures**
   - Clear caches: `make clean`
   - Check Node/Python versions
   - Review Docker logs

3. **Runtime errors**
   - Check environment variables
   - Review application logs: `railway logs`
   - Test locally first: `./test-railway-local.sh`

### Health Checks

- Main health: `http://localhost:8000/health`
- Database health: `http://localhost:8000/api/health/db`
- API docs: `http://localhost:8000/api/docs`

## Best Practices

1. **Always test locally** before deploying
2. **Use environment variables** for configuration
3. **Run migrations** before starting the app
4. **Monitor logs** during deployment
5. **Keep secrets secure** - never commit them

## Commands Reference

```bash
# Development
./dev.sh              # Start dev servers
make dev             # Alternative dev start
make setup           # Initial setup

# Database
make db-migrate      # Run migrations
make db-rollback     # Rollback migration
make db-init         # Initialize data

# Testing & Building
make test            # Run tests
make build           # Build Docker image
./test-railway-local.sh  # Test Railway locally

# Deployment
make deploy          # Deploy to Railway
railway up           # Direct Railway deploy

# Maintenance
make clean           # Clean build artifacts
```