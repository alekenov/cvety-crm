#!/usr/bin/env python3
"""
Скрипт для создания тестового флориста в базе данных
"""

import os
import sys
from pathlib import Path

# Добавляем путь к backend в sys.path
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import get_settings

def create_test_florist():
    settings = get_settings()
    
    # Создаем подключение к БД
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Импортируем модели после создания сессии
        from app.models.user import User, UserRole
        from app.models.shop import Shop
        
        # Находим первый магазин
        shop = db.query(Shop).first()
        if not shop:
            print("❌ Нет магазинов в базе данных. Сначала создайте магазин.")
            return
        
        print(f"✅ Найден магазин: {shop.name} (ID: {shop.id})")
        
        # Проверяем, существует ли уже флорист с таким номером
        test_phone = "+77051234567"  # Тестовый номер телефона
        existing_florist = db.query(User).filter(
            User.phone == test_phone,
            User.role == UserRole.florist
        ).first()
        
        if existing_florist:
            print(f"ℹ️  Флорист с номером {test_phone} уже существует:")
            print(f"   - Имя: {existing_florist.name}")
            print(f"   - ID: {existing_florist.id}")
            print(f"   - Telegram ID: {existing_florist.telegram_id}")
            return
        
        # Создаем нового флориста
        new_florist = User(
            phone=test_phone,
            name="Тестовый Флорист",
            email="florist@test.com",
            role=UserRole.florist,
            is_active=True,
            shop_id=shop.id,
            permissions={
                "orders": True,      # Может видеть заказы
                "warehouse": False,  # Не может управлять складом
                "customers": False,  # Не может видеть клиентов
                "production": True,  # Может работать с производством
                "settings": False,   # Не может менять настройки
                "users": False      # Не может управлять пользователями
            }
        )
        
        db.add(new_florist)
        db.commit()
        db.refresh(new_florist)
        
        print(f"✅ Создан тестовый флорист:")
        print(f"   - Имя: {new_florist.name}")
        print(f"   - Телефон: {new_florist.phone}")
        print(f"   - ID: {new_florist.id}")
        print(f"   - Магазин: {shop.name}")
        print(f"   - Права доступа:")
        for perm, value in new_florist.permissions.items():
            status = "✅" if value else "❌"
            print(f"     {status} {perm}")
        
        print("\n📱 Для тестирования авторизации:")
        print(f"   1. Откройте Telegram Mini App")
        print(f"   2. При запросе номера введите: {test_phone}")
        print(f"   3. Система должна авторизовать вас как флориста")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_florist()