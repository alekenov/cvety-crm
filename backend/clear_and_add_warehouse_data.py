#!/usr/bin/env python3
"""
Скрипт для очистки старых данных и добавления новых тестовых товаров с четкими датами
"""

import os
import sys
from datetime import datetime, timedelta
from sqlalchemy import create_engine, delete
from sqlalchemy.orm import sessionmaker

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.models.warehouse import WarehouseItem, WarehouseMovement, Delivery, DeliveryPosition, MovementType
from app.db.session import Base

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./flower_shop.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def clear_and_add_data():
    db = SessionLocal()
    try:
        print("🧹 Очищаем старые тестовые данные...")
        
        # Удаляем все движения
        deleted_movements = db.query(WarehouseMovement).delete()
        print(f"  ✓ Удалено движений: {deleted_movements}")
        
        # Удаляем все позиции поставок
        deleted_positions = db.query(DeliveryPosition).delete()
        print(f"  ✓ Удалено позиций поставок: {deleted_positions}")
        
        # Удаляем все поставки
        deleted_deliveries = db.query(Delivery).delete()
        print(f"  ✓ Удалено поставок: {deleted_deliveries}")
        
        # Удаляем все складские товары
        deleted_items = db.query(WarehouseItem).delete()
        print(f"  ✓ Удалено товаров: {deleted_items}")
        
        db.commit()
        print("\n✅ База данных очищена!")
        
        print("\n📦 Добавляем новые тестовые товары с разными датами поставок...")
        
        # Создаем поставки с явно разными датами
        deliveries_data = [
            {
                "supplier": "Голландские цветы",
                "farm": "Royal FloraHolland",
                "delivery_date": datetime(2024, 8, 1),  # 1 августа
                "currency": "EUR",
                "rate": 520.0,
                "comment": "Поставка начала месяца"
            },
            {
                "supplier": "Эквадор Директ",
                "farm": "Rosas del Ecuador",
                "delivery_date": datetime(2024, 8, 5),  # 5 августа
                "currency": "USD",
                "rate": 470.0,
                "comment": "Еженедельная поставка"
            },
            {
                "supplier": "Кения Flowers",
                "farm": "Nairobi Rose Farm",
                "delivery_date": datetime(2024, 8, 10),  # 10 августа
                "currency": "USD",
                "rate": 460.0,
                "comment": "Специальная поставка"
            },
            {
                "supplier": "Местный поставщик",
                "farm": "Алматинские теплицы",
                "delivery_date": datetime(2024, 8, 13),  # 13 августа (сегодня)
                "currency": "KZT",
                "rate": 1.0,
                "comment": "Свежая поставка сегодня"
            }
        ]
        
        # Товары для каждой поставки
        products_per_delivery = [
            # Поставка 1 августа
            [
                {"variety": "Роза Red Naomi", "height_cm": 60, "qty": 300, "cost_per_stem": 1.5},
                {"variety": "Роза White Naomi", "height_cm": 50, "qty": 250, "cost_per_stem": 1.3},
            ],
            # Поставка 5 августа
            [
                {"variety": "Роза Freedom", "height_cm": 80, "qty": 400, "cost_per_stem": 2.5},
                {"variety": "Роза Explorer", "height_cm": 90, "qty": 350, "cost_per_stem": 3.0},
            ],
            # Поставка 10 августа
            [
                {"variety": "Пион Sarah Bernhardt", "height_cm": 60, "qty": 200, "cost_per_stem": 4.0},
                {"variety": "Гортензия белая", "height_cm": 50, "qty": 150, "cost_per_stem": 3.5},
            ],
            # Поставка 13 августа (сегодня)
            [
                {"variety": "Тюльпан Strong Gold", "height_cm": 35, "qty": 500, "cost_per_stem": 150},
                {"variety": "Хризантема белая", "height_cm": 60, "qty": 300, "cost_per_stem": 250},
            ]
        ]
        
        created_items = []
        
        # Создаем поставки и товары
        for i, delivery_data in enumerate(deliveries_data):
            # Создаем поставку
            delivery = Delivery(
                supplier=delivery_data["supplier"],
                farm=delivery_data["farm"],
                delivery_date=delivery_data["delivery_date"],
                currency=delivery_data["currency"],
                rate=delivery_data["rate"],
                comment=delivery_data["comment"],
                created_by="test_script",
                cost_total=0
            )
            
            # Добавляем позиции поставки
            total_cost = 0
            for product in products_per_delivery[i]:
                position = DeliveryPosition(
                    variety=product["variety"],
                    height_cm=product["height_cm"],
                    qty=product["qty"],
                    cost_per_stem=product["cost_per_stem"],
                    total_cost=product["qty"] * product["cost_per_stem"]
                )
                delivery.positions.append(position)
                total_cost += position.total_cost
            
            delivery.cost_total = total_cost
            db.add(delivery)
            db.flush()
            
            # Создаем складские позиции для каждого товара
            for j, product in enumerate(products_per_delivery[i]):
                batch_code = f"B{delivery.delivery_date.strftime('%Y%m%d')}-{delivery.id}-{j+1}"
                sku = f"{product['variety'][:3].upper()}-{delivery.farm[:3].upper()}-{product['height_cm']}-{batch_code}"
                
                # Рассчитываем цены
                cost_in_kzt = product["cost_per_stem"] * delivery.rate
                markup = 2.0 if "Роза" in product["variety"] else 1.8
                recommended_price = cost_in_kzt * markup
                
                warehouse_item = WarehouseItem(
                    sku=sku,
                    batch_code=batch_code,
                    variety=product["variety"],
                    height_cm=product["height_cm"],
                    farm=delivery.farm,
                    supplier=delivery.supplier,
                    delivery_date=delivery.delivery_date,
                    currency=delivery.currency,
                    rate=delivery.rate,
                    cost=product["cost_per_stem"],
                    recommended_price=recommended_price,
                    price=recommended_price,
                    markup_pct=(markup - 1) * 100,
                    qty=product["qty"],
                    reserved_qty=0,
                    on_showcase=True,
                    to_write_off=False,
                    hidden=False,
                    updated_by="test_script"
                )
                
                db.add(warehouse_item)
                db.flush()
                
                # Создаем начальное движение (поступление)
                movement = WarehouseMovement(
                    warehouse_item_id=warehouse_item.id,
                    type=MovementType.IN,
                    quantity=product["qty"],
                    description=f"Поставка от {delivery.supplier} ({delivery.delivery_date.strftime('%d.%m.%Y')})",
                    reference_type="delivery",
                    reference_id=str(delivery.id),
                    created_by="test_script",
                    qty_before=0,
                    qty_after=product["qty"]
                )
                db.add(movement)
                
                created_items.append(warehouse_item)
                print(f"  ✓ {product['variety']} - Поставка: {delivery.delivery_date.strftime('%d августа')} ({product['qty']} шт)")
        
        # Добавляем историю движений для демонстрации
        print("\n📊 Добавляем историю движений для некоторых товаров...")
        
        if len(created_items) >= 2:
            # Для первого товара - продажи
            item1 = created_items[0]
            current_qty = item1.qty
            
            sales = [
                {"qty": 50, "date": datetime(2024, 8, 2), "desc": "Большой заказ на свадьбу"},
                {"qty": 30, "date": datetime(2024, 8, 4), "desc": "Корпоративный букет"},
                {"qty": 20, "date": datetime(2024, 8, 7), "desc": "Розничная продажа"},
            ]
            
            for sale in sales:
                current_qty -= sale["qty"]
                movement = WarehouseMovement(
                    warehouse_item_id=item1.id,
                    type=MovementType.OUT,
                    quantity=-sale["qty"],
                    description=sale["desc"],
                    reference_type="order",
                    reference_id=f"ORD-{sale['date'].day:02d}",
                    created_by="manager",
                    created_at=sale["date"],
                    qty_before=current_qty + sale["qty"],
                    qty_after=current_qty
                )
                db.add(movement)
            
            item1.qty = current_qty
            print(f"  ✓ Добавлена история продаж для {item1.variety}")
            
            # Для второго товара - списание
            item2 = created_items[1]
            writeoff_qty = 20
            item2.qty -= writeoff_qty
            
            writeoff = WarehouseMovement(
                warehouse_item_id=item2.id,
                type=MovementType.ADJUSTMENT,
                quantity=-writeoff_qty,
                description="Списание: цветы завяли",
                reference_type="writeoff",
                reference_id="WO-002",
                created_by="warehouse_manager",
                created_at=datetime(2024, 8, 6),
                qty_before=item2.qty + writeoff_qty,
                qty_after=item2.qty
            )
            db.add(writeoff)
            print(f"  ✓ Добавлено списание для {item2.variety}")
        
        # Сохраняем все изменения
        db.commit()
        
        print("\n✅ Новые тестовые данные успешно добавлены!")
        print(f"Всего добавлено товаров: {len(created_items)}")
        print("\n📅 Даты поставок:")
        for delivery_data in deliveries_data:
            print(f"  • {delivery_data['delivery_date'].strftime('%d августа')} - {delivery_data['supplier']}")
        
        print("\n🔗 Примеры для проверки:")
        for i, item in enumerate(created_items[:4], 1):
            print(f"  {i}. {item.variety}")
            print(f"     Поставка: {item.delivery_date.strftime('%d августа %Y')}")
            print(f"     Количество: {item.qty} шт")
            print(f"     URL: http://localhost:5178/pos-warehouse/{item.id}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    clear_and_add_data()