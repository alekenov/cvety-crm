#!/usr/bin/env python3
"""
Test adding Redis data in the same process
"""

import sys
import requests
import json
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

def add_redis_data_via_api():
    """Add data via API endpoint to ensure same Redis instance"""
    
    # Create a test endpoint call that will add the data
    url = "http://localhost:8001/api/auth/request-otp"
    
    # First call to add the mapping (will fail to send but will add to Redis)
    data = {"phone": "+77015211545"}
    
    print(f"📞 Вызываем API для добавления номера в Redis...")
    
    try:
        response = requests.post(url, json=data, timeout=10)
        print(f"📤 Ответ API: {response.status_code}")
        if response.status_code in [200, 201]:
            print(f"✅ Ответ: {response.json()}")
        else:
            print(f"❌ Ошибка: {response.text}")
    except Exception as e:
        print(f"❌ Ошибка запроса: {e}")

if __name__ == "__main__":
    add_redis_data_via_api()