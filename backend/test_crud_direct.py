import sys
sys.path.append('.')

from app.db.session import SessionLocal
from app import crud

# Test direct CRUD access
db = SessionLocal()

try:
    # Test get_active method
    print("Testing get_active...")
    products = crud.product.get_active(db)
    print(f"Found {len(products)} products")
    
    # Test count_active method
    print("\nTesting count_active...")
    try:
        count = crud.product.count_active(db)
        print(f"Count active result: {count}")
    except AttributeError as e:
        print(f"AttributeError: {e}")
        print("Method count_active does not exist")
    except Exception as e:
        print(f"Other error: {type(e).__name__}: {e}")
        
finally:
    db.close()