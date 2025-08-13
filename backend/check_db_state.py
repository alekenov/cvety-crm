#!/usr/bin/env python3
"""
Скрипт для проверки состояния базы данных в Railway
Проверяет наличие таблиц, их структуру и количество записей
"""
import os
import sys
from datetime import datetime
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker
import psycopg2
from psycopg2.extras import RealDictCursor

def main():
    print("🔍 Проверка состояния базы данных...")
    
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        print("❌ DATABASE_URL не найден в переменных окружения")
        return 1
    
    try:
        # Создание подключения
        print(f"🔗 Подключение к БД...")
        engine = create_engine(db_url)
        inspector = inspect(engine)
        
        # Получение списка таблиц
        tables = inspector.get_table_names()
        print(f"📊 Найдено таблиц: {len(tables)}")
        
        # Ожидаемые таблицы
        expected_tables = [
            'alembic_version',
            'shops', 'users', 'customers', 'customer_addresses', 'customer_important_dates',
            'products', 'product_images', 'product_ingredients', 'product_components',
            'orders', 'order_items', 'order_history', 'order_photos',
            'warehouse_items', 'warehouse_movements',
            'supplies', 'supply_items', 'flower_categories',
            'decorative_materials', 'comments'
        ]
        
        print("\n📋 Проверка наличия таблиц:")
        missing_tables = []
        for table in expected_tables:
            if table in tables:
                print(f"  ✅ {table}")
            else:
                print(f"  ❌ {table} - отсутствует")
                missing_tables.append(table)
        
        if missing_tables:
            print(f"\n⚠️  Отсутствуют таблицы: {', '.join(missing_tables)}")
        
        # Подсчет записей в каждой таблице
        print("\n📈 Количество записей в таблицах:")
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        session = SessionLocal()
        
        table_counts = {}
        for table in sorted(tables):
            try:
                result = session.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count = result.scalar()
                table_counts[table] = count
                print(f"  {table}: {count}")
            except Exception as e:
                print(f"  {table}: ❌ Ошибка - {str(e)}")
        
        # Проверка тестового магазина
        print("\n🏪 Проверка тестового магазина:")
        try:
            result = session.execute(text(
                "SELECT id, name, phone, is_active FROM shops WHERE phone = '+77011234567'"
            ))
            shop = result.fetchone()
            if shop:
                print(f"  ✅ Тестовый магазин найден:")
                print(f"     ID: {shop.id}")
                print(f"     Название: {shop.name}")
                print(f"     Телефон: {shop.phone}")
                print(f"     Активен: {shop.is_active}")
                
                # Проверка пользователей этого магазина
                result = session.execute(text(
                    f"SELECT COUNT(*) FROM users WHERE shop_id = {shop.id}"
                ))
                user_count = result.scalar()
                print(f"     Пользователей: {user_count}")
                
                # Проверка заказов этого магазина
                result = session.execute(text(
                    f"SELECT COUNT(*) FROM orders WHERE shop_id = {shop.id}"
                ))
                order_count = result.scalar()
                print(f"     Заказов: {order_count}")
                
            else:
                print("  ❌ Тестовый магазин (+77011234567) не найден")
                
        except Exception as e:
            print(f"  ❌ Ошибка при проверке тестового магазина: {str(e)}")
        
        # Проверка миграций
        print("\n🔄 Информация о миграциях:")
        try:
            result = session.execute(text("SELECT version_num FROM alembic_version"))
            version = result.scalar()
            if version:
                print(f"  ✅ Текущая версия миграции: {version}")
            else:
                print("  ❌ Информация о миграции не найдена")
        except Exception as e:
            print(f"  ❌ Ошибка при проверке миграций: {str(e)}")
        
        session.close()
        
        # Итоговый отчет
        print("\n📊 Итоговый отчет:")
        total_records = sum(table_counts.values())
        print(f"  Всего таблиц: {len(tables)}")
        print(f"  Всего записей: {total_records}")
        
        if total_records == 0:
            print("  ⚠️  База данных пуста - требуется заполнение тестовыми данными")
        elif total_records < 100:
            print("  ⚠️  Мало данных - рекомендуется добавить больше тестовых записей")
        else:
            print("  ✅ База данных содержит достаточно данных для тестирования")
        
        print(f"\n✅ Проверка завершена в {datetime.now().strftime('%H:%M:%S')}")
        return 0
        
    except Exception as e:
        print(f"\n❌ Ошибка подключения к БД: {str(e)}")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)