#!/usr/bin/env python3
import sqlite3
from datetime import datetime, timedelta
import random

# Подключение к базе данных
conn = sqlite3.connect('backend/flower_shop.db')
cursor = conn.cursor()

print("Создание реалистичных тестовых данных для Cvety.kz...")

# Реалистичные казахские клиенты
customers_data = [
    ("Айдос Жумабеков", "+77011234567"),
    ("Гульнара Сатпаева", "+77021345678"), 
    ("Бауржан Касымов", "+77051456789"),
    ("Айгерим Нурланова", "+77071567890"),
    ("Данияр Серикбаев", "+77081678901"),
    ("Жанар Абдрахманова", "+77091789012"),
    ("Ерлан Мухтаров", "+77011890123"),
    ("Салтанат Исаева", "+77021901234"),
    ("Арман Байжанов", "+77051012345"),
    ("Динара Жаксылыкова", "+77071123456"),
    ("Нурлан Омаров", "+77081234567"),
    ("Асель Турсунова", "+77091345678"),
    ("Болат Рахимжанов", "+77471456789"),
    ("Камила Есенова", "+77781567890"),
    ("Ермек Сагинов", "+77471678901"),
    ("Алия Назарбаева", "+77781789012"),
    ("Самат Кудайбергенов", "+77021890123"),
    ("Мадина Жолдасбаева", "+77051901234"),
]

# Создание клиентов
for i, (name, phone) in enumerate(customers_data):
    days_ago = random.randint(5, 60)
    cursor.execute("""
        INSERT INTO customers (name, phone, shop_id, orders_count, total_spent, created_at)
        VALUES (?, ?, 1, 0, 0.0, datetime('now', '-' || ? || ' days'))
    """, (name, phone, days_ago))

print(f"✅ Создано {len(customers_data)} клиентов")

# Создание реалистичных товаров
products_data = [
    ("51 роза Premium Эквадор", "Роскошный букет из 51 красной розы высшего качества", 25000, 35000),
    ("Букет белых пионов", "Нежный букет из белоснежных пионов (9 шт)", 12000, 18000),
    ("101 красная роза", "Впечатляющий букет для особых случаев", 45000, 65000),
    ("Композиция в коробке", "Элегантная композиция в стильной коробке", 10000, 15000),
    ("Букет из гортензий", "Воздушный букет из цветной гортензии", 15000, 22000),
    ("Корзина с фруктами и цветами", "Подарочная корзина с фруктами и букетом", 18000, 25000),
    ("Розы в шляпной коробке", "25 роз в элегантной упаковке", 20000, 28000),
    ("Букет невесты", "Белоснежный букет для свадьбы", 18000, 25000),
    ("Тюльпаны разноцветные", "Весенний букет из 25 тюльпанов", 8000, 12000),
    ("VIP букет-гигант", "Роскошная композиция из премиальных цветов", 55000, 80000),
    ("Букет хризантем", "Осенний букет из разноцветных хризантем", 9000, 13000),
    ("Сборный букет микс", "Авторский букет из сезонных цветов", 12000, 17000)
]

product_ids = []
for name, desc, cost_price, retail_price in products_data:
    cursor.execute("""
        INSERT INTO products (name, description, category, cost_price, retail_price, shop_id, is_active, created_at)
        VALUES (?, ?, 'bouquet', ?, ?, 1, 1, datetime('now', '-' || ? || ' days'))
    """, (name, desc, cost_price, retail_price, random.randint(1, 30)))
    
    cursor.execute("SELECT id FROM products WHERE name = ? AND shop_id = 1", (name,))
    result = cursor.fetchone()
    if result:
        product_ids.append(result[0])

print(f"✅ Создано {len(products_data)} товаров")

# Получение ID клиентов
cursor.execute("SELECT id, name, phone FROM customers WHERE shop_id = 1")
customers = cursor.fetchall()

# Адреса доставки в Алматы
delivery_addresses = [
    "мкр. Самал-2, д. 77, кв. 45",
    "пр. Достык 89, офис 312", 
    "ул. Аль-Фараби 17, БЦ Нурлы Тау",
    "мкр. Коктем-3, д. 21, кв. 87",
    "ул. Сейфуллина 458, кв. 12",
    "пр. Абая 150/230, кв. 78",
    "мкр. Мамыр-1, д. 29, кв. 156",
    "ул. Жандосова 140, дом 5А",
    "мкр. Айнабулак-3, д. 85, кв. 23",
    "пр. Райымбека 348, кв. 91",
    "ул. Толе би 273, офис 45",
    "мкр. Акбулак-4, д. 12, кв. 67",
    "пр. Назарбаева 223, БЦ Алматы Тауэрс",
    "ул. Богенбай батыра 155, кв. 34",
    "мкр. Зердели, д. 89, кв. 112"
]

# Комментарии к заказам
order_comments = [
    "Доставить после 18:00, позвонить заранее",
    "Не звонить в домофон, встречу у подъезда",
    "Сюрприз! Получатель не должен знать от кого",
    "Осторожно, у получателя аллергия на лилии",
    "Доставить строго к 14:00 на день рождения",
    "Можно заменить цвет упаковки на розовый",
    "Офисная доставка, спросить Айгуль",
    "Доставить к роддому, 3 этаж, палата 15",
    "Юбилей 50 лет, добавить открытку",
    "Свадебная годовщина, красивая упаковка",
    "Извинения за опоздание на свидание",
    None, None, None  # Некоторые заказы без комментариев
]

# Создание заказов за последние 2 недели
order_statuses = ["new", "paid", "assembled", "paid"]  # Больше оплаченных заказов
delivery_methods = ["delivery", "self_pickup"]

for i in range(28):  # 28 заказов
    customer = random.choice(customers)
    customer_id, customer_name, customer_phone = customer
    
    # Генерируем дату за последние 14 дней
    days_ago = random.randint(0, 14)
    hours_ago = random.randint(0, 23)
    
    status = random.choice(order_statuses)
    delivery_method = random.choice(delivery_methods)
    address = random.choice(delivery_addresses)
    comments = random.choice(order_comments)
    
    # Расчет сумм
    flower_sum = random.randint(8000, 60000)
    delivery_fee = 2000 if delivery_method == "delivery" else 0
    total = flower_sum + delivery_fee
    
    # Генерируем токен для отслеживания
    tracking_token = f"KZ{random.randint(100000, 999999)}"
    
    cursor.execute("""
        INSERT INTO orders (
            customer_id, shop_id, status, flower_sum, delivery_fee, total,
            address, customer_phone, delivery_method, tracking_token,
            recipient_name, issue_comment, created_at
        ) VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
                  datetime('now', '-' || ? || ' days', '-' || ? || ' hours'))
    """, (customer_id, status, flower_sum, delivery_fee, total, address, 
          customer_phone, delivery_method, tracking_token, customer_name,
          comments, days_ago, hours_ago))
    
    order_id = cursor.lastrowid
    
    # Добавляем товары к заказу (1-3 позиции)
    num_items = random.randint(1, 3)
    used_products = []
    remaining_sum = flower_sum
    
    for item_num in range(num_items):
        available_products = [p for p in product_ids if p not in used_products]
        if not available_products or remaining_sum <= 0:
            break
            
        product_id = random.choice(available_products)
        used_products.append(product_id)
        quantity = random.randint(1, 2)
        
        cursor.execute("SELECT name, retail_price FROM products WHERE id = ?", (product_id,))
        product_name, unit_price = cursor.fetchone()
        
        # Для последней позиции корректируем цену
        if item_num == num_items - 1:
            unit_price = remaining_sum // quantity if quantity > 0 else remaining_sum
        
        total_price = unit_price * quantity
        remaining_sum -= total_price
        
        cursor.execute("""
            INSERT INTO order_items (
                order_id, product_id, product_name, product_category, quantity, price, total
            ) VALUES (?, ?, ?, 'bouquet', ?, ?, ?)
        """, (order_id, product_id, product_name, quantity, unit_price, total_price))

# Обновляем статистику клиентов
cursor.execute("""
    UPDATE customers SET 
        orders_count = (SELECT COUNT(*) FROM orders WHERE customer_id = customers.id),
        total_spent = (SELECT COALESCE(SUM(total), 0) FROM orders WHERE customer_id = customers.id)
""")

print(f"✅ Создано 28 заказов с товарами")

# Подтверждение изменений
conn.commit()
conn.close()

print("\n🎉 Реалистичные тестовые данные успешно созданы!")
print("📊 Статистика:")
print(f"   • {len(customers_data)} клиентов с казахскими именами")
print(f"   • {len(products_data)} реалистичных товаров") 
print("   • 28 заказов за последние 2 недели")
print("   • Реальные адреса и телефоны Алматы")
print("   • Разнообразные статусы и комментарии")