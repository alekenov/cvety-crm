"""
Security middleware for the application.
Includes rate limiting, HTTPS redirect, and security headers.
"""
import time
import hashlib
import hmac
from typing import Dict, Optional, Callable
from functools import wraps
from fastapi import Request, Response, HTTPException, status
from fastapi.responses import RedirectResponse
from starlette.middleware.base import BaseHTTPMiddleware
from collections import defaultdict
from datetime import datetime, timedelta
import logging

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware to prevent abuse"""
    
    def __init__(self, app, calls: int = 100, period: int = 60):
        super().__init__(app)
        self.calls = calls
        self.period = period
        self.clients: Dict[str, list] = defaultdict(list)
    
    def _get_client_id(self, request: Request) -> str:
        """Get unique client identifier from request"""
        # Use IP address as client identifier
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0]
        return request.client.host if request.client else "unknown"
    
    def _is_rate_limited(self, client_id: str) -> bool:
        """Check if client has exceeded rate limit"""
        now = time.time()
        # Clean old requests
        self.clients[client_id] = [
            req_time for req_time in self.clients[client_id]
            if req_time > now - self.period
        ]
        
        # Check if limit exceeded
        if len(self.clients[client_id]) >= self.calls:
            return True
        
        # Add current request
        self.clients[client_id].append(now)
        return False
    
    async def dispatch(self, request: Request, call_next):
        """Process request with rate limiting"""
        # Skip rate limiting for health checks and static files
        if request.url.path in ["/health", "/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)
        
        # Skip for static assets
        if request.url.path.startswith("/assets/") or request.url.path.startswith("/uploads/"):
            return await call_next(request)
        
        client_id = self._get_client_id(request)
        
        # Apply stricter limits to auth endpoints
        if "/auth/" in request.url.path:
            # 5 requests per minute for auth endpoints
            if self._is_rate_limited(client_id):
                logger.warning(f"Rate limit exceeded for {client_id} on {request.url.path}")
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many requests. Please try again later."
                )
        
        response = await call_next(request)
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses"""
    
    async def dispatch(self, request: Request, call_next):
        """Add security headers to response"""
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # HSTS for production
        settings = get_settings()
        if not settings.DEBUG and request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        # CSP - adjust based on your needs
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' data:; "
            "connect-src 'self' ws: wss:;"
        )
        response.headers["Content-Security-Policy"] = csp
        
        return response


class HTTPSRedirectMiddleware(BaseHTTPMiddleware):
    """Redirect HTTP to HTTPS in production"""
    
    async def dispatch(self, request: Request, call_next):
        """Redirect to HTTPS if needed"""
        settings = get_settings()
        
        # Only redirect in production
        if not settings.DEBUG:
            # Check if request is HTTP
            if request.url.scheme == "http":
                # Skip redirect for health checks
                if request.url.path == "/health":
                    return await call_next(request)
                
                # Redirect to HTTPS
                url = request.url.replace(scheme="https")
                return RedirectResponse(url=str(url), status_code=301)
        
        return await call_next(request)


def rate_limit(max_requests: int = 5, window: int = 60):
    """
    Decorator for rate limiting specific endpoints.
    
    Args:
        max_requests: Maximum number of requests allowed
        window: Time window in seconds
    """
    def decorator(func: Callable) -> Callable:
        # Store request times for each client
        func._rate_limit_storage = defaultdict(list)
        
        @wraps(func)
        async def wrapper(*args, **kwargs):
            from starlette.requests import Request
            
            # Find Request object in args or kwargs
            # Check common parameter names: request, http_request, req
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            
            if not request:
                # Check kwargs for various names
                for key in ['request', 'http_request', 'req']:
                    if key in kwargs and isinstance(kwargs[key], Request):
                        request = kwargs[key]
                        break
            
            if not request:
                # If no Request object found, call function without rate limiting
                return await func(*args, **kwargs)
            
            # Get client identifier
            forwarded = request.headers.get("X-Forwarded-For")
            if forwarded:
                client_id = forwarded.split(",")[0]
            else:
                client_id = request.client.host if request.client else "unknown"
            
            now = time.time()
            storage = func._rate_limit_storage
            
            # Clean old requests
            storage[client_id] = [
                req_time for req_time in storage[client_id]
                if req_time > now - window
            ]
            
            # Check rate limit
            if len(storage[client_id]) >= max_requests:
                logger.warning(f"Rate limit exceeded for {client_id} on {func.__name__}")
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded. Maximum {max_requests} requests per {window} seconds."
                )
            
            # Add current request
            storage[client_id].append(now)
            
            # Call original function without modifying args
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator


def verify_telegram_webhook_signature(
    secret_token: str,
    request_body: bytes,
    signature: Optional[str]
) -> bool:
    """
    Verify Telegram webhook signature.
    
    Args:
        secret_token: Secret token configured in Telegram
        request_body: Raw request body
        signature: X-Telegram-Bot-Api-Secret-Token header value
    
    Returns:
        True if signature is valid
    """
    if not signature:
        return False
    
    # Calculate expected signature
    expected_signature = hmac.new(
        secret_token.encode(),
        request_body,
        hashlib.sha256
    ).hexdigest()
    
    # Compare signatures (constant time comparison)
    return hmac.compare_digest(signature, expected_signature)