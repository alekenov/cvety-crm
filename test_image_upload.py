#!/usr/bin/env python3
"""Test image upload functionality"""

import requests
import os
from io import BytesIO
from PIL import Image

BASE_URL = "http://localhost:8000/api"

# Create a test image
def create_test_image(filename="test_image.jpg", size=(100, 100), color=(255, 0, 0)):
    """Create a test image file"""
    img = Image.new('RGB', size, color)
    img_buffer = BytesIO()
    img.save(img_buffer, format='JPEG')
    img_buffer.seek(0)
    return img_buffer, filename


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


def test_image_upload():
    """Test image upload functionality"""
    
    # Get auth token
    token = get_auth_token()
    if not token:
        print("❌ Failed to get auth token")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print("Testing Image Upload Functionality\n" + "="*50)
    
    # 1. Test single image upload
    print("\n1. Testing single image upload...")
    img_buffer, filename = create_test_image("product1.jpg", color=(255, 0, 0))
    
    files = {'file': (filename, img_buffer, 'image/jpeg')}
    upload_response = requests.post(
        f"{BASE_URL}/upload/image", 
        files=files,
        headers=headers
    )
    
    if upload_response.status_code == 201:
        result = upload_response.json()
        print(f"✅ Single image uploaded successfully")
        print(f"   URL: {result['url']}")
        print(f"   Size: {result['size']} bytes")
        single_image_url = result['url']
    else:
        print(f"❌ Failed to upload single image: {upload_response.status_code} - {upload_response.text}")
        return
    
    # 2. Test multiple images upload
    print("\n2. Testing multiple images upload...")
    images = [
        create_test_image("product2.jpg", color=(0, 255, 0)),
        create_test_image("product3.jpg", color=(0, 0, 255)),
        create_test_image("product4.jpg", color=(255, 255, 0))
    ]
    
    files = [('files', (img[1], img[0], 'image/jpeg')) for img in images]
    upload_response = requests.post(
        f"{BASE_URL}/upload/images", 
        files=files,
        headers=headers
    )
    
    if upload_response.status_code == 201:
        result = upload_response.json()
        print(f"✅ Multiple images uploaded successfully")
        print(f"   Uploaded: {len(result['images'])} images")
        image_urls = [img['url'] for img in result['images']]
        for img in result['images']:
            print(f"   - {img['original_name']}: {img['url']} ({img['size']} bytes)")
    else:
        print(f"❌ Failed to upload multiple images: {upload_response.status_code} - {upload_response.text}")
        return
    
    # 3. Test accessing uploaded image
    print("\n3. Testing access to uploaded image...")
    # Remove /api prefix since static files are served from root
    static_url = single_image_url
    if static_url.startswith("/"):
        static_url = f"http://localhost:8000{static_url}"
    
    image_response = requests.get(static_url)
    if image_response.status_code == 200:
        print(f"✅ Uploaded image is accessible")
        print(f"   Content-Type: {image_response.headers.get('content-type')}")
        print(f"   Size: {len(image_response.content)} bytes")
    else:
        print(f"❌ Failed to access uploaded image: {image_response.status_code}")
    
    # 4. Create a product and attach images
    print("\n4. Creating product and attaching images...")
    product_data = {
        "name": "Test Product with Images",
        "category": "bouquet",
        "description": "Product for testing image upload",
        "cost_price": 3000,
        "retail_price": 8000,
        "is_active": True
    }
    
    create_response = requests.post(f"{BASE_URL}/products/", json=product_data, headers=headers)
    if create_response.status_code == 201:
        product = create_response.json()
        product_id = product["id"]
        print(f"✅ Product created: ID={product_id}")
    else:
        print(f"❌ Failed to create product: {create_response.status_code}")
        return
    
    # 5. Update product with uploaded images
    print(f"\n5. Updating product {product_id} with uploaded images...")
    all_image_urls = [single_image_url] + image_urls
    
    update_response = requests.put(
        f"{BASE_URL}/products/{product_id}/images",
        json=all_image_urls,
        headers=headers
    )
    
    if update_response.status_code == 200:
        updated_product = update_response.json()
        print(f"✅ Product images updated successfully")
        print(f"   Product has {len(updated_product.get('images', []))} images")
    else:
        print(f"❌ Failed to update product images: {update_response.status_code} - {update_response.text}")
    
    # 6. Test invalid file upload (wrong extension)
    print("\n6. Testing invalid file upload...")
    text_content = b"This is not an image"
    files = {'file': ('test.txt', text_content, 'text/plain')}
    
    invalid_response = requests.post(
        f"{BASE_URL}/upload/image",
        files=files,
        headers=headers
    )
    
    if invalid_response.status_code == 400:
        print("✅ Invalid file correctly rejected")
        print(f"   Error: {invalid_response.json()['detail']}")
    else:
        print(f"❌ Invalid file was not rejected: {invalid_response.status_code}")
    
    # Cleanup - delete test product
    print(f"\n7. Cleaning up - deleting test product...")
    cleanup_response = requests.delete(f"{BASE_URL}/products/{product_id}", headers=headers)
    if cleanup_response.status_code == 200:
        print("✅ Test product deleted")
    
    print("\n" + "="*50)
    print("Image upload test completed!")


if __name__ == "__main__":
    # Check if PIL is installed
    try:
        from PIL import Image
    except ImportError:
        print("Please install Pillow: pip install Pillow")
        exit(1)
    
    test_image_upload()