# Build stage for frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with reduced memory usage
RUN npm ci --prefer-offline --no-audit --maxsockets 1

# Copy frontend source
COPY index.html vite.config.ts tsconfig*.json ./
COPY src ./src
COPY public ./public

# Build frontend with memory optimization
ENV NODE_OPTIONS="--max-old-space-size=512"
RUN npm run build

# Final stage - use slim image
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies with memory optimization
COPY backend/requirements.txt ./backend/
# Install in chunks to reduce memory usage
RUN pip install --no-cache-dir --no-compile --disable-pip-version-check \
    fastapi==0.109.0 uvicorn[standard]==0.25.0 && \
    pip install --no-cache-dir --no-compile --disable-pip-version-check \
    sqlalchemy==2.0.23 psycopg2-binary==2.9.9 alembic==1.13.1 && \
    pip install --no-cache-dir --no-compile --disable-pip-version-check \
    pydantic[email]==2.5.3 pydantic-settings==2.1.0 && \
    pip install --no-cache-dir --no-compile --disable-pip-version-check \
    python-jose[cryptography]==3.3.0 passlib[bcrypt]==1.7.4 && \
    pip install --no-cache-dir --no-compile --disable-pip-version-check \
    python-multipart==0.0.6 python-dotenv==1.0.0 email-validator==2.2.0

# Copy backend code
COPY backend ./backend

# Copy frontend build from previous stage
COPY --from=frontend-builder /app/dist ./dist

# Copy entrypoint and other files
COPY docker-entrypoint.sh ./
COPY components.json ./

# Make entrypoint executable
RUN chmod +x docker-entrypoint.sh

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

# Expose port
EXPOSE ${PORT}

# Use entrypoint for proper initialization
ENTRYPOINT ["./docker-entrypoint.sh"]