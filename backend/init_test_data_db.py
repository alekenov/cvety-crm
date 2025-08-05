#!/usr/bin/env python3
"""
Script to initialize test data for development
"""
import os
import sys
from datetime import datetime, timedelta

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.db.session import get_db_session
from app.models.shop import Shop
from app.models.user import User, UserRole
from app.crud import shop as crud_shop
from app.crud import user as crud_user
from app.schemas.shop import ShopCreate
from app.schemas.user import UserCreate

def init_test_data():
    """Initialize test data in the database"""
    SessionLocal = get_db_session()
    db = SessionLocal()
    
    try:
        # Check if test shop already exists
        test_shop = db.query(Shop).filter_by(phone="+77011234567").first()
        
        if not test_shop:
            print("Creating test shop...")
            shop_data = ShopCreate(
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
                is_active=True,
                is_verified=True,
                plan="premium"
            )
            test_shop = crud_shop.create(db, obj_in=shop_data)
            print(f"✓ Created shop: {test_shop.name} (ID: {test_shop.id})")
        else:
            print(f"Shop already exists: {test_shop.name} (ID: {test_shop.id})")
        
        # Check if admin user exists
        admin_user = db.query(User).filter_by(
            shop_id=test_shop.id,
            role=UserRole.admin
        ).first()
        
        if not admin_user:
            print("Creating admin user...")
            admin_data = UserCreate(
                phone="+77011234567",
                name="Админ Тест",
                email="admin@test.com",
                role=UserRole.admin,
                is_active=True
            )
            admin_user = crud_user.create(db, obj_in=admin_data, shop_id=test_shop.id)
            print(f"✓ Created admin: {admin_user.name} (ID: {admin_user.id})")
        else:
            print(f"Admin already exists: {admin_user.name} (ID: {admin_user.id})")
        
        # Create other test users if they don't exist
        test_users = [
            {
                "phone": "+77012345671",
                "name": "Менеджер Айгуль",
                "email": "manager@test.com",
                "role": UserRole.manager
            },
            {
                "phone": "+77012345672",
                "name": "Флорист Динара",
                "email": "florist1@test.com",
                "role": UserRole.florist
            },
            {
                "phone": "+77012345673",
                "name": "Флорист Гульнара",
                "email": "florist2@test.com",
                "role": UserRole.florist
            },
            {
                "phone": "+77012345674",
                "name": "Курьер Асхат",
                "email": "courier@test.com",
                "role": UserRole.courier
            }
        ]
        
        for user_data in test_users:
            existing_user = db.query(User).filter_by(phone=user_data["phone"]).first()
            if not existing_user:
                user_create = UserCreate(**user_data, is_active=True)
                new_user = crud_user.create(db, obj_in=user_create, shop_id=test_shop.id)
                print(f"✓ Created {user_data['role']}: {new_user.name} (ID: {new_user.id})")
            else:
                print(f"{user_data['role'].capitalize()} already exists: {existing_user.name}")
        
        print("\n✅ Test data initialization complete!")
        print(f"\nYou can now login with:")
        print(f"  Phone: +77011234567")
        print(f"  OTP: Any 6-digit code (in DEBUG mode)")
        
        # Show all users
        print("\nAll users in the system:")
        all_users = db.query(User).filter_by(shop_id=test_shop.id).all()
        for user in all_users:
            print(f"  - {user.name} ({user.role}) - {user.phone}")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("Initializing test data for Cvety.kz...")
    init_test_data()
