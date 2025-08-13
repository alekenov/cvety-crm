#!/usr/bin/env python3
"""
Test real OTP sending to registered telegram user
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.telegram_service import telegram_service
from app.services.redis_service import redis_service
from app.core.config import get_settings

async def test_real_otp_sending():
    """Test sending OTP to registered phone number"""
    settings = get_settings()
    phone = '+77015211545'
    
    print(f"🤖 Инициализируем Telegram сервис...")
    
    try:
        # Initialize telegram service
        await telegram_service.initialize(settings.TELEGRAM_BOT_TOKEN)
        print("✅ Telegram service инициализирован")
        
        # Check if phone is registered
        telegram_data = redis_service.get(f"telegram:{phone}")
        print(f"📞 Данные для номера {phone}: {telegram_data}")
        
        if telegram_data and telegram_data.get("telegram_id"):
            telegram_id = int(telegram_data["telegram_id"])
            test_otp = "654321"
            
            print(f"📤 Отправляем OTP {test_otp} на telegram_id: {telegram_id}")
            result = await telegram_service.send_otp(telegram_id, test_otp)
            
            if result:
                print("✅ OTP успешно отправлен!")
            else:
                print("❌ Ошибка отправки OTP")
        else:
            print("❌ Номер телефона не зарегистрирован в Redis")
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")
    
    finally:
        # Cleanup
        await telegram_service.stop()

if __name__ == "__main__":
    print("🧪 Тестируем реальную отправку OTP...")
    asyncio.run(test_real_otp_sending())
    print("🏁 Тест завершен")