#!/usr/bin/env python3
"""Debug script to test order creation and show exact error"""

import requests
import json

# Test data
order_data = {
    "customer_phone": "+77018888888",
    "recipient_phone": "+77018888888",
    "recipient_name": "Тестовый Клиент",
    "address": "г. Алматы, ул. Абая 100, кв. 15",
    "delivery_method": "delivery",
    "delivery_fee": 1500,
    "delivery_window": {
        "from_time": "2025-08-05T15:00:00",
        "to_time": "2025-08-05T17:00:00"
    },
    "items": [
        {
            "product_id": 1,
            "quantity": 1,
            "price": 15000
        }
    ]
}

# Make request
url = "http://localhost:8000/api/orders/with-items"
headers = {
    "Content-Type": "application/json",
    "X-Shop-Phone": "+77007893838"
}

print("📤 Sending order data:")
print(json.dumps(order_data, indent=2))
print("\n" + "="*50 + "\n")

try:
    response = requests.post(url, json=order_data, headers=headers)
    
    print(f"📥 Response status: {response.status_code}")
    
    if response.status_code == 201:
        print("✅ Order created successfully!")
        print(json.dumps(response.json(), indent=2, default=str))
    else:
        print(f"❌ Error: {response.status_code}")
        print("Response text:", response.text)
        
        # Try to get JSON error details
        try:
            error_detail = response.json()
            print("\nError details:")
            print(json.dumps(error_detail, indent=2))
        except:
            pass
            
except Exception as e:
    print(f"❌ Request failed: {e}")