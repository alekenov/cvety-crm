#!/usr/bin/env python3
"""
Add test telegram data to Redis for testing OTP sending
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.redis_service import redis_service

def add_test_data():
    """Add test telegram data to Redis"""
    phone = '+77015211545'
    telegram_data = {
        "telegram_id": "626599",  # Your actual telegram_id
        "telegram_username": "alekenov",
        "first_name": "Alek",
        "last_name": "Enov"
    }
    
    print(f"📞 Добавляем данные для номера {phone}")
    print(f"📱 Telegram ID: {telegram_data['telegram_id']}")
    
    # Store for 24 hours
    redis_service.set_with_ttl(f"telegram:{phone}", telegram_data, 86400)
    
    # Verify data was saved
    saved_data = redis_service.get(f"telegram:{phone}")
    print(f"✅ Сохраненные данные: {saved_data}")

if __name__ == "__main__":
    add_test_data()