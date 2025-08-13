#!/usr/bin/env python3
"""
Test script to verify telegram_service can send OTP with new bot token
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.telegram_service import telegram_service
from app.core.config import get_settings

async def test_telegram_service():
    """Test if telegram service can initialize and send OTP"""
    settings = get_settings()
    
    print(f"🤖 Testing Telegram Bot Token: {settings.TELEGRAM_BOT_TOKEN[:10]}...")
    
    try:
        # Initialize telegram service
        await telegram_service.initialize(settings.TELEGRAM_BOT_TOKEN)
        print("✅ Telegram service initialized successfully")
        
        # Try to send test OTP to a test telegram ID
        test_telegram_id = 123456789  # Test ID
        test_otp = "123456"
        
        print(f"📤 Attempting to send OTP {test_otp} to telegram_id: {test_telegram_id}")
        result = await telegram_service.send_otp(test_telegram_id, test_otp)
        
        if result:
            print("✅ OTP sending function works (would send to valid telegram_id)")
        else:
            print("❌ OTP sending failed")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    finally:
        # Cleanup
        await telegram_service.stop()

if __name__ == "__main__":
    print("🧪 Testing Telegram Service with new bot...")
    asyncio.run(test_telegram_service())
    print("🏁 Test completed")