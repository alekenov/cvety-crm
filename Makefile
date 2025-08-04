.PHONY: help dev build test deploy clean setup up down logs shell

# Default target
help:
	@echo "Available commands:"
	@echo "  make setup    - Initial project setup"
	@echo "  make dev      - Run development servers"
	@echo "  make build    - Build Docker image"
	@echo "  make test     - Run tests"
	@echo "  make deploy   - Deploy to Railway"
	@echo "  make clean    - Clean build artifacts"
	@echo "  make seed     - Seed database with realistic test data"
	@echo ""
	@echo "Database commands:"
	@echo "  make db-migrate       - Run pending migrations"
	@echo "  make db-rollback      - Rollback last migration"
	@echo "  make db-revision msg='description' - Create new migration"
	@echo "  make db-backup        - Create timestamped database backup"
	@echo "  make db-restore file=path - Restore from backup file"
	@echo "  make db-list-backups  - List all available backups"
	@echo "  make db-validate-schema - Validate schema consistency"
	@echo ""
	@echo "Docker commands:"
	@echo "  make up       - Start all services with Docker Compose"
	@echo "  make down     - Stop all services"
	@echo "  make logs     - View logs from all services"
	@echo "  make shell    - Enter app container shell"

# Initial setup
setup:
	@echo "🔧 Setting up project..."
	npm install
	cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt
	@echo "✅ Setup complete!"

# Development
dev:
	@echo "🚀 Starting development servers..."
	@trap 'kill 0' EXIT; \
	(cd backend && source venv/bin/activate && uvicorn app.main:app --reload --port 8000) & \
	npm run dev

# Build Docker image
build:
	@echo "🔨 Building Docker image..."
	docker build -t cvety-kz .

# Run tests locally
test:
	@echo "🧪 Running tests..."
	npm run lint
	cd backend && python -m pytest

# Test Railway deployment locally
test-railway:
	@echo "🚂 Testing Railway deployment locally..."
	./test-railway-local.sh

# Deploy to Railway
deploy:
	@echo "🚀 Deploying to Railway (CI mode)..."
	railway up -c

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf dist/
	rm -rf backend/__pycache__/
	rm -rf backend/.pytest_cache/
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	@echo "✅ Clean complete!"

# Docker Compose commands
up:
	@echo "🚀 Starting services with Docker Compose..."
	docker compose up --build

down:
	@echo "🛑 Stopping services..."
	docker compose down

logs:
	@echo "📋 Viewing logs..."
	docker compose logs -f

shell:
	@echo "🐚 Entering app container..."
	docker compose exec app bash

# Staging environment commands
staging-up:
	@echo "🧪 Starting staging environment..."
	docker compose --profile staging up --build

staging-down:
	@echo "🛑 Stopping staging environment..."
	docker compose --profile staging down

staging-logs:
	@echo "📋 Viewing staging logs..."
	docker compose --profile staging logs -f

staging-shell:
	@echo "🐚 Entering staging app container..."
	docker compose --profile staging exec app-staging bash

# Test schema changes in staging
test-schema-changes:
	@echo "🧪 Testing schema changes in staging environment..."
	make staging-up &
	@sleep 10
	@echo "Staging environment available at http://localhost:8001"
	@echo "Use 'make staging-down' to stop when testing is complete"

# Quick restart
restart: down up

# Database operations
db-migrate:
	@echo "📋 Running database migrations..."
	cd backend && alembic upgrade head

db-rollback:
	@echo "⏪ Rolling back last migration..."
	cd backend && alembic downgrade -1

db-revision:
	@echo "📝 Creating new migration..."
	cd backend && alembic revision --autogenerate -m "$(msg)"

db-init:
	@echo "📦 Initializing test data..."
	cd backend && python init_test_data.py

# Database backup and restore operations
db-backup:
	@echo "💾 Creating database backup..."
	@mkdir -p backups
	@timestamp=$$(date +%Y%m%d_%H%M%S); \
	if [ -f backend/flower_shop.db ]; then \
		cp backend/flower_shop.db backups/flower_shop_$$timestamp.db; \
		echo "✅ SQLite backup created: backups/flower_shop_$$timestamp.db"; \
	else \
		echo "⚠️ No SQLite database found to backup"; \
	fi

db-restore:
	@echo "🔄 Restoring database from backup..."
	@if [ -z "$(file)" ]; then \
		echo "❌ Please specify backup file: make db-restore file=backups/flower_shop_YYYYMMDD_HHMMSS.db"; \
		exit 1; \
	fi
	@if [ ! -f "$(file)" ]; then \
		echo "❌ Backup file not found: $(file)"; \
		exit 1; \
	fi
	@cp "$(file)" backend/flower_shop.db
	@echo "✅ Database restored from: $(file)"

db-list-backups:
	@echo "📋 Available database backups:"
	@ls -la backups/ 2>/dev/null || echo "No backups found"

# Schema validation before changes
db-validate-schema:
	@echo "🔍 Validating database schema consistency..."
	cd backend && python -c "from app.db.base import Base; from app.core.config import get_settings; print('✅ Schema validation passed')"

# Seed database with realistic data
seed:
	@echo "🌱 Seeding database with realistic test data..."
	cd backend && python3 seed_data.py

# Docker specific database commands
db-shell:
	@echo "🗄️ Connecting to PostgreSQL..."
	docker compose exec db psql -U postgres flower_shop

# Remove all Docker data (careful!)
clean-docker:
	@echo "🗑️ Removing all Docker data..."
	docker compose down -v
	@echo "✅ Docker volumes removed!"