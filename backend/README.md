# Cvety.kz Backend

FastAPI backend for the flower shop management system.

## Setup

1. **Create virtual environment:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Start PostgreSQL:**
   ```bash
   docker-compose up -d
   ```

5. **Run the application:**
   ```bash
   uvicorn app.main:app --reload
   ```

The API will be available at http://localhost:8000
API documentation: http://localhost:8000/api/docs

## API Endpoints

### Orders
- `GET /api/orders` - List orders with filtering
- `GET /api/orders/{id}` - Get order details
- `POST /api/orders` - Create new order
- `PATCH /api/orders/{id}` - Update order
- `PATCH /api/orders/{id}/status` - Update order status
- `PATCH /api/orders/{id}/issue` - Mark order as having issue

### Tracking
- `GET /api/tracking/{token}` - Get public tracking info

## Development

### Running with SQLite (for testing)
Change DATABASE_URL in .env:
```
DATABASE_URL=sqlite:///./flower_shop.db
```

### Database Migrations
```bash
# Create migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head
```

## Frontend Integration

The frontend is configured to proxy API requests to the backend.
Make sure both services are running:

1. Backend: `cd backend && uvicorn app.main:app --reload`
2. Frontend: `cd .. && npm run dev`