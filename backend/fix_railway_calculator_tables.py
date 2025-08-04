#!/usr/bin/env python3
"""Add calculator tables to Railway database"""

import os
import psycopg2
from psycopg2 import sql

def main():
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        print("DATABASE_URL not found")
        return
    
    try:
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()
        
        # Check if tables exist
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('decorative_materials', 'calculator_settings')
        """)
        
        existing_tables = [row[0] for row in cursor.fetchall()]
        print(f"Existing tables: {existing_tables}")
        
        # Create decorative_materials table if it doesn't exist
        if 'decorative_materials' not in existing_tables:
            print("Creating decorative_materials table...")
            cursor.execute("""
                CREATE TABLE decorative_materials (
                    id SERIAL PRIMARY KEY,
                    shop_id INTEGER NOT NULL REFERENCES shops(id),
                    name VARCHAR NOT NULL,
                    category VARCHAR,
                    price DECIMAL(10, 2) NOT NULL,
                    unit VARCHAR DEFAULT 'шт',
                    is_active BOOLEAN DEFAULT TRUE,
                    in_stock BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE
                )
            """)
            cursor.execute("CREATE INDEX idx_decorative_materials_shop_id ON decorative_materials(shop_id)")
            conn.commit()
            print("✅ decorative_materials table created")
        else:
            print("✓ decorative_materials table already exists")
        
        # Create calculator_settings table if it doesn't exist
        if 'calculator_settings' not in existing_tables:
            print("Creating calculator_settings table...")
            cursor.execute("""
                CREATE TABLE calculator_settings (
                    id SERIAL PRIMARY KEY,
                    shop_id INTEGER NOT NULL UNIQUE REFERENCES shops(id),
                    default_labor_cost DECIMAL(10, 2) NOT NULL DEFAULT 2000,
                    min_margin_percent DECIMAL(5, 2) DEFAULT 30,
                    recommended_margin_percent DECIMAL(5, 2) DEFAULT 50,
                    premium_margin_percent DECIMAL(5, 2) DEFAULT 100,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE
                )
            """)
            cursor.execute("CREATE INDEX idx_calculator_settings_shop_id ON calculator_settings(shop_id)")
            conn.commit()
            print("✅ calculator_settings table created")
        else:
            print("✓ calculator_settings table already exists")
        
        # Add default materials for existing shops
        cursor.execute("SELECT id, name FROM shops")
        shops = cursor.fetchall()
        
        default_materials = [
            ("Упаковка крафт", "packaging", 500),
            ("Упаковка корейская", "packaging", 800),
            ("Лента атласная", "ribbon", 300),
            ("Лента бархатная", "ribbon", 500),
            ("Открытка", "card", 200),
            ("Топпер", "topper", 1000),
            ("Упаковка пленка", "packaging", 400),
            ("Лента репсовая", "ribbon", 350),
            ("Бант готовый", "ribbon", 600),
            ("Коробка подарочная малая", "packaging", 1500),
            ("Коробка подарочная большая", "packaging", 2500),
            ("Наклейка декоративная", "card", 150),
        ]
        
        for shop_id, shop_name in shops:
            print(f"\nProcessing shop: {shop_name} (ID: {shop_id})")
            
            # Check if materials exist for this shop
            cursor.execute("SELECT COUNT(*) FROM decorative_materials WHERE shop_id = %s", (shop_id,))
            count = cursor.fetchone()[0]
            
            if count == 0:
                # Add default materials
                for name, category, price in default_materials:
                    cursor.execute("""
                        INSERT INTO decorative_materials (shop_id, name, category, price)
                        VALUES (%s, %s, %s, %s)
                    """, (shop_id, name, category, price))
                conn.commit()
                print(f"  ✅ Added {len(default_materials)} materials")
            else:
                print(f"  ✓ Shop already has {count} materials")
            
            # Check if calculator settings exist
            cursor.execute("SELECT COUNT(*) FROM calculator_settings WHERE shop_id = %s", (shop_id,))
            count = cursor.fetchone()[0]
            
            if count == 0:
                cursor.execute("""
                    INSERT INTO calculator_settings (shop_id)
                    VALUES (%s)
                """, (shop_id,))
                conn.commit()
                print(f"  ✅ Added calculator settings")
            else:
                print(f"  ✓ Calculator settings already exist")
        
        print("\n✅ Database update completed successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    main()