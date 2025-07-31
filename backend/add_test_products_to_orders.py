#!/usr/bin/env python3
"""Add test products to existing orders"""

import os
import sys
import random
from datetime import datetime

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.order import Order, OrderItem
from app.models.product import Product

# Test products data
test_products = [
    {"name": "Букет «Нежность»", "retail_price": 12000, "cost_price": 8000, "category": "bouquet"},
    {"name": "Букет «Весна»", "retail_price": 15000, "cost_price": 10000, "category": "bouquet"},
    {"name": "Букет «Романтика»", "retail_price": 18000, "cost_price": 12000, "category": "bouquet"},
    {"name": "Букет «Праздничный»", "retail_price": 25000, "cost_price": 16000, "category": "bouquet"},
    {"name": "Розы красные", "retail_price": 500, "cost_price": 300, "category": "other"},  # per stem
    {"name": "Розы белые", "retail_price": 600, "cost_price": 400, "category": "other"},
    {"name": "Тюльпаны", "retail_price": 300, "cost_price": 200, "category": "other"},
    {"name": "Пионы", "retail_price": 800, "cost_price": 500, "category": "other"},
    {"name": "Упаковка", "retail_price": 1000, "cost_price": 500, "category": "other"},
    {"name": "Лента", "retail_price": 500, "cost_price": 200, "category": "other"},
    {"name": "Открытка", "retail_price": 1500, "cost_price": 500, "category": "other"},
    {"name": "Конфеты Raffaello", "retail_price": 3000, "cost_price": 2000, "category": "other"},
    {"name": "Мишка Teddy", "retail_price": 5000, "cost_price": 3000, "category": "other"},
    {"name": "Коробка шоколада", "retail_price": 7000, "cost_price": 4500, "category": "other"},
]

def add_test_products():
    db = SessionLocal()
    try:
        # First, create products if they don't exist
        existing_products = {p.name: p for p in db.query(Product).all()}
        
        for product_data in test_products:
            if product_data["name"] not in existing_products:
                product = Product(
                    name=product_data["name"],
                    retail_price=product_data["retail_price"],
                    cost_price=product_data["cost_price"],
                    category=product_data["category"],
                    is_active=True
                )
                db.add(product)
                db.flush()
                existing_products[product_data["name"]] = product
        
        db.commit()
        
        # Get all orders
        orders = db.query(Order).all()
        
        # Sample product combinations
        product_sets = [
            # 1 product
            [("Букет «Нежность»", 1)],
            # 2 products
            [("Розы красные", 25), ("Упаковка", 1)],
            [("Букет «Весна»", 1), ("Открытка", 1)],
            # 3 products
            [("Букет «Романтика»", 1), ("Конфеты Raffaello", 1), ("Открытка", 1)],
            [("Розы белые", 15), ("Упаковка", 1), ("Лента", 2)],
            [("Тюльпаны", 21), ("Упаковка", 1), ("Открытка", 1)],
            # 4-6 products
            [("Букет «Праздничный»", 1), ("Мишка Teddy", 1), ("Конфеты Raffaello", 1), ("Открытка", 1)],
            [("Розы красные", 31), ("Розы белые", 20), ("Упаковка", 2), ("Лента", 3), ("Открытка", 1)],
            [("Пионы", 15), ("Тюльпаны", 10), ("Упаковка", 1), ("Лента", 2), ("Открытка", 1), ("Коробка шоколада", 1)],
        ]
        
        for i, order in enumerate(orders):
            # Skip if order already has items
            if db.query(OrderItem).filter_by(order_id=order.id).first():
                continue
            
            # Select a product set
            product_set = product_sets[i % len(product_sets)]
            
            # Add items to order
            total_price = 0
            for product_name, quantity in product_set:
                product = existing_products.get(product_name)
                if product:
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
                    total_price += product.retail_price * quantity
            
            # Update order totals
            order.flower_sum = total_price
            order.total = total_price + order.delivery_fee
            
        db.commit()
        print(f"Successfully added products to {len(orders)} orders")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_test_products()