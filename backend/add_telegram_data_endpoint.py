#!/usr/bin/env python3
"""
Add telegram data directly to the running server's Redis instance
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.redis_service import redis_service
from app.services.telegram_service import telegram_service
from app.core.config import get_settings

async def add_and_test():
    """Add telegram data and test sending OTP"""
    
    # Add your data to Redis (same instance as running server)
    phone = '+77701521545'
    telegram_data = {
        "telegram_id": "626599",  # Your actual telegram_id
        "telegram_username": "alekenov", 
        "first_name": "Alek",
        "last_name": "Enov"
    }
    
    print(f"📞 Добавляем данные для номера {phone}")
    print(f"📱 Telegram ID: {telegram_data['telegram_id']}")
    
    # Store data
    redis_service.set_with_ttl(f"telegram:{phone}", telegram_data, 86400)
    
    # Verify data was saved
    saved_data = redis_service.get(f"telegram:{phone}")
    print(f"✅ Сохраненные данные: {saved_data}")
    
    # Initialize telegram service and test sending
    settings = get_settings()
    token = "7055194506:AAECXEMb9SW-nPZzZ843xZkjm8KeTW5hJn4"
    
    try:
        await telegram_service.initialize(token)
        print("✅ Telegram service инициализирован")
        
        # Send test OTP
        test_otp = "123456"
        telegram_id = int(telegram_data["telegram_id"])
        
        print(f"📤 Отправляем тестовый OTP {test_otp} на telegram_id: {telegram_id}")
        result = await telegram_service.send_otp(telegram_id, test_otp)
        
        if result:
            print("✅ OTP успешно отправлен! Проверьте Telegram!")
        else:
            print("❌ Ошибка отправки OTP")
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")
    finally:
        await telegram_service.stop()

if __name__ == "__main__":
    asyncio.run(add_and_test())