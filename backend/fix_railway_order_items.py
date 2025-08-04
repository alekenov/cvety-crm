#!/usr/bin/env python3
"""Fix order items in Railway database"""

import os
import psycopg2

def main():
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        print("DATABASE_URL not found")
        return
    
    try:
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()
        
        # Check orders without items
        cursor.execute("""
            SELECT o.id, o.shop_id, COUNT(oi.id) as item_count
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.shop_id = 3
            GROUP BY o.id, o.shop_id
            ORDER BY o.id
        """)
        
        print("Orders and their item counts:")
        for row in cursor.fetchall():
            print(f"  Order {row[0]} (shop_id={row[1]}): {row[2]} items")
        
        # Add items to orders that don't have any
        cursor.execute("""
            SELECT id FROM orders 
            WHERE shop_id = 3 
            AND id NOT IN (SELECT DISTINCT order_id FROM order_items)
        """)
        
        orders_without_items = cursor.fetchall()
        if orders_without_items:
            # Check products table structure
            cursor.execute("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'products' 
                ORDER BY ordinal_position
            """)
            print("\nProduct columns:", [row[0] for row in cursor.fetchall()])
            
            # Get available products (using retail_price)
            cursor.execute("SELECT id, name, category, retail_price FROM products WHERE shop_id = 3 LIMIT 2")
            products = cursor.fetchall()
            
            if not products:
                print("No products found for shop_id=3!")
                return
            
            print(f"\nAdding items to {len(orders_without_items)} orders without items...")
            for order_id in orders_without_items:
                # Add sample items using real products
                for product in products:
                    quantity = 5
                    cursor.execute("""
                        INSERT INTO order_items (order_id, product_id, product_name, product_category, quantity, price, total)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """, (order_id[0], product[0], product[1], product[2], quantity, product[3], product[3] * quantity))
            conn.commit()
            print("Done!")
        else:
            print("\nAll orders already have items!")
        
    except Exception as e:
        print(f"Error: {e}")
        if 'conn' in locals():
            conn.rollback()
        import traceback
        traceback.print_exc()
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    main()