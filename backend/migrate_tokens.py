#!/usr/bin/env python3
"""
Migrate existing tracking tokens to numeric format.
"""
import secrets
from sqlalchemy.orm import Session
from app.db.session import engine
from app.models.order import Order

def generate_numeric_token():
    """Generate a 12-digit numeric tracking token."""
    return str(secrets.randbelow(999999999999)).zfill(12)

def migrate_tokens():
    """Migrate all existing tracking tokens to numeric format."""
    with Session(engine) as db:
        # Get all orders with existing tracking tokens
        orders = db.query(Order).filter(Order.tracking_token.isnot(None)).all()
        
        print(f"Found {len(orders)} orders with tracking tokens")
        
        for order in orders:
            old_token = order.tracking_token
            new_token = generate_numeric_token()
            
            # Make sure the new token is unique
            while db.query(Order).filter(Order.tracking_token == new_token).first():
                new_token = generate_numeric_token()
            
            order.tracking_token = new_token
            print(f"Order {order.id}: {old_token} -> {new_token}")
        
        db.commit()
        print(f"Successfully migrated {len(orders)} tracking tokens")

if __name__ == "__main__":
    migrate_tokens()