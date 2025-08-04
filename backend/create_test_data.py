import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.models.customer import Customer
from app.models.product import Product
from app.models.order import Order, OrderStatus, DeliveryMethod
from app.models.order_history import OrderHistory, OrderEventType
import secrets


def create_test_users(db: Session):
    """Create test users (florists, couriers, managers)"""
    users = [
        # Florists
        {"name": "Айгуль Касымова", "phone": "+77051234567", "email": "aigul@cvety.kz", "role": UserRole.florist},
        {"name": "Мария Петрова", "phone": "+77052345678", "email": "maria@cvety.kz", "role": UserRole.florist},
        {"name": "Динара Султанова", "phone": "+77053456789", "email": "dinara@cvety.kz", "role": UserRole.florist},
        {"name": "Гульнара Ахметова", "phone": "+77054567890", "email": "gulnara@cvety.kz", "role": UserRole.florist},
        
        # Couriers
        {"name": "Бауыржан Жумабеков", "phone": "+77771234567", "email": "baurzhan@cvety.kz", "role": UserRole.courier},
        {"name": "Ерлан Сериков", "phone": "+77772345678", "email": "erlan@cvety.kz", "role": UserRole.courier},
        
        # Managers
        {"name": "Алия Назарбаева", "phone": "+77011234567", "email": "aliya@cvety.kz", "role": UserRole.manager},
        {"name": "Админ", "phone": "+77000000000", "email": "admin@cvety.kz", "role": UserRole.admin},
    ]
    
    created_users = []
    for user_data in users:
        user = db.query(User).filter(User.phone == user_data["phone"]).first()
        if not user:
            user = User(**user_data, is_active=True)
            db.add(user)
            created_users.append(user)
    
    db.commit()
    print(f"Created {len(created_users)} users")
    return created_users


def create_test_customers(db: Session):
    """Create test customers"""
    customers = [
        {"name": "Айгерим Сатпаева", "phone": "+77071234567", "email": "aigerim@example.com"},
        {"name": "Нурлан Абишев", "phone": "+77072345678"},
        {"name": "Светлана Иванова", "phone": "+77073456789", "email": "svetlana@example.com"},
        {"name": "Асель Жумабекова", "phone": "+77074567890"},
        {"name": "Дмитрий Петров", "phone": "+77075678901", "email": "dmitry@example.com"},
    ]
    
    created_customers = []
    for customer_data in customers:
        customer = db.query(Customer).filter(Customer.phone == customer_data["phone"]).first()
        if not customer:
            customer = Customer(**customer_data)
            db.add(customer)
            created_customers.append(customer)
    
    db.commit()
    print(f"Created {len(created_customers)} customers")
    return created_customers


def create_test_products(db: Session):
    """Create test products if they don't exist"""
    products = [
        {"name": "Букет «Нежность»", "category": "bouquet", "cost_price": 8000, "retail_price": 15000},
        {"name": "Букет «Весна»", "category": "bouquet", "cost_price": 10000, "retail_price": 18000},
        {"name": "Букет «Романтика»", "category": "bouquet", "cost_price": 12000, "retail_price": 22000},
        {"name": "Букет «Праздничный»", "category": "bouquet", "cost_price": 15000, "retail_price": 28000},
        {"name": "Розы красные (25 шт)", "category": "bouquet", "cost_price": 7500, "retail_price": 15000},
        {"name": "Розы белые (15 шт)", "category": "bouquet", "cost_price": 6000, "retail_price": 12000},
        {"name": "Тюльпаны (21 шт)", "category": "bouquet", "cost_price": 4200, "retail_price": 8000},
        {"name": "Пионы (15 шт)", "category": "bouquet", "cost_price": 9000, "retail_price": 18000},
        {"name": "Открытка", "category": "other", "cost_price": 500, "retail_price": 1500},
        {"name": "Мишка Teddy", "category": "other", "cost_price": 2000, "retail_price": 5000},
        {"name": "Конфеты Raffaello", "category": "other", "cost_price": 1500, "retail_price": 3000},
        {"name": "Коробка шоколада", "category": "other", "cost_price": 3500, "retail_price": 7000},
    ]
    
    created_products = []
    for product_data in products:
        product = db.query(Product).filter(Product.name == product_data["name"]).first()
        if not product:
            product = Product(**product_data, is_active=True)
            db.add(product)
            created_products.append(product)
    
    db.commit()
    print(f"Created {len(created_products)} products")
    return db.query(Product).all()


def create_test_orders(db: Session, customers, florists, products):
    """Create test orders with history"""
    addresses = [
        "ул. Абая 150, кв 25",
        "пр. Аль-Фараби 77, офис 305",
        "ул. Розыбакиева 247, кв 12",
        "мкр. Самал-2, д. 58, кв 89",
        "ул. Богенбай батыра 86, кв 45",
    ]
    
    orders = []
    for i in range(15):
        customer = random.choice(customers)
        florist = random.choice(florists) if random.random() > 0.3 else None
        
        # Create order
        order_date = datetime.now() - timedelta(days=random.randint(0, 30))
        delivery_date = order_date + timedelta(days=random.randint(0, 2))
        
        order = Order(
            customer_id=customer.id,
            customer_phone=customer.phone,
            recipient_name=customer.name,
            recipient_phone=customer.phone,
            address=random.choice(addresses),
            delivery_method=random.choice([DeliveryMethod.delivery, DeliveryMethod.self_pickup]),
            delivery_window={
                "from": delivery_date.replace(hour=random.choice([10, 12, 14, 16])).isoformat(),
                "to": (delivery_date.replace(hour=random.choice([12, 14, 16, 18]))).isoformat()
            },
            status=random.choice(list(OrderStatus)),
            flower_sum=0,
            delivery_fee=1500 if random.random() > 0.3 else 0,
            total=0,
            tracking_token=str(secrets.randbelow(900000000) + 100000000),
            assigned_florist_id=florist.id if florist else None,
            created_at=order_date,
            updated_at=order_date
        )
        
        db.add(order)
        db.flush()
        
        # Add order items
        num_items = random.randint(1, 4)
        selected_products = random.sample(products, num_items)
        total = 0
        
        from app.models.order import OrderItem
        for product in selected_products:
            quantity = random.randint(1, 3)
            item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                product_name=product.name,
                product_category=product.category,
                quantity=quantity,
                price=product.retail_price,
                total=product.retail_price * quantity
            )
            db.add(item)
            total += item.total
        
        order.flower_sum = total
        order.total = total + order.delivery_fee
        
        # Create history
        history_entry = OrderHistory(
            order_id=order.id,
            event_type=OrderEventType.created,
            comment="Заказ создан",
            created_at=order_date
        )
        db.add(history_entry)
        
        # Add payment history if paid
        if order.status != OrderStatus.new:
            payment_date = order_date + timedelta(minutes=random.randint(5, 60))
            history_entry = OrderHistory(
                order_id=order.id,
                event_type=OrderEventType.payment_received,
                comment="Оплата получена через Kaspi Pay",
                created_at=payment_date
            )
            db.add(history_entry)
        
        # Add florist assignment history
        if florist:
            assignment_date = order_date + timedelta(hours=random.randint(1, 4))
            history_entry = OrderHistory(
                order_id=order.id,
                event_type=OrderEventType.florist_assigned,
                comment=f"Назначен флорист: {florist.name}",
                created_at=assignment_date
            )
            db.add(history_entry)
        
        orders.append(order)
    
    db.commit()
    print(f"Created {len(orders)} orders with history")
    return orders


def main():
    db = SessionLocal()
    
    try:
        print("Creating test data...")
        
        # Create users
        users = create_test_users(db)
        florists = [u for u in users if u.role == UserRole.florist]
        
        # Create customers
        customers = create_test_customers(db)
        
        # Create products
        products = create_test_products(db)
        
        # Create orders
        orders = create_test_orders(db, customers, florists, products)
        
        print("\nTest data created successfully!")
        print(f"Total users: {len(users)}")
        print(f"Total customers: {len(customers)}")
        print(f"Total products: {len(products)}")
        print(f"Total orders: {len(orders)}")
        
    except Exception as e:
        print(f"Error creating test data: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    main()