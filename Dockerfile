# Multi-stage optimized Dockerfile for Railway
# Stage 1: Build frontend
FROM node:18-slim AS frontend-builder

WORKDIR /app

# OPTIMIZATION: Copy only package files first for better caching
# This allows npm install to be cached when only source code changes
COPY package*.json ./

# Install dependencies (this layer will be cached)
RUN npm ci

# Now copy the rest of the source code
# Any changes here won't invalidate the npm install cache
COPY index.html vite.config.ts tsconfig*.json ./
COPY src ./src
COPY public ./public
COPY components.json ./

# Build frontend with memory optimization
ENV NODE_OPTIONS="--max-old-space-size=512"
# Production build removes source maps and development code
RUN npm run build

# Stage 2: Python runtime
FROM python:3.9-slim

# Set Python environment variables for production
ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONOPTIMIZE=1

WORKDIR /app

# Install system dependencies for Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# OPTIMIZATION: Copy only requirements first for better caching
# This allows pip install to be cached when only source code changes
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Now copy backend code (changes here won't invalidate pip install cache)
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

# Add health check for Railway
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Use shell form to ensure PORT variable is expanded
CMD ["sh", "-c", "./docker-entrypoint.sh"]