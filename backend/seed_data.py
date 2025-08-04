#!/usr/bin/env python3
"""
Seed script to populate database with realistic test data for Kazakhstan flower shop
"""
import sys
import random
import uuid
from datetime import datetime, timedelta
from pathlib import Path

# Add backend directory to path
sys.path.append(str(Path(__file__).parent))

from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from app.db.session import Base
from app.core.config import get_settings
from app.models import (
    Shop, User, UserRole, Customer, CustomerAddress, CustomerImportantDate,
    FlowerCategory, Supply, SupplyItem, WarehouseItem, Product, ProductImage,
    ProductIngredient, Order, OrderItem, OrderStatus, DeliveryMethod, PaymentMethod,
    OrderHistory, OrderEventType, Comment, WarehouseMovement, MovementType
)
from app.models.product import ProductCategory
from seed_helpers import (
    generate_phone, generate_person, generate_address, generate_company_address,
    generate_delivery_window, generate_important_date, calculate_price_kzt,
    SUPPLIERS, FLOWERS, PRODUCTS, ORDER_REASONS, ORDER_NOTES
)

settings = get_settings()


def clear_database(session: Session):
    """Clear all data from database"""
    print("Clearing existing data...")
    
    # Delete in reverse order of dependencies
    session.query(Comment).delete()
    session.query(OrderHistory).delete()
    session.query(OrderItem).delete()
    session.query(Order).delete()
    session.query(ProductIngredient).delete()
    session.query(ProductImage).delete()
    session.query(Product).delete()
    session.query(WarehouseMovement).delete()
    session.query(WarehouseItem).delete()
    session.query(SupplyItem).delete()
    session.query(Supply).delete()
    session.query(FlowerCategory).delete()
    session.query(CustomerImportantDate).delete()
    session.query(CustomerAddress).delete()
    session.query(Customer).delete()
    session.query(User).delete()
    session.query(Shop).delete()
    
    session.commit()
    print("Database cleared!")


def create_shops(session: Session) -> dict:
    """Create shops"""
    print("Creating shops...")
    
    shops = []
    
    # Main shop
    shop1 = Shop(
        name="Цветочный рай Алматы",
        phone="+77011234567",
        email="info@cvety-almaty.kz",
        address="пр. Достык, 248",
        city="Алматы",
        description="Главный магазин сети",
        business_hours={
            "mon": ["09:00", "20:00"],
            "tue": ["09:00", "20:00"],
            "wed": ["09:00", "20:00"],
            "thu": ["09:00", "20:00"],
            "fri": ["09:00", "20:00"],
            "sat": ["10:00", "18:00"],
            "sun": ["10:00", "18:00"]
        },
        is_active=True,
        is_verified=True,
        plan="premium",
        telegram_id=None,
        telegram_username=None
    )
    shops.append(shop1)
    
    # Second shop
    shop2 = Shop(
        name="Букет для тебя",
        phone="+77019876544",
        email="info@buket-kz.kz",
        address="ул. Жандосова, 55",
        city="Алматы",
        description="Цветы с доставкой по Алматы",
        business_hours={
            "mon": ["08:00", "21:00"],
            "tue": ["08:00", "21:00"],
            "wed": ["08:00", "21:00"],
            "thu": ["08:00", "21:00"],
            "fri": ["08:00", "21:00"],
            "sat": ["09:00", "20:00"],
            "sun": ["09:00", "20:00"]
        },
        is_active=True,
        is_verified=True,
        plan="basic",
        telegram_id=None,
        telegram_username=None
    )
    shops.append(shop2)
    
    session.add_all(shops)
    session.commit()
    
    return {shop.id: shop for shop in shops}


def create_users(session: Session, shops: dict) -> dict:
    """Create users (employees)"""
    print("Creating users...")
    
    users = []
    shop_ids = list(shops.keys())
    
    # Admin
    admin = User(
        phone="+77051234567",
        name="Айгуль Касымова",
        email="admin@cvety.kz",
        role=UserRole.admin,
        shop_id=shop_ids[0],
        is_active=True
    )
    users.append(admin)
    
    # Managers
    managers_data = [
        ("Динара Нурланова", "+77052345678", "dinara@cvety.kz"),
        ("Бахыт Серикова", "+77053456789", "bakhyt@cvety.kz")
    ]
    
    for name, phone, email in managers_data:
        manager = User(
            phone=phone,
            name=name,
            email=email,
            role=UserRole.manager,
            shop_id=random.choice(shop_ids),
            is_active=True
        )
        users.append(manager)
    
    # Florists
    florists_data = [
        ("Гульнара Амирова", "+77054567890", "gulnara@cvety.kz"),
        ("Жанар Бектурова", "+77055678901", "zhanar@cvety.kz"),
        ("Айдана Кенесова", "+77056789012", "aidana@cvety.kz")
    ]
    
    for name, phone, email in florists_data:
        florist = User(
            phone=phone,
            name=name,
            email=email,
            role=UserRole.florist,
            shop_id=random.choice(shop_ids),
            is_active=True
        )
        users.append(florist)
    
    # Couriers
    couriers_data = [
        ("Данияр Жумабеков", "+77057890123", "daniyar@cvety.kz"),
        ("Ерлан Муратов", "+77058901234", "erlan@cvety.kz")
    ]
    
    for name, phone, email in couriers_data:
        courier = User(
            phone=phone,
            name=name,
            email=email,
            role=UserRole.courier,
            shop_id=random.choice(shop_ids),
            is_active=True
        )
        users.append(courier)
    
    session.add_all(users)
    session.commit()
    
    return {
        'all': users,
        'florists': [u for u in users if u.role == UserRole.florist],
        'couriers': [u for u in users if u.role == UserRole.courier],
        'managers': [u for u in users if u.role == UserRole.manager]
    }


def create_customers(session: Session, shops: dict) -> list:
    """Create customers"""
    print("Creating customers...")
    
    customers = []
    shop_ids = list(shops.keys())
    
    # Regular customers
    for i in range(30):
        person = generate_person()
        customer = Customer(
            shop_id=random.choice(shop_ids),
            name=person['full_name'],
            phone=generate_phone(),
            email=f"{person['first_name'].lower()}{i}@mail.kz" if random.random() > 0.3 else None,
            source=random.choice(['instagram', 'website', 'phone', 'walk-in', 'referral']),
            notes="VIP клиент" if random.random() > 0.8 else None
        )
        
        # Add addresses
        for j in range(random.randint(1, 3)):
            address = CustomerAddress(
                address=generate_address(),
                is_primary=(1 if j == 0 else 0)  # Using Integer for SQLite compatibility
            )
            customer.addresses.append(address)
        
        # Add important dates
        if random.random() > 0.5:
            for _ in range(random.randint(1, 3)):
                date_info = generate_important_date()
                important_date = CustomerImportantDate(
                    date=date_info['date'][5:],  # Extract MM-DD from YYYY-MM-DD
                    description=date_info['description'],
                    remind_days_before=date_info['reminder_days']
                )
                customer.important_dates.append(important_date)
        
        customers.append(customer)
    
    # Corporate customers
    for i in range(10):
        company_info = generate_company_address()
        customer = Customer(
            shop_id=random.choice(shop_ids),
            name=company_info['company'],
            phone=generate_phone(),
            email=f"flowers@company{i}.kz",
            source='b2b',
            notes="Корпоративный клиент" + (" - постоянный" if random.random() > 0.5 else "")
        )
        
        address = CustomerAddress(
            address=company_info['address'],
            is_primary=1  # Using Integer for SQLite compatibility
        )
        customer.addresses.append(address)
        
        customers.append(customer)
    
    session.add_all(customers)
    session.commit()
    
    return customers


def create_flower_categories(session: Session) -> dict:
    """Create flower categories"""
    print("Creating flower categories...")
    
    categories_data = [
        ("Премиум розы", 150, "роза,rose,naomi,freedom,explorer"),
        ("Стандартные розы", 100, "роза,rose,standard"),
        ("Тюльпаны", 120, "тюльпан,tulip"),
        ("Хризантемы", 90, "хризантема,chrysanthemum"),
        ("Экзотические цветы", 200, "орхидея,лилия,exotic"),
        ("Зелень", 80, "зелень,eucalyptus,ruscus,greenery")
    ]
    
    categories = {}
    for name, markup, keywords in categories_data:
        category = FlowerCategory(
            name=name,
            markup_percentage=markup,
            keywords=keywords
        )
        session.add(category)
        categories[name] = category
    
    session.commit()
    return categories


def create_supplies_and_warehouse(session: Session, categories: dict) -> tuple:
    """Create supplies and warehouse items"""
    print("Creating supplies and warehouse items...")
    
    supplies = []
    warehouse_items = []
    
    # Exchange rates
    rates = {
        'USD': 450,
        'EUR': 500,
        'KZT': 1
    }
    
    # Create supplies for last 30 days
    for days_ago in range(30, 0, -3):
        delivery_date = datetime.now() - timedelta(days=days_ago)
        
        # Random supplier
        country = random.choice(list(SUPPLIERS.keys()))
        supplier = random.choice(SUPPLIERS[country])
        currency = 'EUR' if country == 'Голландия' else 'USD' if country in ['Эквадор', 'Кения'] else 'KZT'
        
        supply = Supply(
            supplier=supplier,
            farm=f"{supplier} Farm",
            delivery_date=delivery_date,
            currency=currency,
            rate=rates[currency],
            status='active',
            created_by="admin@cvety.kz"
        )
        
        total_cost = 0
        
        # Add flowers to supply
        flower_types = random.sample(list(FLOWERS.keys()), random.randint(2, 4))
        
        for flower_type in flower_types:
            varieties = random.sample(FLOWERS[flower_type]['varieties'], 
                                    random.randint(1, min(3, len(FLOWERS[flower_type]['varieties']))))
            
            for variety in varieties:
                heights = random.sample(variety['height'], random.randint(1, len(variety['height'])))
                
                for height in heights:
                    # Determine price based on type and origin
                    if flower_type == 'roses':
                        base_price = random.uniform(0.5, 2.0) if currency == 'USD' else random.uniform(250, 800)
                    elif flower_type == 'tulips':
                        base_price = random.uniform(0.3, 0.8) if currency == 'USD' else random.uniform(150, 400)
                    elif flower_type == 'chrysanthemums':
                        base_price = random.uniform(0.4, 1.0) if currency == 'USD' else random.uniform(200, 500)
                    else:  # greenery
                        base_price = random.uniform(0.2, 0.5) if currency == 'USD' else random.uniform(100, 250)
                    
                    quantity = random.randint(100, 500)
                    item_total = base_price * quantity
                    
                    # Find category
                    category_name = FLOWERS[flower_type]['category']
                    category = categories.get(category_name)
                    
                    # Calculate retail price
                    retail_price = calculate_price_kzt(base_price, currency, rates[currency], 
                                                     category.markup_percentage if category else 100)
                    
                    supply_item = SupplyItem(
                        category=category,
                        flower_name=variety['name'],
                        height_cm=height,
                        purchase_price=base_price,
                        quantity=quantity,
                        remaining_quantity=max(0, quantity - random.randint(0, quantity // 2)),
                        retail_price=retail_price,
                        total_cost=item_total,
                        batch_code=f"{supplier[:3].upper()}{delivery_date.strftime('%y%m%d')}"
                    )
                    supply.items.append(supply_item)
                    total_cost += item_total
                    
                    # Create warehouse item if still have stock
                    if supply_item.remaining_quantity > 0 and days_ago < 14:  # Only recent supplies
                        warehouse_item = WarehouseItem(
                            sku=f"{supply_item.batch_code}-{variety['name'][:3].upper()}{height}",
                            batch_code=supply_item.batch_code,
                            variety=variety['name'],
                            height_cm=height,
                            farm=supply.farm,
                            supplier=supplier,
                            delivery_date=delivery_date,
                            currency=currency,
                            rate=rates[currency],
                            cost=base_price,
                            recommended_price=retail_price,
                            price=retail_price,
                            markup_pct=category.markup_percentage if category else 100,
                            qty=supply_item.remaining_quantity,
                            reserved_qty=0,
                            on_showcase=random.random() > 0.3,
                            to_write_off=(days_ago > 10 and random.random() > 0.8),
                            supply_item=supply_item
                        )
                        warehouse_items.append(warehouse_item)
        
        supply.total_cost = total_cost
        supplies.append(supply)
    
    session.add_all(supplies)
    session.add_all(warehouse_items)
    session.commit()
    
    return supplies, warehouse_items


def create_products(session: Session, warehouse_items: list, shops: dict) -> list:
    """Create products (bouquets)"""
    print("Creating products...")
    
    products = []
    shop_ids = list(shops.keys())
    
    # Group warehouse items by variety for easier lookup
    items_by_variety = {}
    for item in warehouse_items:
        if item.variety not in items_by_variety:
            items_by_variety[item.variety] = []
        if not item.to_write_off and item.available_qty > 0:
            items_by_variety[item.variety].append(item)
    
    for product_data in PRODUCTS:
        for shop_id in shop_ids:
            product = Product(
                shop_id=shop_id,
                name=product_data['name'],
                description=product_data['description'],
                category=ProductCategory.bouquet,  # Default category
                retail_price=product_data['base_price'],
                cost_price=product_data['base_price'] * 0.6,  # 60% of retail price
                is_active=True,
                is_popular=random.random() > 0.7
            )
            
            # Add ingredients
            can_create = True
            for variety_name, quantity in product_data['ingredients']:
                if variety_name in items_by_variety and items_by_variety[variety_name]:
                    # Pick random item of this variety
                    item = random.choice(items_by_variety[variety_name])
                    ingredient = ProductIngredient(
                        warehouse_item=item,
                        quantity=quantity,
                        notes=f"Основной цветок" if quantity > 20 else "Дополнение"
                    )
                    product.ingredients.append(ingredient)
                else:
                    can_create = False
                    break
            
            if can_create:
                # Add image
                image = ProductImage(
                    image_url=f"https://images.cvety.kz/product-{len(products)+1}.jpg",
                    is_primary=True
                )
                product.images.append(image)
                products.append(product)
    
    session.add_all(products)
    session.commit()
    
    return products


def create_orders(session: Session, customers: list, products: list, users: dict, shops: dict) -> list:
    """Create orders with history"""
    print("Creating orders...")
    
    orders = []
    florists = users['florists']
    couriers = users['couriers']
    
    # Create orders for all customers (1-50 orders each)
    for customer in customers:
        num_orders = random.randint(1, 50)
        
        for _ in range(num_orders):
            # Order date
            days_ago = random.randint(0, 60)
            order_date = datetime.now() - timedelta(days=days_ago)
            
            # Select products
            order_products = random.sample(products, random.randint(1, 3))
            
            # Calculate totals
            flower_sum = sum(p.retail_price for p in order_products)
            delivery_fee = 1500 if flower_sum < 20000 else 0
            total = flower_sum + delivery_fee
            
            # Delivery info
            delivery_method = DeliveryMethod.delivery if random.random() > 0.2 else DeliveryMethod.self_pickup
            recipient = generate_person()
            
            # Determine status based on age
            if days_ago == 0:
                status = random.choice([OrderStatus.new, OrderStatus.paid])
            elif days_ago < 3:
                status = random.choice([OrderStatus.paid, OrderStatus.assembled, OrderStatus.delivery])
            else:
                status = random.choice([OrderStatus.delivered, OrderStatus.completed])
                if random.random() > 0.95:
                    status = OrderStatus.issue
            
            order = Order(
                shop_id=customer.shop_id,
                customer_id=customer.id,
                customer_phone=customer.phone,
                recipient_name=recipient['full_name'] if random.random() > 0.3 else customer.name,
                recipient_phone=generate_phone() if random.random() > 0.5 else customer.phone,
                address=random.choice([addr.address for addr in customer.addresses]) if customer.addresses and delivery_method == DeliveryMethod.delivery else None,
                address_needs_clarification=(random.random() > 0.9 and delivery_method == DeliveryMethod.delivery),
                delivery_method=delivery_method,
                delivery_window=generate_delivery_window(order_date + timedelta(days=random.randint(0, 3))),
                flower_sum=flower_sum,
                delivery_fee=delivery_fee,
                total=total,
                status=status,
                payment_method=random.choice([PaymentMethod.kaspi, PaymentMethod.cash, PaymentMethod.transfer]),
                payment_date=order_date + timedelta(hours=random.randint(1, 24)) if status != OrderStatus.new else None,
                tracking_token=str(uuid.uuid4())[:8].upper(),  # Generate 8-character tracking token
                created_at=order_date,
                updated_at=order_date
            )
            
            # Assign florist and courier for appropriate statuses
            if status not in [OrderStatus.new]:
                order.assigned_florist_id = random.choice(florists).id
            
            if status in [OrderStatus.delivery, OrderStatus.delivered, OrderStatus.completed]:
                order.courier_id = random.choice(couriers).id
            
            # Add order items
            for product in order_products:
                quantity = 1
                order_item = OrderItem(
                    product_id=product.id,
                    product_name=product.name,
                    product_category="Букеты",  # Default category
                    price=product.retail_price,
                    quantity=quantity,
                    total=product.retail_price * quantity
                )
                order.items.append(order_item)
            
            session.add(order)
            session.flush()  # Get order ID
            
            # Add order history
            history_entries = []
            
            # Created
            history_entries.append(OrderHistory(
                order_id=order.id,
                user_id=random.choice(users['managers']).id,
                event_type=OrderEventType.created,
                new_status=OrderStatus.new,
                created_at=order_date
            ))
            
            # Status changes
            if status != OrderStatus.new:
                status_flow = {
                    OrderStatus.paid: [OrderStatus.new, OrderStatus.paid],
                    OrderStatus.assembled: [OrderStatus.new, OrderStatus.paid, OrderStatus.assembled],
                    OrderStatus.delivery: [OrderStatus.new, OrderStatus.paid, OrderStatus.assembled, OrderStatus.delivery],
                    OrderStatus.delivered: [OrderStatus.new, OrderStatus.paid, OrderStatus.assembled, OrderStatus.delivery, OrderStatus.delivered],
                    OrderStatus.completed: [OrderStatus.new, OrderStatus.paid, OrderStatus.assembled, OrderStatus.delivery, OrderStatus.delivered, OrderStatus.completed],
                    OrderStatus.issue: [OrderStatus.new, OrderStatus.paid, OrderStatus.issue]
                }
                
                statuses = status_flow.get(status, [status])
                time_offset = 0
                
                for i, s in enumerate(statuses[1:], 1):
                    time_offset += random.randint(1, 8)
                    history_entries.append(OrderHistory(
                        order_id=order.id,
                        user_id=random.choice(users['all']).id,
                        event_type=OrderEventType.status_changed,
                        old_status=statuses[i-1],
                        new_status=s,
                        created_at=order_date + timedelta(hours=time_offset)
                    ))
            
            # Add some comments
            if random.random() > 0.6:
                num_comments = random.randint(1, 3)
                for _ in range(num_comments):
                    comment_time = order_date + timedelta(hours=random.randint(1, 48))
                    comment = Comment(
                        order_id=order.id,
                        user_id=random.choice(users['all']).id,
                        text=random.choice([
                            "Клиент просил доставить точно к указанному времени",
                            "Букет готов, ждем курьера",
                            "Клиент доволен, спасибо!",
                            "Нужно добавить больше зелени",
                            "Получатель был очень рад",
                            "Доставлено вовремя"
                        ]),
                        created_at=comment_time
                    )
                    session.add(comment)
            
            session.add_all(history_entries)
            orders.append(order)
    
    session.commit()
    return orders


def update_customer_statistics(session: Session, customers: list):
    """Update customer order statistics after creating orders"""
    print("Updating customer statistics...")
    
    from sqlalchemy import func
    
    for customer in customers:
        # Calculate statistics from orders
        stats = session.query(
            func.count(Order.id).label("count"),
            func.sum(Order.total).label("total"),
            func.max(Order.created_at).label("last_date")
        ).filter(
            Order.customer_id == customer.id,
            Order.status != OrderStatus.issue  # Don't count problematic orders
        ).first()
        
        customer.orders_count = stats.count or 0
        customer.total_spent = stats.total or 0
        customer.last_order_date = stats.last_date
    
    session.commit()
    print(f"Updated statistics for {len(customers)} customers")


def main():
    """Main function to seed the database"""
    print("Starting database seed...")
    
    # Create engine and session
    engine = create_engine(settings.DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    
    with Session(engine) as session:
        # Clear existing data
        clear_database(session)
        
        # Create data
        shops = create_shops(session)
        users = create_users(session, shops)
        customers = create_customers(session, shops)
        categories = create_flower_categories(session)
        supplies, warehouse_items = create_supplies_and_warehouse(session, categories)
        products = create_products(session, warehouse_items, shops)
        orders = create_orders(session, customers, products, users, shops)
        
        # Update customer statistics after creating orders
        update_customer_statistics(session, customers)
        
        print("\n=== Seed Summary ===")
        print(f"Shops: {len(shops)}")
        print(f"Users: {len(users['all'])}")
        print(f"Customers: {len(customers)}")
        print(f"Categories: {len(categories)}")
        print(f"Supplies: {len(supplies)}")
        print(f"Warehouse Items: {len(warehouse_items)}")
        print(f"Products: {len(products)}")
        print(f"Orders: {len(orders)}")
        print("\nDatabase seeded successfully!")


if __name__ == "__main__":
    main()