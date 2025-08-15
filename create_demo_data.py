#!/usr/bin/env python3
import sqlite3
from datetime import datetime, timedelta
import random

# Подключение к базе данных
conn = sqlite3.connect('backend/flower_shop.db')
cursor = conn.cursor()

print("Создание тестовых данных...")

# Создание тестовых клиентов
customers_data = [
    ("Анна Иванова", "+77011111111"),
    ("Дмитрий Петров", "+77012222222"),
    ("Елена Смирнова", "+77013333333"),
    ("Игорь Козлов", "+77014444444"),
    ("Мария Новикова", "+77015555555")
]

for name, phone in customers_data:
    cursor.execute("""
        INSERT OR IGNORE INTO customers (name, phone, shop_id, created_at)
        VALUES (?, ?, 1, datetime('now', '-' || ? || ' days'))
    """, (name, phone, random.randint(1, 30)))

print("Клиенты созданы.")

# Создание товаров
products_data = [
    ("Букет красных роз", "Классический букет из 25 красных роз", "roses", 8000, 15000),
    ("Букет тюльпанов", "Весенний букет из разноцветных тюльпанов", "tulips", 4000, 8000),
    ("Смешанный букет", "Сезонные цветы в красивом оформлении", "mixed", 6000, 12000),
    ("Букет альстромерий", "Нежный букет из белых альстромерий", "alstroemeria", 5000, 10000),
    ("Композиция в корзине", "Цветочная композиция в плетеной корзине", "compositions", 9000, 18000)
]

product_ids = []
for name, desc, category, cost_price, retail_price in products_data:
    cursor.execute("""
        INSERT OR IGNORE INTO products (name, description, category, cost_price, retail_price, shop_id, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, 1, 1, datetime('now', '-' || ? || ' days'))
    """, (name, desc, category, cost_price, retail_price, random.randint(1, 10)))
    
    cursor.execute("SELECT id FROM products WHERE name = ? AND shop_id = 1", (name,))
    result = cursor.fetchone()
    if result:
        product_ids.append(result[0])

print("Товары созданы.")

# Получение ID клиентов
cursor.execute("SELECT id FROM customers WHERE shop_id = 1")
customer_ids = [row[0] for row in cursor.fetchall()]

# Создание заказов
order_statuses = ["new", "paid", "in_production", "ready", "delivery", "pickup", "completed"]
addresses = [
    "Алматы, ул. Абая 123, кв. 45",
    "Алматы, ул. Достык 456, офис 78", 
    "Алматы, пр. Райымбека 789, дом 12",
    "Алматы, ул. Фурманова 321, кв. 90",
    "Алматы, ул. Панфилова 654, кв. 33"
]

for i in range(8):
    customer_id = random.choice(customer_ids)
    status = random.choice(order_statuses)
    flower_sum = random.randint(8000, 20000)
    delivery_fee = 2000
    total = flower_sum + delivery_fee
    created_days_ago = random.randint(1, 15)
    
    cursor.execute("""
        INSERT INTO orders (
            customer_id, shop_id, status, flower_sum, delivery_fee, total,
            address, customer_phone, delivery_method, tracking_token, created_at
        ) VALUES (?, 1, ?, ?, ?, ?, ?, '+77011111111', 'delivery', 
                  substr(hex(randomblob(4)), 1, 8), 
                  datetime('now', '-' || ? || ' days'))
    """, (customer_id, status, flower_sum, delivery_fee, total, random.choice(addresses), created_days_ago))
    
    order_id = cursor.lastrowid
    
    # Добавление товаров к заказу
    num_items = random.randint(1, 3)
    used_products = []
    
    for _ in range(num_items):
        available_products = [p for p in product_ids if p not in used_products]
        if not available_products:
            break
            
        product_id = random.choice(available_products)
        used_products.append(product_id)
        quantity = random.randint(1, 2)
        
        cursor.execute("SELECT name, category, retail_price FROM products WHERE id = ?", (product_id,))
        product_name, product_category, unit_price = cursor.fetchone()
        
        cursor.execute("""
            INSERT INTO order_items (
                order_id, product_id, product_name, product_category, quantity, price, total
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (order_id, product_id, product_name, product_category, quantity, unit_price, unit_price * quantity))

print("Заказы созданы.")

# Пока пропускаем складские позиции - таблица может не существовать

# Подтверждение изменений
conn.commit()
conn.close()

print("✅ Тестовые данные успешно созданы!")
print("📊 Создано:")
print(f"   • {len(customers_data)} клиентов")
print(f"   • {len(products_data)} товаров")
print("   • 8 заказов с товарами")