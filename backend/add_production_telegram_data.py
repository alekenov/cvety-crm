#!/usr/bin/env python3
"""
Add telegram data to production Redis directly
"""

import asyncio
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.redis_service import redis_service
from app.core.config import get_settings

async def add_production_telegram_data():
    """Add telegram data for test phone number to production Redis"""
    
    # Phone numbers to add
    phones_data = {
        '+77015211545': {
            "telegram_id": "626599",  # User's actual telegram_id
            "telegram_username": "alekenov", 
            "first_name": "Test",
            "last_name": "User"
        },
        '+77701521545': {
            "telegram_id": "626599",  # User's actual telegram_id
            "telegram_username": "alekenov", 
            "first_name": "Alek",
            "last_name": "Enov"
        }
    }
    
    print("🚀 Adding telegram data to Redis...")
    
    for phone, telegram_data in phones_data.items():
        print(f"📞 Добавляем данные для номера {phone}")
        print(f"📱 Telegram ID: {telegram_data['telegram_id']}")
        
        # Store data with 24 hour TTL
        redis_service.set_with_ttl(f"telegram:{phone}", telegram_data, 86400)
        
        # Verify data was saved
        saved_data = redis_service.get(f"telegram:{phone}")
        if saved_data:
            print(f"✅ Сохранено: {saved_data}")
        else:
            print(f"❌ Ошибка сохранения для {phone}")
    
    print("🎉 Готово!")

if __name__ == "__main__":
    asyncio.run(add_production_telegram_data())