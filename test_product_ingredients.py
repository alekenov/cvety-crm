#!/usr/bin/env python3
"""Test product-warehouse linking via ingredients"""

import requests
import json

BASE_URL = "http://localhost:8000/api"

# Test data
test_product = {
    "name": "Букет \"Весенний\"",
    "category": "bouquet",
    "description": "Красивый весенний букет",
    "cost_price": 5000,
    "retail_price": 12000,
    "is_active": True
}

test_ingredient = {
    "warehouse_item_id": 1,  # Assuming warehouse item with ID 1 exists
    "quantity": 5,
    "notes": "Основные цветы"
}


def get_auth_token():
    """Get JWT token for authenticated requests"""
    # Request OTP
    otp_response = requests.post(f"{BASE_URL}/auth/request-otp", json={"phone": "+77001234567"})
    if otp_response.status_code != 201:
        print(f"Failed to request OTP: {otp_response.text}")
        return None
    
    # Get OTP from response (in DEBUG mode)
    otp_data = otp_response.json()
    otp_code = otp_data.get("otp")
    
    if not otp_code:
        print("OTP not returned (not in DEBUG mode)")
        return None
    
    # Verify OTP
    verify_response = requests.post(f"{BASE_URL}/auth/verify-otp", json={
        "phone": "+77001234567",
        "otp_code": otp_code
    })
    
    if verify_response.status_code == 200:
        return verify_response.json().get("access_token")
    else:
        print(f"Failed to verify OTP: {verify_response.text}")
        return None


def test_product_ingredients():
    """Test product-warehouse ingredient linking"""
    
    # Get auth token
    token = get_auth_token()
    if not token:
        print("❌ Failed to get auth token")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print("Testing Product-Warehouse Ingredient Linking\n" + "="*50)
    
    # 1. Create a test product
    print("\n1. Creating test product...")
    create_response = requests.post(f"{BASE_URL}/products/", json=test_product, headers=headers)
    
    if create_response.status_code == 201:
        product = create_response.json()
        product_id = product["id"]
        print(f"✅ Product created: ID={product_id}, Name={product['name']}")
    else:
        print(f"❌ Failed to create product: {create_response.status_code} - {create_response.text}")
        return
    
    # 2. Get ingredients (should be empty)
    print(f"\n2. Getting ingredients for product {product_id}...")
    ingredients_response = requests.get(f"{BASE_URL}/products/{product_id}/ingredients", headers=headers)
    
    if ingredients_response.status_code == 200:
        ingredients = ingredients_response.json()
        print(f"✅ Ingredients retrieved: {len(ingredients)} items")
        if len(ingredients) == 0:
            print("   (Product has no ingredients yet)")
    else:
        print(f"❌ Failed to get ingredients: {ingredients_response.status_code}")
    
    # 3. Check if warehouse has items
    print("\n3. Checking warehouse items...")
    warehouse_response = requests.get(f"{BASE_URL}/warehouse/", headers=headers)
    
    if warehouse_response.status_code == 200:
        warehouse_data = warehouse_response.json()
        items = warehouse_data.get("items", [])
        print(f"✅ Warehouse has {len(items)} items")
        
        if len(items) > 0:
            # Use first warehouse item for testing
            warehouse_item = items[0]
            test_ingredient["warehouse_item_id"] = warehouse_item["id"]
            print(f"   Using warehouse item: ID={warehouse_item['id']}, {warehouse_item['variety']} {warehouse_item['height_cm']}cm")
        else:
            print("⚠️  No warehouse items found. Cannot test ingredient linking.")
            return
    else:
        print(f"❌ Failed to get warehouse items: {warehouse_response.status_code}")
        return
    
    # 4. Add ingredient to product
    print(f"\n4. Adding ingredient to product {product_id}...")
    add_response = requests.post(
        f"{BASE_URL}/products/{product_id}/ingredients", 
        json=test_ingredient, 
        headers=headers
    )
    
    if add_response.status_code == 201:
        ingredient = add_response.json()
        ingredient_id = ingredient["id"]
        print(f"✅ Ingredient added: ID={ingredient_id}, Quantity={ingredient['quantity']}")
    else:
        print(f"❌ Failed to add ingredient: {add_response.status_code} - {add_response.text}")
        return
    
    # 5. Get ingredients again (should have 1)
    print(f"\n5. Getting ingredients again for product {product_id}...")
    ingredients_response = requests.get(f"{BASE_URL}/products/{product_id}/ingredients", headers=headers)
    
    if ingredients_response.status_code == 200:
        ingredients = ingredients_response.json()
        print(f"✅ Ingredients retrieved: {len(ingredients)} items")
        
        if len(ingredients) > 0:
            ing = ingredients[0]
            print(f"   - {ing['variety']} {ing['height_cm']}cm x{ing['quantity']} from {ing['supplier']}")
            print(f"     Available: {ing['available_qty']}, Price: {ing['price']} KZT")
    else:
        print(f"❌ Failed to get ingredients: {ingredients_response.status_code}")
    
    # 6. Update ingredient quantity
    print(f"\n6. Updating ingredient quantity...")
    update_response = requests.put(
        f"{BASE_URL}/products/{product_id}/ingredients/{ingredient_id}",
        json={"quantity": 10, "notes": "Увеличили количество"},
        headers=headers
    )
    
    if update_response.status_code == 200:
        updated = update_response.json()
        print(f"✅ Ingredient updated: Quantity={updated['quantity']}, Notes={updated['notes']}")
    else:
        print(f"❌ Failed to update ingredient: {update_response.status_code}")
    
    # 7. Remove ingredient
    print(f"\n7. Removing ingredient...")
    delete_response = requests.delete(
        f"{BASE_URL}/products/{product_id}/ingredients/{ingredient_id}",
        headers=headers
    )
    
    if delete_response.status_code == 200:
        print("✅ Ingredient removed successfully")
    else:
        print(f"❌ Failed to remove ingredient: {delete_response.status_code}")
    
    # Cleanup - delete test product
    print(f"\n8. Cleaning up - deleting test product...")
    cleanup_response = requests.delete(f"{BASE_URL}/products/{product_id}", headers=headers)
    if cleanup_response.status_code == 200:
        print("✅ Test product deleted")
    
    print("\n" + "="*50)
    print("Product-Warehouse linking test completed!")


if __name__ == "__main__":
    test_product_ingredients()