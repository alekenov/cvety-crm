#!/usr/bin/env python3
"""Initialize decorative materials with default data"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.db.session import engine
from app.models.shop import Shop
from app.models.decorative_material import DecorativeMaterial, CalculatorSettings


def init_decorative_materials():
    """Initialize decorative materials for all shops"""
    
    # Default materials to add
    default_materials = [
        {"name": "Упаковка крафт", "category": "packaging", "price": 500, "unit": "шт"},
        {"name": "Упаковка корейская", "category": "packaging", "price": 800, "unit": "шт"},
        {"name": "Лента атласная", "category": "ribbon", "price": 300, "unit": "шт"},
        {"name": "Лента бархатная", "category": "ribbon", "price": 500, "unit": "шт"},
        {"name": "Открытка", "category": "card", "price": 200, "unit": "шт"},
        {"name": "Топпер", "category": "topper", "price": 1000, "unit": "шт"},
        {"name": "Упаковка пленка", "category": "packaging", "price": 400, "unit": "шт"},
        {"name": "Лента репсовая", "category": "ribbon", "price": 350, "unit": "шт"},
        {"name": "Бант готовый", "category": "ribbon", "price": 600, "unit": "шт"},
        {"name": "Коробка подарочная малая", "category": "packaging", "price": 1500, "unit": "шт"},
        {"name": "Коробка подарочная большая", "category": "packaging", "price": 2500, "unit": "шт"},
        {"name": "Наклейка декоративная", "category": "card", "price": 150, "unit": "шт"},
    ]
    
    with Session(engine) as db:
        # Get all shops
        shops = db.query(Shop).all()
        
        for shop in shops:
            print(f"\nProcessing shop: {shop.name} (ID: {shop.id})")
            
            # Check if materials already exist for this shop
            existing_count = db.query(DecorativeMaterial).filter_by(shop_id=shop.id).count()
            
            if existing_count > 0:
                print(f"  Shop already has {existing_count} materials, skipping...")
                continue
            
            # Add default materials
            for material_data in default_materials:
                material = DecorativeMaterial(
                    shop_id=shop.id,
                    **material_data,
                    is_active=True,
                    in_stock=True
                )
                db.add(material)
                print(f"  Added: {material_data['name']}")
            
            # Create default calculator settings
            existing_settings = db.query(CalculatorSettings).filter_by(shop_id=shop.id).first()
            if not existing_settings:
                settings = CalculatorSettings(
                    shop_id=shop.id,
                    default_labor_cost=2000,
                    min_margin_percent=30,
                    recommended_margin_percent=50,
                    premium_margin_percent=100
                )
                db.add(settings)
                print(f"  Added calculator settings with default labor cost: 2000 KZT")
            
            try:
                db.commit()
                print(f"  ✅ Initialized {len(default_materials)} materials for shop {shop.name}")
            except Exception as e:
                print(f"  ⚠️ Warning: Could not commit (may already exist): {e}")
                db.rollback()
        
        print("\n✅ Initialization complete!")


if __name__ == "__main__":
    init_decorative_materials()