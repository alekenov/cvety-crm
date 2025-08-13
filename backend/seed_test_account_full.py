#!/usr/bin/env python3
"""
Комплексное заполнение тестового аккаунта (+77011234567) данными
Создает реалистичные взаимосвязанные данные для всех модулей CRM
"""
import os
import sys
import random
from datetime import datetime, timedelta
from decimal import Decimal

# Добавляем путь к backend
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.db.session import get_db_session
from app.models.shop import Shop
from app.models.user import User, UserRole
from app.models.customer import Customer, CustomerAddress, CustomerImportantDate
from app.models.product import Product, ProductCategory, ProductImage
from app.models.warehouse import WarehouseItem, MovementType, WarehouseMovement
from app.models.supply import Supply, SupplyItem, FlowerCategory
from app.models.order import Order, OrderItem, OrderStatus, DeliveryMethod, PaymentMethod, IssueType
from app.models.order_history import OrderHistory, OrderEventType

def seed_flower_categories(db: Session):
    """Создание категорий цветов"""
    categories = [
        {"name": "Розы", "markup_percentage": 150.0, "keywords": "роза,rose,Rosa"},
        {"name": "Тюльпаны", "markup_percentage": 120.0, "keywords": "тюльпан,tulip,Tulipa"},
        {"name": "Хризантемы", "markup_percentage": 100.0, "keywords": "хризантема,chrysanthemum"},
        {"name": "Гвоздики", "markup_percentage": 80.0, "keywords": "гвоздика,carnation"},
        {"name": "Лилии", "markup_percentage": 130.0, "keywords": "лилия,lily,Lilium"},
        {"name": "Герберы", "markup_percentage": 110.0, "keywords": "гербера,gerbera"},
        {"name": "Альстромерии", "markup_percentage": 90.0, "keywords": "альстромерия,alstroemeria"},
        {"name": "Орхидеи", "markup_percentage": 200.0, "keywords": "орхидея,orchid"},
    ]
    
    created_categories = {}
    for cat_data in categories:
        existing = db.query(FlowerCategory).filter_by(name=cat_data["name"]).first()
        if not existing:
            category = FlowerCategory(**cat_data)
            db.add(category)
            db.flush()
            created_categories[cat_data["name"]] = category
        else:
            created_categories[cat_data["name"]] = existing
    
    db.commit()
    print(f"✅ Создано категорий цветов: {len(created_categories)}")
    return created_categories

def seed_supplies_and_warehouse(db: Session, shop_id: int, categories: dict):
    """Создание поставок и заполнение склада"""
    suppliers = [
        {"name": "ТОО Алмаз Флора", "farm": "Ферма Розалия"},
        {"name": "Цветочный рай ТОО", "farm": "Голландские теплицы"},
        {"name": "Флора Казахстан", "farm": "Алматинская ферма"},
        {"name": "Импорт цветов КЗ", "farm": "Кенийская ферма"},
    ]
    
    varieties = {
        "Розы": ["Ред Наоми", "Фридом", "Аваланч", "Гран При", "Эксплорер", "Ред Игл", "Пинк Флойд"],
        "Тюльпаны": ["Стронг Голд", "Ред Импрешн", "Пинк Импрешн", "Уайт Дрим", "Пурпл Принс"],
        "Хризантемы": ["Балтика", "Анастасия", "Реверс", "Зембла", "Деко"],
        "Гвоздики": ["Барбадос", "Новаторс", "Дуэт", "Соня", "Малибу"],
        "Лилии": ["Лонгифлорум", "Ориенталь", "ЛА-гибрид", "Касабланка"],
        "Герберы": ["Джемесон", "Мини-гербера", "Паста"],
        "Альстромерии": ["Инка", "Сантьяго", "Тосса", "Лоран"],
        "Орхидеи": ["Фаленопсис", "Дендробиум", "Цимбидиум"],
    }
    
    heights = [40, 50, 60, 70, 80]
    currencies = [("USD", 470.0), ("EUR", 510.0), ("KZT", 1.0)]
    
    # Создание поставок за последние 3 месяца
    supplies_created = []
    for i in range(15):  # 15 поставок
        supplier = random.choice(suppliers)
        currency, rate = random.choice(currencies)
        delivery_date = datetime.now() - timedelta(days=random.randint(1, 90))
        
        supply = Supply(
            supplier=supplier["name"],
            farm=supplier["farm"],
            delivery_date=delivery_date,
            currency=currency,
            rate=rate,
            total_cost=0,  # Будет пересчитано
            status="active",
            notes=f"Поставка от {supplier['name']}",
            created_by="admin"
        )
        db.add(supply)
        db.flush()
        
        # Добавление позиций в поставку
        total_cost = 0
        items_count = random.randint(8, 15)
        
        for _ in range(items_count):
            category_name = random.choice(list(varieties.keys()))
            category = categories[category_name]
            variety = random.choice(varieties[category_name])
            height = random.choice(heights)
            quantity = random.randint(50, 200)
            
            if currency == "KZT":
                purchase_price = random.randint(200, 800)
            else:
                purchase_price = round(random.uniform(0.5, 2.5), 2)
            
            retail_price = purchase_price * rate * (category.markup_percentage / 100)
            item_total = purchase_price * quantity
            
            supply_item = SupplyItem(
                supply_id=supply.id,
                category_id=category.id,
                flower_name=variety,
                height_cm=height,
                purchase_price=purchase_price,
                quantity=quantity,
                remaining_quantity=quantity,
                retail_price=retail_price,
                total_cost=item_total,
                batch_code=f"BTH{supply.id:03d}"
            )
            db.add(supply_item)
            db.flush()
            
            # Создание складской позиции
            warehouse_item = WarehouseItem(
                sku=f"SKU{supply.id:03d}{supply_item.id:03d}",
                batch_code=supply_item.batch_code,
                variety=variety,
                height_cm=height,
                farm=supply.farm,
                supplier=supply.supplier,
                delivery_date=supply.delivery_date,
                currency=currency,
                rate=rate,
                cost=purchase_price,
                recommended_price=retail_price,
                price=retail_price,
                markup_pct=category.markup_percentage,
                qty=quantity,
                reserved_qty=0,
                on_showcase=random.choice([True, False]),
                to_write_off=random.choice([True, False]) if quantity < 20 else False,
                hidden=False,
                updated_by="admin",
                supply_item_id=supply_item.id
            )
            db.add(warehouse_item)
            db.flush()
            
            # История движения на складе
            movement = WarehouseMovement(
                warehouse_item_id=warehouse_item.id,
                type=MovementType.IN,
                quantity=quantity,
                description=f"Поступление от поставщика {supply.supplier}",
                reference_type="supply",
                reference_id=str(supply.id),
                created_by="admin",
                qty_before=0,
                qty_after=quantity
            )
            db.add(movement)
            
            total_cost += item_total
        
        supply.total_cost = total_cost
        supplies_created.append(supply)
    
    db.commit()
    print(f"✅ Создано поставок: {len(supplies_created)}")
    
    # Подсчет складских позиций
    warehouse_count = db.query(WarehouseItem).count()
    print(f"✅ Создано складских позиций: {warehouse_count}")
    
    return supplies_created

def seed_customers(db: Session, shop_id: int):
    """Создание клиентов с адресами и важными датами"""
    customers_data = [
        {"name": "Аида Жанибекова", "phone": "+77011111111", "email": "aida@example.com", "source": "instagram"},
        {"name": "Бекзат Нурланов", "phone": "+77011111112", "email": "bekzat@example.com", "source": "website"},
        {"name": "Гульмира Сериковна", "phone": "+77011111113", "source": "walkin"},
        {"name": "Дамир Алматинец", "phone": "+77011111114", "email": "damir@example.com", "source": "phone"},
        {"name": "Елена Петровна", "phone": "+77011111115", "email": "elena@example.com", "source": "instagram"},
        {"name": "Жанар Касымова", "phone": "+77011111116", "source": "walkin"},
        {"name": "Игорь Владимирович", "phone": "+77011111117", "email": "igor@example.com", "source": "website"},
        {"name": "Камила Ахметова", "phone": "+77011111118", "email": "kamila@example.com", "source": "instagram"},
        {"name": "Лаура Берикова", "phone": "+77011111119", "source": "phone"},
        {"name": "Марат Сулейменов", "phone": "+77011111120", "email": "marat@example.com", "source": "website"},
        {"name": "Назгуль Мухтарова", "phone": "+77011111121", "email": "nazgul@example.com", "source": "instagram"},
        {"name": "Олеся Коробова", "phone": "+77011111122", "email": "olesya@example.com", "source": "walkin"},
        {"name": "Павел Сергеевич", "phone": "+77011111123", "source": "phone"},
        {"name": "Рауза Жакановна", "phone": "+77011111124", "email": "rauza@example.com", "source": "instagram"},
        {"name": "Серик Болатович", "phone": "+77011111125", "email": "serik@example.com", "source": "website"},
        {"name": "Тамара Ивановна", "phone": "+77011111126", "source": "walkin"},
        {"name": "Улбике Садвакасова", "phone": "+77011111127", "email": "ulbike@example.com", "source": "instagram"},
        {"name": "Виктор Степанов", "phone": "+77011111128", "email": "viktor@example.com", "source": "phone"},
        {"name": "Ыдырыс Нурбеков", "phone": "+77011111129", "source": "website"},
        {"name": "Эльмира Жандосовна", "phone": "+77011111130", "email": "elmira@example.com", "source": "instagram"},
        {"name": "Юлия Максимовна", "phone": "+77011111131", "email": "yulia@example.com", "source": "walkin"},
        {"name": "Ярослав Петрович", "phone": "+77011111132", "source": "phone"},
        {"name": "Айнур Багдатовна", "phone": "+77011111133", "email": "ainur@example.com", "source": "instagram"},
        {"name": "Болат Мухтарович", "phone": "+77011111134", "email": "bolat@example.com", "source": "website"},
        {"name": "Венера Сагинтаевна", "phone": "+77011111135", "source": "walkin"},
        {"name": "Галина Александровна", "phone": "+77011111136", "email": "galina@example.com", "source": "phone"},
        {"name": "Дина Рустемовна", "phone": "+77011111137", "email": "dina@example.com", "source": "instagram"},
        {"name": "Еркебулан Амиржанович", "phone": "+77011111138", "source": "website"},
        {"name": "Жанна Владиславовна", "phone": "+77011111139", "email": "zhanna@example.com", "source": "walkin"},
        {"name": "Зауре Каиргельдиновна", "phone": "+77011111140", "email": "zaure@example.com", "source": "instagram"},
    ]
    
    addresses = [
        "ул. Абая, 150", "ул. Алтынсарина, 32", "ул. Розыбакиева, 247",
        "мкр. Мамыр-1, 29/1", "ул. Жандосова, 98", "ул. Муратбаева, 123",
        "ул. Сатпаева, 90", "ул. Толе би, 67", "ул. Назарбаева, 223",
        "мкр. Алмагуль, 5", "ул. Карасай батыра, 12", "ул. Шевченко, 89"
    ]
    
    important_events = [
        "День рождения", "Годовщина свадьбы", "8 марта", "День матери",
        "Новый год", "День Святого Валентина", "День рождения мамы",
        "День рождения жены", "Выпускной", "Профессиональный праздник"
    ]
    
    customers_created = []
    for i, customer_data in enumerate(customers_data):
        # Создание статистики для реалистичности
        orders_count = random.randint(0, 25)
        total_spent = orders_count * random.randint(5000, 30000) if orders_count > 0 else 0
        last_order_date = datetime.now() - timedelta(days=random.randint(1, 365)) if orders_count > 0 else None
        
        customer = Customer(
            shop_id=shop_id,
            phone=customer_data["phone"],
            name=customer_data["name"],
            email=customer_data.get("email"),
            source=customer_data["source"],
            orders_count=orders_count,
            total_spent=total_spent,
            last_order_date=last_order_date,
            notes=f"Клиент из источника: {customer_data['source']}" if random.choice([True, False]) else None,
            preferences="Предпочитает розы" if random.choice([True, False]) else None
        )
        db.add(customer)
        db.flush()
        
        # Добавление адресов (1-3 адреса на клиента)
        addresses_count = random.randint(1, 3)
        customer_addresses = random.sample(addresses, min(addresses_count, len(addresses)))
        
        for j, address in enumerate(customer_addresses):
            customer_address = CustomerAddress(
                customer_id=customer.id,
                address=address,
                label="Дом" if j == 0 else random.choice(["Офис", "Дача", "Родители"]),
                is_primary=1 if j == 0 else 0,
                usage_count=random.randint(0, 10),
                last_used_at=last_order_date if j == 0 and last_order_date else None
            )
            db.add(customer_address)
        
        # Добавление важных дат (1-3 даты на клиента)
        dates_count = random.randint(1, 3)
        for _ in range(dates_count):
            month = random.randint(1, 12)
            day = random.randint(1, 28)
            date_str = f"{month:02d}-{day:02d}"
            description = random.choice(important_events)
            
            important_date = CustomerImportantDate(
                customer_id=customer.id,
                date=date_str,
                description=description,
                remind_days_before=random.choice([3, 5, 7]),
                last_reminded_year=2023 if random.choice([True, False]) else None
            )
            db.add(important_date)
        
        customers_created.append(customer)
    
    db.commit()
    print(f"✅ Создано клиентов: {len(customers_created)}")
    return customers_created

def seed_products(db: Session, shop_id: int):
    """Создание каталога товаров"""
    products_data = [
        # Букеты
        {"name": "Букет из 25 красных роз", "category": ProductCategory.bouquet, "cost": 15000, "retail": 25000},
        {"name": "Букет из 51 розы микс", "category": ProductCategory.bouquet, "cost": 28000, "retail": 45000},
        {"name": "Букет из 101 розы", "category": ProductCategory.bouquet, "cost": 55000, "retail": 85000},
        {"name": "Букет тюльпанов (21 шт)", "category": ProductCategory.bouquet, "cost": 8000, "retail": 15000},
        {"name": "Букет хризантем", "category": ProductCategory.bouquet, "cost": 6000, "retail": 12000},
        {"name": "Букет альстромерий", "category": ProductCategory.bouquet, "cost": 5000, "retail": 10000},
        {"name": "Букет лилий", "category": ProductCategory.bouquet, "cost": 12000, "retail": 20000},
        {"name": "Букет гербер", "category": ProductCategory.bouquet, "cost": 7000, "retail": 13000},
        {"name": "Свадебный букет", "category": ProductCategory.bouquet, "cost": 20000, "retail": 35000},
        {"name": "Букет невесты классик", "category": ProductCategory.bouquet, "cost": 25000, "retail": 40000},
        {"name": "Букет пионов", "category": ProductCategory.bouquet, "cost": 18000, "retail": 30000},
        {"name": "Букет ромашек", "category": ProductCategory.bouquet, "cost": 4000, "retail": 8000},
        {"name": "Букет подсолнухов", "category": ProductCategory.bouquet, "cost": 6000, "retail": 11000},
        {"name": "Букет эустомы", "category": ProductCategory.bouquet, "cost": 10000, "retail": 18000},
        {"name": "Букет фрезий", "category": ProductCategory.bouquet, "cost": 9000, "retail": 16000},
        
        # Композиции
        {"name": "Композиция в коробке", "category": ProductCategory.composition, "cost": 12000, "retail": 22000},
        {"name": "Композиция в корзине", "category": ProductCategory.composition, "cost": 15000, "retail": 28000},
        {"name": "Композиция в шляпной коробке", "category": ProductCategory.composition, "cost": 18000, "retail": 32000},
        {"name": "Композиция микс цветов", "category": ProductCategory.composition, "cost": 14000, "retail": 25000},
        {"name": "Композиция с макарунами", "category": ProductCategory.composition, "cost": 16000, "retail": 30000},
        {"name": "Композиция с конфетами", "category": ProductCategory.composition, "cost": 17000, "retail": 32000},
        {"name": "Композиция праздничная", "category": ProductCategory.composition, "cost": 20000, "retail": 38000},
        {"name": "Композиция в деревянном ящике", "category": ProductCategory.composition, "cost": 13000, "retail": 24000},
        {"name": "Композиция романтик", "category": ProductCategory.composition, "cost": 19000, "retail": 35000},
        {"name": "Композиция VIP", "category": ProductCategory.composition, "cost": 25000, "retail": 45000},
        
        # Горшечные растения
        {"name": "Орхидея фаленопсис", "category": ProductCategory.potted, "cost": 8000, "retail": 15000},
        {"name": "Антуриум красный", "category": ProductCategory.potted, "cost": 6000, "retail": 12000},
        {"name": "Спатифиллум", "category": ProductCategory.potted, "cost": 5000, "retail": 10000},
        {"name": "Фикус Бенджамина", "category": ProductCategory.potted, "cost": 4000, "retail": 8000},
        {"name": "Драцена", "category": ProductCategory.potted, "cost": 7000, "retail": 13000},
        {"name": "Монстера", "category": ProductCategory.potted, "cost": 9000, "retail": 16000},
        {"name": "Фиалки", "category": ProductCategory.potted, "cost": 3000, "retail": 6000},
        {"name": "Бегония", "category": ProductCategory.potted, "cost": 4000, "retail": 7500},
        {"name": "Кактус микс", "category": ProductCategory.potted, "cost": 2000, "retail": 4000},
        {"name": "Азалия", "category": ProductCategory.potted, "cost": 8000, "retail": 14000},
        
        # Другое
        {"name": "Открытка поздравительная", "category": ProductCategory.other, "cost": 500, "retail": 1500},
        {"name": "Лента атласная", "category": ProductCategory.other, "cost": 200, "retail": 500},
        {"name": "Упаковка подарочная", "category": ProductCategory.other, "cost": 300, "retail": 800},
        {"name": "Свеча ароматическая", "category": ProductCategory.other, "cost": 2000, "retail": 4000},
        {"name": "Мягкая игрушка", "category": ProductCategory.other, "cost": 3000, "retail": 6000},
        {"name": "Воздушный шар", "category": ProductCategory.other, "cost": 1000, "retail": 2000},
        {"name": "Конфеты в коробке", "category": ProductCategory.other, "cost": 4000, "retail": 7000},
        {"name": "Шоколад премиум", "category": ProductCategory.other, "cost": 5000, "retail": 9000},
        {"name": "Вазочка керамическая", "category": ProductCategory.other, "cost": 2500, "retail": 5000},
        {"name": "Корзинка плетеная", "category": ProductCategory.other, "cost": 1500, "retail": 3500},
    ]
    
    descriptions = [
        "Свежие цветы высшего качества от лучших поставщиков",
        "Идеальный подарок для любого повода",
        "Создано с любовью нашими флористами",
        "Эксклюзивная композиция ручной работы",
        "Премиум качество, гарантия свежести",
        "Стильное решение для особых моментов",
        "Яркие краски для хорошего настроения",
        "Нежная композиция для дорогих людей"
    ]
    
    products_created = []
    for product_data in products_data:
        # Некоторые товары со скидкой
        sale_price = None
        if random.choice([True, False, False, False]):  # 25% товаров со скидкой
            discount = random.randint(10, 30)
            sale_price = product_data["retail"] * (100 - discount) / 100
        
        product = Product(
            shop_id=shop_id,
            name=product_data["name"],
            category=product_data["category"],
            description=random.choice(descriptions),
            cost_price=product_data["cost"],
            retail_price=product_data["retail"],
            sale_price=sale_price,
            is_active=True,
            is_popular=random.choice([True, False, False]),  # 33% популярных
            is_new=random.choice([True, False, False, False])  # 25% новых
        )
        db.add(product)
        products_created.append(product)
    
    db.commit()
    print(f"✅ Создано товаров: {len(products_created)}")
    return products_created

def main():
    print("🌸 Запуск комплексного заполнения тестового аккаунта...")
    
    SessionLocal = get_db_session()
    db = SessionLocal()
    
    try:
        # Поиск тестового магазина
        test_shop = db.query(Shop).filter_by(phone="+77011234567").first()
        if not test_shop:
            print("❌ Тестовый магазин не найден! Сначала выполните init_test_data_db.py")
            return 1
        
        print(f"🏪 Найден тестовый магазин: {test_shop.name} (ID: {test_shop.id})")
        
        # Последовательное создание данных
        print("\n📊 Создание категорий цветов...")
        categories = seed_flower_categories(db)
        
        print("\n📦 Создание поставок и заполнение склада...")
        supplies = seed_supplies_and_warehouse(db, test_shop.id, categories)
        
        print("\n👥 Создание клиентов...")
        customers = seed_customers(db, test_shop.id)
        
        print("\n🌹 Создание каталога товаров...")
        products = seed_products(db, test_shop.id)
        
        # Финальная статистика
        print("\n📈 Итоговая статистика:")
        stats = {
            "Магазинов": db.query(Shop).count(),
            "Пользователей": db.query(User).filter_by(shop_id=test_shop.id).count(),
            "Клиентов": db.query(Customer).filter_by(shop_id=test_shop.id).count(),
            "Адресов клиентов": db.query(CustomerAddress).join(Customer).filter(Customer.shop_id == test_shop.id).count(),
            "Важных дат": db.query(CustomerImportantDate).join(Customer).filter(Customer.shop_id == test_shop.id).count(),
            "Товаров": db.query(Product).filter_by(shop_id=test_shop.id).count(),
            "Категорий цветов": db.query(FlowerCategory).count(),
            "Поставок": db.query(Supply).count(),
            "Позиций поставок": db.query(SupplyItem).count(),
            "Складских позиций": db.query(WarehouseItem).count(),
            "Движений по складу": db.query(WarehouseMovement).count(),
        }
        
        for key, value in stats.items():
            print(f"  {key}: {value}")
        
        print(f"\n✅ Заполнение завершено успешно в {datetime.now().strftime('%H:%M:%S')}")
        print(f"\nТестовый аккаунт готов к использованию:")
        print(f"  📱 Телефон: +77011234567")
        print(f"  🔐 OTP: 111111 (фиксированный для тестов)")
        
        return 0
        
    except Exception as e:
        print(f"\n❌ Ошибка при заполнении данных: {str(e)}")
        db.rollback()
        raise
        return 1
    finally:
        db.close()

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)