#!/usr/bin/env python3
"""
Script to verify Redis connection and functionality on Railway.
Tests all Redis operations used by the OTP service.
"""

import os
import sys
import json
from datetime import datetime

def test_redis_connection():
    """Test Redis connection and operations"""
    try:
        import redis
    except ImportError:
        print("❌ redis package not installed. Run: pip install redis")
        sys.exit(1)
    
    # Get Redis URL from environment
    redis_url = os.environ.get('REDIS_URL')
    
    if not redis_url:
        print("❌ REDIS_URL not found in environment variables")
        print("\nThis means Redis is not configured on Railway yet.")
        print("Please add Redis to your Railway project first:")
        print("1. Go to your Railway project")
        print("2. Click '+ New' → 'Database' → 'Add Redis'")
        print("3. Railway will automatically set REDIS_URL")
        sys.exit(1)
    
    print(f"✅ Found REDIS_URL: {redis_url[:30]}...")
    
    try:
        # Connect to Redis
        client = redis.from_url(redis_url, decode_responses=True)
        
        # Test connection
        print("\n🔍 Testing Redis connection...")
        client.ping()
        print("✅ Successfully connected to Redis!")
        
        # Test operations used by OTP service
        print("\n🔍 Testing Redis operations...")
        
        # Test setex (set with TTL)
        test_key = f"test:otp:{datetime.utcnow().isoformat()}"
        test_value = json.dumps({"code": "123456", "phone": "+77771234567"})
        client.setex(test_key, 300, test_value)  # 5 minutes TTL
        print("✅ setex: Stored value with TTL")
        
        # Test get
        retrieved = client.get(test_key)
        if retrieved == test_value:
            print("✅ get: Retrieved correct value")
        else:
            print(f"❌ get: Value mismatch. Expected: {test_value}, Got: {retrieved}")
        
        # Test TTL
        ttl = client.ttl(test_key)
        if 295 <= ttl <= 300:
            print(f"✅ ttl: TTL is {ttl} seconds")
        else:
            print(f"⚠️ ttl: Unexpected TTL value: {ttl}")
        
        # Test exists
        if client.exists(test_key):
            print("✅ exists: Key exists check works")
        else:
            print("❌ exists: Key should exist but doesn't")
        
        # Test incrby (for rate limiting)
        rate_key = "test:rate_limit:test"
        client.delete(rate_key)  # Clean up first
        result = client.incrby(rate_key, 1)
        if result == 1:
            print("✅ incrby: Counter incremented correctly")
        else:
            print(f"❌ incrby: Expected 1, got {result}")
        
        # Test delete
        client.delete(test_key)
        if not client.exists(test_key):
            print("✅ delete: Key deleted successfully")
        else:
            print("❌ delete: Key still exists after deletion")
        
        # Clean up
        client.delete(rate_key)
        
        print("\n✅ All Redis operations working correctly!")
        print("\nRedis Info:")
        info = client.info('server')
        print(f"  Version: {info.get('redis_version', 'Unknown')}")
        print(f"  Mode: {info.get('redis_mode', 'Unknown')}")
        
        return True
        
    except redis.ConnectionError as e:
        print(f"❌ Failed to connect to Redis: {e}")
        print("\nPossible issues:")
        print("1. Redis service might be sleeping (Railway free tier)")
        print("2. Network connectivity issues")
        print("3. Invalid REDIS_URL format")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🔍 Redis Connection Verification for Railway")
    print("=" * 50)
    
    success = test_redis_connection()
    
    if success:
        print("\n✅ Redis is ready for production use!")
        print("Your OTP authentication should now work correctly.")
    else:
        print("\n❌ Redis verification failed.")
        print("Please fix the issues above before deploying.")
        sys.exit(1)