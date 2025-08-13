#!/usr/bin/env python3
"""
Скрипт для добавления тестовых товаров и их истории движений в базу данных
"""

import os
import sys
from datetime import datetime, timedelta
from sqlalchemy import create_engine
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

def add_test_data():
    db = SessionLocal()
    try:
        print("Добавляем тестовые товары на склад...")
        
        # Создаем несколько поставок для разных дат
        deliveries_data = [
            {
                "supplier": "Голландские цветы",
                "farm": "Royal FloraHolland",
                "delivery_date": datetime.now() - timedelta(days=7),
                "currency": "EUR",
                "rate": 520.0,
                "comment": "Еженедельная поставка роз"
            },
            {
                "supplier": "Эквадор Директ",
                "farm": "Rosas del Ecuador",
                "delivery_date": datetime.now() - timedelta(days=3),
                "currency": "USD",
                "rate": 470.0,
                "comment": "Премиум розы из Эквадора"
            },
            {
                "supplier": "Местный поставщик",
                "farm": "Алматинские теплицы",
                "delivery_date": datetime.now(),
                "currency": "KZT",
                "rate": 1.0,
                "comment": "Свежие тюльпаны местного производства"
            }
        ]
        
        # Товары для каждой поставки
        products_per_delivery = [
            # Первая поставка (7 дней назад)
            [
                {"variety": "Роза Red Naomi", "height_cm": 60, "qty": 200, "cost_per_stem": 1.5},
                {"variety": "Роза White Naomi", "height_cm": 50, "qty": 150, "cost_per_stem": 1.3},
                {"variety": "Роза Pink Floyd", "height_cm": 70, "qty": 100, "cost_per_stem": 2.0},
            ],
            # Вторая поставка (3 дня назад)
            [
                {"variety": "Роза Freedom", "height_cm": 80, "qty": 300, "cost_per_stem": 2.5},
                {"variety": "Роза Explorer", "height_cm": 90, "qty": 250, "cost_per_stem": 3.0},
                {"variety": "Гвоздика красная", "height_cm": 40, "qty": 500, "cost_per_stem": 0.5},
            ],
            # Третья поставка (сегодня)
            [
                {"variety": "Тюльпан Strong Gold", "height_cm": 35, "qty": 400, "cost_per_stem": 150},
                {"variety": "Тюльпан Purple Prince", "height_cm": 35, "qty": 350, "cost_per_stem": 180},
                {"variety": "Хризантема белая", "height_cm": 60, "qty": 200, "cost_per_stem": 250},
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
                markup = 2.0 if "Роза" in product["variety"] else 1.5
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
                    description=f"Поставка от {delivery.supplier}",
                    reference_type="delivery",
                    reference_id=str(delivery.id),
                    created_by="test_script",
                    qty_before=0,
                    qty_after=product["qty"]
                )
                db.add(movement)
                
                created_items.append(warehouse_item)
                print(f"  ✓ Добавлен: {product['variety']} ({product['qty']} шт) - ID: {warehouse_item.id}")
        
        # Добавляем историю движений для некоторых товаров
        print("\nДобавляем историю движений...")
        
        # Для первых трех товаров создаем разные движения
        if len(created_items) >= 3:
            # Товар 1: продажи
            item1 = created_items[0]
            sales = [
                {"qty": 20, "days_ago": 6, "desc": "Продажа букета 'Классика'"},
                {"qty": 15, "days_ago": 5, "desc": "Продажа композиции на свадьбу"},
                {"qty": 10, "days_ago": 3, "desc": "Розничная продажа"},
                {"qty": 25, "days_ago": 1, "desc": "Корпоративный заказ"},
            ]
            
            current_qty = item1.qty
            for sale in sales:
                current_qty -= sale["qty"]
                movement = WarehouseMovement(
                    warehouse_item_id=item1.id,
                    type=MovementType.OUT,
                    quantity=-sale["qty"],
                    description=sale["desc"],
                    reference_type="order",
                    reference_id=f"ORD-{1000 + sale['days_ago']}",
                    created_by="manager",
                    created_at=datetime.now() - timedelta(days=sale["days_ago"]),
                    qty_before=current_qty + sale["qty"],
                    qty_after=current_qty
                )
                db.add(movement)
            
            # Обновляем текущее количество
            item1.qty = current_qty
            print(f"  ✓ Добавлена история продаж для {item1.variety}")
            
            # Товар 2: списание и корректировки
            item2 = created_items[1]
            item2.qty -= 30  # Списание
            
            writeoff = WarehouseMovement(
                warehouse_item_id=item2.id,
                type=MovementType.ADJUSTMENT,
                quantity=-30,
                description="Списание: повреждение при транспортировке",
                reference_type="writeoff",
                reference_id="WO-001",
                created_by="warehouse_manager",
                created_at=datetime.now() - timedelta(days=2),
                qty_before=item2.qty + 30,
                qty_after=item2.qty
            )
            db.add(writeoff)
            print(f"  ✓ Добавлено списание для {item2.variety}")
            
            # Товар 3: резервирование под заказ
            item3 = created_items[2]
            item3.reserved_qty = 50
            
            reservation = WarehouseMovement(
                warehouse_item_id=item3.id,
                type=MovementType.OUT,
                quantity=0,  # Резервирование не меняет qty, только reserved_qty
                description="Резервирование под заказ на завтра",
                reference_type="reservation",
                reference_id="RES-2024-001",
                created_by="manager",
                created_at=datetime.now() - timedelta(hours=2),
                qty_before=item3.qty,
                qty_after=item3.qty
            )
            db.add(reservation)
            print(f"  ✓ Добавлено резервирование для {item3.variety}")
        
        # Сохраняем все изменения
        db.commit()
        
        print("\n✅ Тестовые данные успешно добавлены!")
        print(f"Всего добавлено товаров: {len(created_items)}")
        print("\nПримеры ID товаров для проверки детальной страницы:")
        for item in created_items[:5]:
            print(f"  • ID {item.id}: {item.variety} ({item.qty} шт) - http://localhost:5173/pos-warehouse/{item.id}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    add_test_data()