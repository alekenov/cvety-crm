"""Скрипт для удаления клиентов с 0 заказов"""
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.customer import Customer
from app.models.order import Order
from sqlalchemy import func

def cleanup_customers(db: Session):
    """Удалить клиентов без заказов"""
    
    # Подсчитаем количество заказов для каждого клиента
    customers_with_orders = db.query(Order.customer_id).distinct().all()
    customer_ids_with_orders = {c[0] for c in customers_with_orders}
    
    # Найдем клиентов без заказов
    customers_without_orders = db.query(Customer).filter(
        ~Customer.id.in_(customer_ids_with_orders)
    ).all()
    
    print(f"Найдено {len(customers_without_orders)} клиентов без заказов")
    
    # Удалим клиентов без заказов
    for customer in customers_without_orders:
        print(f"Удаляем клиента: {customer.name} ({customer.phone})")
        db.delete(customer)
    
    # Обновим статистику для оставшихся клиентов
    remaining_customers = db.query(Customer).all()
    for customer in remaining_customers:
        # Подсчитаем количество заказов
        orders_count = db.query(func.count(Order.id)).filter(
            Order.customer_id == customer.id
        ).scalar()
        
        # Подсчитаем общую сумму
        total_spent = db.query(func.sum(Order.total)).filter(
            Order.customer_id == customer.id
        ).scalar() or 0
        
        customer.orders_count = orders_count
        customer.total_spent = total_spent
    
    db.commit()
    print(f"Статистика обновлена для {len(remaining_customers)} клиентов")
    
    # Покажем топ клиентов
    top_customers = db.query(Customer).order_by(
        Customer.orders_count.desc()
    ).limit(10).all()
    
    print("\nТоп 10 клиентов по количеству заказов:")
    for i, customer in enumerate(top_customers, 1):
        print(f"{i}. {customer.name} - {customer.orders_count} заказов, сумма: {customer.total_spent:,.0f} ₸")

def main():
    db = SessionLocal()
    
    try:
        cleanup_customers(db)
    except Exception as e:
        print(f"Ошибка: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()