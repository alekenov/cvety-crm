# Multi-stage optimized Dockerfile for Railway
# Stage 1: Build frontend
FROM node:18-slim AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY index.html vite.config.ts tsconfig*.json ./
COPY src ./src
COPY public ./public
COPY components.json ./

# Build frontend with memory optimization
ENV NODE_OPTIONS="--max-old-space-size=512"
RUN npm run build

# Stage 2: Python runtime
FROM python:3.9-slim

# Set Python environment variables
ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Install system dependencies for Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend code
COPY backend ./backend

# Copy frontend build from previous stage
COPY --from=frontend-builder /app/dist ./dist

# Copy startup script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Railway will provide PORT environment variable
ENV PORT=8000
EXPOSE ${PORT}

# Use shell form to ensure PORT variable is expanded
CMD ["sh", "-c", "./docker-entrypoint.sh"]