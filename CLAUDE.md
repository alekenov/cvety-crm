# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cvety.kz is a full-stack flower shop management system for the Kazakhstan market. The codebase contains a React/TypeScript frontend with shadcn/ui components and a FastAPI/Python backend.

## Commands

### Docker Commands (Recommended)
```bash
# Start all services with Docker Compose
make up              # или docker compose up --build

# View logs
make logs            # или docker compose logs -f

# Stop services
make down            # или docker compose down

# Enter container shell
make shell           # или docker compose exec app bash

# Connect to database
make db-shell        # или docker compose exec db psql -U postgres flower_shop
```

### Manual Commands (без Docker)
```bash
# Frontend
npm install          # Install dependencies
npm run dev          # Start dev server (port 5173/5174)
npm run build        # Build for production
npm run lint         # Run ESLint

# Backend
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload  # Start backend (port 8000)
```

## Architecture

### Frontend Structure
- **Pages**: Located in `src/pages/` using file-based routing pattern
  - `/orders` - Order management with status workflow
  - `/warehouse` - Inventory tracking with multi-currency
  - `/customers` - CRM functionality
  - `/production` - Kanban board for florists
  - `/tracking/:token` - Public order tracking
  - `/catalog` - Product catalog management
  - `/settings` - Company and user settings

- **API Client**: `src/lib/api.ts` uses axios with proxy to backend
- **Types**: `src/lib/types.ts` contains all TypeScript interfaces
- **Components**: `src/components/ui/` contains shadcn/ui components
- **State**: Using React Query for server state management

### Backend Structure
- **FastAPI app**: `backend/app/main.py` with CORS and API prefix
- **Models**: SQLAlchemy models in `backend/app/models/`
- **Schemas**: Pydantic schemas in `backend/app/schemas/`
- **CRUD**: Business logic in `backend/app/crud/`
- **API Routes**: Endpoints in `backend/app/api/endpoints/`
- **Database**: SQLite for dev, PostgreSQL for production

### API Integration
- Frontend proxies `/api` requests to backend via Vite config
- All API responses follow `{items: T[], total: number}` format for lists
- Order status workflow: new → paid → assembled → delivery/self_pickup → issue
- Tracking tokens are automatically generated for orders

## Business Context

### Market Specifics
- **Currency**: KZT (Kazakhstani Tenge)
- **Languages**: Russian (primary), Kazakh
- **Payment**: Kaspi Pay integration expected
- **Phone Format**: +7 (XXX) XXX-XX-XX

### Key Features
- Order status tracking with issue management
- Multi-currency warehouse (USD/EUR → KZT conversion)
- Public order tracking with address masking
- Production task assignment for florists
- Customer preferences and important dates tracking

## Development Notes

### Type Safety
- Frontend TypeScript types must match backend Pydantic schemas
- Use `delivery_window: {from, to}` format for time windows
- Dates are ISO strings in API, Date objects in frontend

### API Patterns
```typescript
// Frontend API call pattern
const { data } = await ordersApi.getAll({ 
  status: 'paid',
  page: 1,
  limit: 20 
})

// Backend endpoint pattern
@router.get("/", response_model=OrderList)
def get_orders(
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=100)
)
```

### Current Implementation Status
- ✅ Orders API (CRUD, status updates, issue tracking)
- ✅ Tracking API (public access with data masking)
- ✅ Frontend routing and layouts
- ✅ Warehouse API (fully implemented with auth)
- ✅ Customers API (fully implemented with CRM features)
- ✅ Production API (kanban board for florists)
- ✅ Authentication (OTP via Telegram, JWT tokens)
- ❌ Real-time updates (WebSocket)

## Railway Deployment

### Deployment Configuration
- **Build**: Docker-based deployment using `railway.json`
- **Dockerfile**: Multi-stage build with slim images (node:18-slim, python:3.9-slim)
- **Port**: Dynamic PORT environment variable handling
- **Database**: PostgreSQL provided by Railway
- **Security**: Runs as non-root user (appuser)

### Deployment Commands
```bash
railway link              # Link to Railway project
railway up -c            # Deploy to Railway (CI mode - рекомендуется)
railway logs             # View deployment logs
railway status           # Check deployment status

# Или через Makefile
make deploy              # Запускает railway up -c
```

### Tips and Memories
- `делай деплой через railway up -c` - Recommended Railway deployment command
- **После деплоя в Railway проверяй через MCP Playwright**, то что мы сделали

### Test Account for Development
**Тестовый аккаунт для входа в систему:**
- **Телефон**: `+7 701 123 45 67`
- **Код подтверждения**: Любой 6-значный код (например, `123456`)
- **Важно**: Работает только при `DEBUG=True` (локальная разработка)
- **На продакшене**: Используется реальная авторизация через Telegram бот @lekenbot

### Testing Railway Locally
```bash
# Test Railway-like environment
./test-railway-deploy.sh  # Симулирует Railway окружение локально
```

### Required Environment Variables
- `DATABASE_URL` - PostgreSQL connection (provided by Railway)
- `SECRET_KEY` - JWT secret key
- `PORT` - Application port (provided by Railway)
- `RAILWAY_ENVIRONMENT` - Environment name (provided by Railway)

### Deployment Files
- `railway.json` - Railway configuration
- `Dockerfile` - Optimized multi-stage build with layer caching
- `docker-entrypoint.sh` - Startup script with migrations
- `.dockerignore` - Reduces build context size
- `.env.example` - Environment variables template
- `compose.yaml` - Docker Compose for local development
- `test-railway-deploy.sh` - Test Railway deployment locally
- `RAILWAY_DEPLOYMENT.md` - Detailed deployment guide

## Docker Optimizations

### Build Performance
- **Layer Caching**: Dependencies installed before copying source code
- **Multi-stage Build**: Separate build and runtime stages
- **Result**: 7x faster rebuilds (79s → 11s) when only code changes

### Development Workflow
```bash
# 1. Local development with hot-reload
make up

# 2. Test Railway-like environment
./test-railway-deploy.sh

# 3. Deploy to Railway
railway up -c  # ВАЖНО: используйте флаг -c для CI mode
```

### Key Improvements
1. **Dockerfile**: Optimized layer order for caching
2. **Docker Compose**: One command to start everything
3. **Health Check**: Built-in monitoring endpoint
4. **Production Ready**: Non-root user, security headers
5. **Railway Compatible**: Same Dockerfile for dev and prod

## API Documentation

### Accessing API Documentation
- **Interactive Docs (Swagger UI)**: http://localhost:8000/docs
- **ReDoc Documentation**: http://localhost:8000/redoc
- **OpenAPI Schema**: http://localhost:8000/openapi.json
- **API Reference Guide**: See `API_REFERENCE.md` for comprehensive documentation

### For AI/Bot Integration
All endpoints follow RESTful conventions and provide semantic descriptions for AI understanding:
- **Authentication**: JWT Bearer token required (except /tracking and /auth endpoints)
- **Response Format**: `{items: T[], total: number}` for all list endpoints
- **Date Format**: ISO 8601 (e.g., `2024-12-26T14:30:00`)
- **Phone Format**: Kazakhstan format `+7XXXXXXXXXX`
- **Currency**: All amounts in KZT (no decimals)

### Key Integration Points
```typescript
// Authentication Flow
POST /api/auth/request-otp     // Get OTP via Telegram
POST /api/auth/verify-otp      // Exchange OTP for JWT token

// Core Operations
POST /api/orders/              // Create order
GET  /api/orders/              // List orders with filters
PATCH /api/orders/{id}/status  // Update order status
GET  /api/tracking/{token}     // Public order tracking (no auth)

// Webhooks
POST /api/orders/{id}/payment-webhook  // Payment confirmation
```

### API Features for Integrations
1. **Semantic Descriptions**: Each endpoint has detailed descriptions for AI understanding
2. **Type Safety**: Full TypeScript/Pydantic schemas for request/response validation
3. **Business Logic**: Status workflows and validation rules documented in OpenAPI
4. **Examples**: Every endpoint includes example requests and responses
5. **Error Handling**: Standardized error responses with detailed messages

### Generating API Clients
```bash
# TypeScript client generation
npx openapi-ts --input http://localhost:8000/openapi.json --output ./src/api-client

# Python client generation
openapi-generator generate -i http://localhost:8000/openapi.json -g python -o ./python-client
```

### Testing API Endpoints
```bash
# Get auth token (test account in DEBUG mode)
curl -X POST http://localhost:8000/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+77011234567"}'

# Verify OTP (any 6-digit code in DEBUG mode)
curl -X POST http://localhost:8000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+77011234567", "otp_code": "123456"}'

# Use token for API calls
curl -X GET http://localhost:8000/api/orders/ \
  -H "Authorization: Bearer <token>"
```

## Database Architecture & Standards

### Database Access
```bash
# Local SQLite
sqlite3 backend/flower_shop.db

# Railway PostgreSQL  
railway run python3 check_railway_db.py
railway run python3 -c "your_sql_script"
```

### Data Type Standards
- **Phone numbers**: Always store as `+7XXXXXXXXXX` (no spaces/brackets)
- **Money**: Use DECIMAL(10,2), never FLOAT (Pydantic: `Decimal`, TypeScript: `number`)
- **Dates**: TIMESTAMP WITH TIME ZONE for all timestamps
- **IDs**: All tables must have `shop_id` for multi-tenancy
- **Enums**: Store as VARCHAR(20) for cross-DB compatibility

### Common Patterns
```python
# Phone validation
phone: str = Field(regex=r'^\+7\d{10}$')

# Money handling  
total: Decimal = Field(max_digits=10, decimal_places=2)

# Time windows
delivery_window: dict = {
    "from": "2024-01-26T14:00:00+06:00",  # Almaty timezone
    "to": "2024-01-26T16:00:00+06:00"
}
```

### Database Documentation
- **DATABASE_GUIDE.md** - Full schema documentation with all 23 tables
- **DATABASE_STANDARDS.md** - Data type standards and validation rules
- **API_REFERENCE.md** - REST API endpoints documentation
- **SCHEMA_CHANGES.md** - Safe migration procedures

### Key Tables
- `orders` - Core business entity (shop_id required)
- `customers` - Phone is primary identifier
- `products` - Multi-shop catalog
- `users` - Staff with roles (manager, florist, courier)
- `shops` - Multi-tenancy root (phone = separate shop)

### Migration Commands
```bash
make db-revision msg="description"  # Create migration
make db-migrate                     # Apply migrations
make db-rollback                   # Rollback last migration
make db-backup                     # Backup before changes
```

### Database Differences (Local vs Railway)
- **Local**: SQLite (file: `backend/flower_shop.db`)
- **Railway**: PostgreSQL (auto-provided via DATABASE_URL)
- **Migrations**: Run automatically on Railway via `docker-entrypoint.sh`
- **Type differences**: See DATABASE_STANDARDS.md for mapping table

## Auth and Phone Verification Memories

### Phone Authorization Methods
- **+77771234567 этот номер используй для авторизации** - Special phone number for testing authorization flow