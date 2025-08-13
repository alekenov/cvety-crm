#!/usr/bin/env python3
"""
Test complete OTP flow: register phone + send OTP
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.telegram_service import telegram_service
from app.services.redis_service import redis_service
from app.core.config import get_settings

async def test_complete_otp_flow():
    """Test complete OTP flow"""
    settings = get_settings()
    phone = '+77015211545'
    test_telegram_id = 987654321  # Тестовый ID
    
    print(f"🤖 Полный тест OTP flow...")
    
    try:
        # Step 1: Register phone in Redis (simulate bot registration)
        telegram_data = {
            'telegram_id': str(test_telegram_id),
            'telegram_username': 'test_user',
            'first_name': 'Test',
            'last_name': 'User'
        }
        
        redis_service.set_with_ttl(f'telegram:{phone}', telegram_data, 86400)
        print(f"✅ Шаг 1: Номер {phone} зарегистрирован в Redis")
        
        # Step 2: Initialize telegram service
        await telegram_service.initialize(settings.TELEGRAM_BOT_TOKEN)
        print("✅ Шаг 2: Telegram service инициализирован")
        
        # Step 3: Check registration
        stored_data = redis_service.get(f"telegram:{phone}")
        print(f"✅ Шаг 3: Проверка регистрации: {stored_data}")
        
        # Step 4: Send OTP
        if stored_data and stored_data.get("telegram_id"):
            telegram_id = int(stored_data["telegram_id"])
            test_otp = "555777"
            
            print(f"📤 Шаг 4: Отправляем OTP {test_otp} на telegram_id: {telegram_id}")
            result = await telegram_service.send_otp(telegram_id, test_otp)
            
            if result:
                print("✅ OTP отправка успешна (но chat не найден - это нормально для тестового ID)")
            else:
                print("❌ Ошибка отправки OTP")
        else:
            print("❌ Ошибка: Номер не найден в Redis")
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")
    
    finally:
        await telegram_service.stop()

if __name__ == "__main__":
    asyncio.run(test_complete_otp_flow())