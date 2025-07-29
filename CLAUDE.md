# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cvety.kz is a full-stack flower shop management system for the Kazakhstan market. The codebase contains a React/TypeScript frontend with shadcn/ui components and a FastAPI/Python backend.

## Commands

### Frontend Commands
```bash
npm install          # Install dependencies
npm run dev          # Start dev server (port 5173/5174)
npm run build        # Build for production
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Backend Commands
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload  # Start backend (port 8000)
```

### Running Both Services
```bash
# Terminal 1 - Backend
cd backend && source venv/bin/activate && uvicorn app.main:app --reload

# Terminal 2 - Frontend
npm run dev
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
- ⏳ Warehouse API (partial)
- ❌ Customers API
- ❌ Production API
- ❌ Authentication (JWT prepared but not implemented)
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
railway up               # Deploy to Railway
railway logs             # View deployment logs
railway status           # Check deployment status
```

### Required Environment Variables
- `DATABASE_URL` - PostgreSQL connection (provided by Railway)
- `SECRET_KEY` - JWT secret key
- `PORT` - Application port (provided by Railway)
- `RAILWAY_ENVIRONMENT` - Environment name (provided by Railway)

### Deployment Files
- `railway.json` - Railway configuration
- `Dockerfile` - Optimized multi-stage build
- `docker-entrypoint.sh` - Startup script with migrations
- `.dockerignore` - Reduces build context size
- `RAILWAY_DEPLOYMENT.md` - Detailed deployment guide