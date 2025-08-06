import redis
from typing import Optional, Any
import json
import logging
from app.core.config import get_settings

logger = logging.getLogger(__name__)


class RedisService:
    """Service for Redis operations with connection pooling"""
    
    def __init__(self):
        self._pool = None
        self._client = None
    
    @property
    def client(self) -> redis.Redis:
        """Get Redis client with lazy initialization"""
        if self._client is None:
            settings = get_settings()
            redis_url = settings.REDIS_URL if hasattr(settings, 'REDIS_URL') else None
            
            if redis_url:
                self._pool = redis.ConnectionPool.from_url(
                    redis_url,
                    decode_responses=True,
                    max_connections=10
                )
                self._client = redis.Redis(connection_pool=self._pool)
                logger.info("Redis client initialized successfully")
            else:
                logger.warning("REDIS_URL not found, Redis features will be disabled")
                # Return a mock client that does nothing
                self._client = MockRedisClient()
        
        return self._client
    
    def set_with_ttl(self, key: str, value: Any, ttl_seconds: int) -> bool:
        """Set a key with TTL (time to live)"""
        try:
            # Convert complex objects to JSON
            if isinstance(value, (dict, list)):
                value = json.dumps(value)
            
            return self.client.setex(key, ttl_seconds, value)
        except Exception as e:
            logger.error(f"Redis SET failed for key {key}: {e}")
            return False
    
    def get(self, key: str) -> Optional[str]:
        """Get value by key"""
        try:
            value = self.client.get(key)
            
            # Try to parse JSON if possible
            if value:
                try:
                    return json.loads(value)
                except (json.JSONDecodeError, TypeError):
                    return value
                    
            return value
        except Exception as e:
            logger.error(f"Redis GET failed for key {key}: {e}")
            return None
    
    def delete(self, key: str) -> bool:
        """Delete a key"""
        try:
            return bool(self.client.delete(key))
        except Exception as e:
            logger.error(f"Redis DELETE failed for key {key}: {e}")
            return False
    
    def increment(self, key: str, amount: int = 1) -> Optional[int]:
        """Increment a counter"""
        try:
            return self.client.incrby(key, amount)
        except Exception as e:
            logger.error(f"Redis INCREMENT failed for key {key}: {e}")
            return None
    
    def get_ttl(self, key: str) -> Optional[int]:
        """Get remaining TTL for a key"""
        try:
            ttl = self.client.ttl(key)
            return ttl if ttl > 0 else None
        except Exception as e:
            logger.error(f"Redis TTL failed for key {key}: {e}")
            return None
    
    def exists(self, key: str) -> bool:
        """Check if key exists"""
        try:
            return bool(self.client.exists(key))
        except Exception as e:
            logger.error(f"Redis EXISTS failed for key {key}: {e}")
            return False


class MockRedisClient:
    """Mock Redis client for development without Redis"""
    
    def __init__(self):
        self._store = {}
    
    def setex(self, key: str, seconds: int, value: Any) -> bool:
        # Store value as string to match real Redis behavior
        if isinstance(value, (dict, list)):
            value = json.dumps(value)
        self._store[key] = value
        return True
    
    def get(self, key: str) -> Optional[Any]:
        value = self._store.get(key)
        # Try to parse JSON to match RedisService.get() behavior
        if value:
            try:
                return json.loads(value)
            except (json.JSONDecodeError, TypeError):
                return value
        return value
    
    def delete(self, key: str) -> int:
        if key in self._store:
            del self._store[key]
            return 1
        return 0
    
    def incrby(self, key: str, amount: int) -> int:
        current = int(self._store.get(key, 0))
        new_value = current + amount
        self._store[key] = str(new_value)  # Store as string
        return new_value
    
    def ttl(self, key: str) -> int:
        return 60 if key in self._store else -1
    
    def exists(self, key: str) -> int:
        return 1 if key in self._store else 0


# Global instance
redis_service = RedisService()