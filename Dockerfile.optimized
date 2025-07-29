# Highly optimized Dockerfile for Railway free tier
# Uses minimal base images and aggressive optimization

# Stage 1: Frontend build with minimal memory
FROM node:18-alpine AS frontend-builder
WORKDIR /app

# Copy only package files first
COPY package*.json ./

# Install only production dependencies with memory optimization
RUN npm ci --omit=dev --prefer-offline --no-audit --maxsockets 1 --loglevel error

# Copy source files
COPY index.html vite.config.ts tsconfig*.json ./
COPY src ./src
COPY public ./public

# Build with aggressive memory limits
ENV NODE_OPTIONS="--max-old-space-size=256"
RUN npm run build && \
    # Clean up immediately to free memory
    rm -rf node_modules src public *.json *.ts

# Stage 2: Python dependencies
FROM python:3.9-alpine AS python-deps
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache gcc musl-dev postgresql-dev

# Copy requirements
COPY backend/requirements.txt ./

# Install Python packages one by one to minimize memory usage
RUN pip install --no-cache-dir --no-compile --user fastapi==0.109.0 && \
    pip install --no-cache-dir --no-compile --user uvicorn[standard]==0.25.0 && \
    pip install --no-cache-dir --no-compile --user sqlalchemy==2.0.23 && \
    pip install --no-cache-dir --no-compile --user psycopg2-binary==2.9.9 && \
    pip install --no-cache-dir --no-compile --user alembic==1.13.1 && \
    pip install --no-cache-dir --no-compile --user pydantic[email]==2.5.3 && \
    pip install --no-cache-dir --no-compile --user pydantic-settings==2.1.0 && \
    pip install --no-cache-dir --no-compile --user python-jose[cryptography]==3.3.0 && \
    pip install --no-cache-dir --no-compile --user passlib[bcrypt]==1.7.4 && \
    pip install --no-cache-dir --no-compile --user python-multipart==0.0.6 && \
    pip install --no-cache-dir --no-compile --user python-dotenv==1.0.0 && \
    pip install --no-cache-dir --no-compile --user email-validator==2.2.0

# Stage 3: Final minimal runtime
FROM python:3.9-alpine
WORKDIR /app

# Install only runtime dependencies
RUN apk add --no-cache libpq && \
    # Create non-root user
    adduser -D -u 1001 appuser

# Copy Python packages from deps stage
COPY --from=python-deps --chown=appuser:appuser /root/.local /home/appuser/.local

# Copy backend code
COPY --chown=appuser:appuser backend ./backend

# Copy frontend build
COPY --from=frontend-builder --chown=appuser:appuser /app/dist ./dist

# Copy startup script
COPY --chown=appuser:appuser docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Switch to non-root user
USER appuser

# Add user's Python packages to PATH
ENV PATH="/home/appuser/.local/bin:${PATH}" \
    PYTHONPATH="/home/appuser/.local/lib/python3.9/site-packages:${PYTHONPATH}" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

# Expose port
EXPOSE ${PORT}

# Use shell form to ensure environment variables are expanded
CMD ["sh", "-c", "./docker-entrypoint.sh"]