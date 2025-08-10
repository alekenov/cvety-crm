# Multi-stage optimized Dockerfile for Railway
# Stage 1: Dependencies installation (cached separately)
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Install dependencies with Railway cache mount
# Railway requires specific cache mount format with id parameter
RUN --mount=type=cache,id=s/frontend-npm,target=/root/.npm \
    npm ci --cache /root/.npm --prefer-offline

# Stage 2: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy package files and source code
COPY package*.json ./
COPY index.html vite.config.ts tsconfig*.json ./
COPY src ./src
COPY public ./public
COPY components.json ./

# Build frontend with memory optimization and production settings
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"
RUN npm run build

# Stage 3: Python dependencies builder
FROM python:3.9-slim AS python-builder

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install with cache mount
COPY backend/requirements.txt ./backend/
RUN --mount=type=cache,id=s/main-pip,target=/root/.cache/pip \
    pip install --user -r backend/requirements.txt

# Stage 4: Final production image
FROM python:3.9-slim

# Set Python environment variables for production
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONOPTIMIZE=1 \
    PATH="/home/appuser/.local/bin:${PATH}"

# Install only runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 appuser

WORKDIR /app

# Copy Python dependencies from builder
COPY --from=python-builder --chown=appuser:appuser /root/.local /home/appuser/.local

# Copy backend code
COPY --chown=appuser:appuser backend ./backend

# Copy frontend build from previous stage
COPY --from=frontend-builder --chown=appuser:appuser /app/dist ./dist

# Copy startup script
COPY --chown=appuser:appuser docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Switch to non-root user
USER appuser

# Create necessary directories
RUN mkdir -p /app/backend/uploads

# Railway will provide PORT environment variable
ENV PORT=8000
EXPOSE ${PORT}

# Add health check for Railway
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Use shell form to ensure PORT variable is expanded
CMD ["sh", "-c", "./docker-entrypoint.sh"]