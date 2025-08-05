#!/usr/bin/env python3
import os
import sys
from datetime import datetime, timedelta
from jose import jwt

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import get_settings

settings = get_settings()

# Create a test token
data = {
    "sub": "1",  # shop_id
    "phone": "+77011234567",
    "user_id": "1"
}

expires = datetime.utcnow() + timedelta(hours=24)
data["exp"] = expires

token = jwt.encode(data, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

print(f"Test token for development:")
print(f"Bearer {token}")
print()
print(f"Use it in headers:")
print(f"Authorization: Bearer {token}")
