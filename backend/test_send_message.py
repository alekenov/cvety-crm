#!/usr/bin/env python3
"""
Send test message to registered user
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.telegram_service import telegram_service
from app.services.redis_service import redis_service
from app.core.config import get_settings

async def send_test_message():
    """Send test OTP message to registered user"""
    settings = get_settings()
    phone = '+77015211545'
    
    print(f"🤖 Отправляем тестовое сообщение...")
    
    try:
        # Initialize telegram service
        await telegram_service.initialize(settings.TELEGRAM_BOT_TOKEN)
        print("✅ Telegram service инициализирован")
        
        # Check if phone is registered
        telegram_data = redis_service.get(f"telegram:{phone}")
        print(f"📞 Данные для номера {phone}: {telegram_data}")
        
        if telegram_data and telegram_data.get("telegram_id"):
            telegram_id = int(telegram_data["telegram_id"])
            test_otp = "888999"
            
            print(f"📤 Отправляем тестовый OTP {test_otp} на ваш telegram_id: {telegram_id}")
            result = await telegram_service.send_otp(telegram_id, test_otp)
            
            if result:
                print("✅ Сообщение успешно отправлено! Проверьте Telegram!")
            else:
                print("❌ Ошибка отправки сообщения")
                
            # Also send order notification test
            print("📦 Отправляем тестовое уведомление о заказе...")
            order_info = {
                'id': 123,
                'total': 15000,
                'customer_name': 'Тестовый клиент',
                'customer_phone': '+7 701 123 45 67',
                'delivery_address': 'ул. Тестовая, 123',
                'created_at': '2025-08-13 15:00:00'
            }
            
            notification_result = await telegram_service.send_order_notification(telegram_id, order_info)
            
            if notification_result:
                print("✅ Уведомление о заказе отправлено!")
            else:
                print("❌ Ошибка отправки уведомления")
                
        else:
            print("❌ Номер телефона не найден в Redis")
            print("Убедитесь, что вы написали номер +77015211545 боту @Cvetyoptbot")
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")
    
    finally:
        await telegram_service.stop()

if __name__ == "__main__":
    asyncio.run(send_test_message())