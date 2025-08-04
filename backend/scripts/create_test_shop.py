#!/usr/bin/env python3
"""
Скрипт для создания тестового магазина в базе данных
"""
import sys
import os
from pathlib import Path

# Add backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy.orm import Session
from app.db.session import get_db_session
from app.models.shop import Shop
from app.core.security import get_password_hash
from datetime import datetime, timedelta


def create_test_shop():
    """Создает тестовый магазин с известными данными для входа"""
    
    # Get database session
    SessionLocal = get_db_session()
    db = SessionLocal()
    
    try:
        # Check if test shop already exists
        existing_shop = db.query(Shop).filter(Shop.phone == "+77011234567").first()
        
        if existing_shop:
            print(f"✅ Тестовый магазин уже существует:")
            print(f"   ID: {existing_shop.id}")
            print(f"   Название: {existing_shop.name}")
            print(f"   Телефон: {existing_shop.phone}")
            print(f"   Город: {existing_shop.city}")
            return existing_shop
        
        # Create new test shop
        test_shop = Shop(
            name="Тестовый магазин цветов",
            phone="+77011234567",
            email="test@cvety.kz",
            telegram_id="123456789",
            telegram_username="test_flower_shop",
            address="ул. Тестовая, 123",
            city="Алматы",
            description="Тестовый магазин для разработки",
            business_hours={
                "mon": ["09:00", "18:00"],
                "tue": ["09:00", "18:00"],
                "wed": ["09:00", "18:00"],
                "thu": ["09:00", "18:00"],
                "fri": ["09:00", "18:00"],
                "sat": ["10:00", "16:00"],
                "sun": []
            },
            currency="KZT",
            timezone="Asia/Almaty",
            language="ru",
            is_active=True,
            is_verified=True,
            plan="premium",
            trial_ends_at=datetime.utcnow() + timedelta(days=30)
        )
        
        db.add(test_shop)
        db.commit()
        db.refresh(test_shop)
        
        print("✨ Тестовый магазин успешно создан!")
        print(f"   ID: {test_shop.id}")
        print(f"   Название: {test_shop.name}")
        print(f"   Телефон: {test_shop.phone}")
        print(f"   Email: {test_shop.email}")
        print(f"   План: {test_shop.plan}")
        print("\n📱 Для входа используйте:")
        print(f"   Телефон: {test_shop.phone}")
        print("   Код подтверждения: любой 6-значный код (в режиме DEBUG)")
        print("\n💡 Если DEBUG=False, используйте Telegram бот @lekenbot")
        
        return test_shop
        
    except Exception as e:
        print(f"❌ Ошибка при создании тестового магазина: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("🌸 Создание тестового магазина для Cvety.kz")
    print("-" * 50)
    
    # Check if running in production
    railway_env = os.getenv("RAILWAY_ENVIRONMENT")
    if railway_env == "production":
        response = input("⚠️  Вы запускаете скрипт в PRODUCTION окружении. Продолжить? (y/n): ")
        if response.lower() != 'y':
            print("Отменено.")
            sys.exit(0)
    
    create_test_shop()