import random
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.models.order import Order, OrderStatus
from app.models.order_history import OrderHistory, OrderEventType


def update_orders_with_florists(db: Session):
    """Update existing orders to assign florists"""
    
    # Get all florists
    florists = db.query(User).filter(User.role == UserRole.florist).all()
    if not florists:
        print("No florists found! Please run create_test_data.py first")
        return
    
    print(f"Found {len(florists)} florists: {[f.name for f in florists]}")
    
    # Get all orders without florists
    orders = db.query(Order).filter(Order.assigned_florist_id == None).all()
    print(f"Found {len(orders)} orders without florists")
    
    # Assign florists to orders
    for order in orders:
        # Assign florist to ~70% of orders
        if random.random() < 0.7:
            florist = random.choice(florists)
            order.assigned_florist_id = florist.id
            
            # Add history entry for florist assignment
            history_entry = OrderHistory(
                order_id=order.id,
                event_type=OrderEventType.florist_assigned,
                comment=f"Назначен флорист: {florist.name}",
                user_id=florist.id
            )
            db.add(history_entry)
            print(f"Assigned {florist.name} to order #{order.id}")
    
    db.commit()
    print("Successfully updated orders with florists")


def main():
    db = SessionLocal()
    
    try:
        update_orders_with_florists(db)
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    main()