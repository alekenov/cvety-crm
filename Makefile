.PHONY: help dev build test deploy clean setup

# Default target
help:
	@echo "Available commands:"
	@echo "  make setup    - Initial project setup"
	@echo "  make dev      - Run development servers"
	@echo "  make build    - Build Docker image"
	@echo "  make test     - Run tests"
	@echo "  make deploy   - Deploy to Railway"
	@echo "  make clean    - Clean build artifacts"

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
	@echo "🚀 Deploying to Railway..."
	railway up

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf dist/
	rm -rf backend/__pycache__/
	rm -rf backend/.pytest_cache/
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	@echo "✅ Clean complete!"

# Database operations
db-migrate:
	@echo "📋 Running database migrations..."
	cd backend && alembic upgrade head

db-rollback:
	@echo "⏪ Rolling back last migration..."
	cd backend && alembic downgrade -1

db-init:
	@echo "📦 Initializing test data..."
	cd backend && python init_test_data.py