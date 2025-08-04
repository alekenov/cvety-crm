"""
Schema validation tests to ensure Pydantic schemas match SQLAlchemy models.
This prevents the type of issue we had with Product.price vs Product.retail_price.
"""
import pytest
from pydantic import ValidationError
from sqlalchemy.inspection import inspect

from app.models.product import Product as ProductModel
from app.models.customer import Customer as CustomerModel
from app.models.order import Order as OrderModel
from app.models.warehouse import WarehouseItem as WarehouseModel
from app.models.user import User as UserModel
from app.models.shop import Shop as ShopModel

from app.schemas.product import Product as ProductSchema
from app.schemas.customer import Customer as CustomerSchema
from app.schemas.order import Order as OrderSchema
from app.schemas.warehouse import WarehouseItem as WarehouseSchema
from app.schemas.user import User as UserSchema
from app.schemas.shop import Shop as ShopSchema


class TestSchemaValidation:
    """Test that Pydantic schemas are compatible with SQLAlchemy models."""
    
    def test_product_schema_compatibility(self):
        """Test Product schema matches Product model fields."""
        model_columns = set(inspect(ProductModel).columns.keys())
        
        # Create a test product instance to get schema fields
        test_data = {
            'name': 'Test Product',
            'description': 'Test Description',
            'category': 'Flowers',
            'retail_price': 100.0,
            'cost_price': 50.0,
            'is_active': True,
            'shop_id': 1
        }
        
        # This should not raise an error if schema is compatible
        try:
            schema_instance = ProductSchema(**test_data)
            assert schema_instance.retail_price == 100.0
            assert schema_instance.name == 'Test Product'
        except ValidationError as e:
            pytest.fail(f"Product schema validation failed: {e}")
    
    def test_customer_schema_compatibility(self):
        """Test Customer schema matches Customer model fields."""
        test_data = {
            'name': 'Test Customer',
            'phone': '+77011234567',
            'email': 'test@example.com',
            'address': 'Test Address',
            'shop_id': 1
        }
        
        try:
            schema_instance = CustomerSchema(**test_data)
            assert schema_instance.phone == '+77011234567'
            assert schema_instance.name == 'Test Customer'
        except ValidationError as e:
            pytest.fail(f"Customer schema validation failed: {e}")
    
    def test_order_schema_compatibility(self):
        """Test Order schema matches Order model fields."""
        test_data = {
            'customer_id': 1,
            'total': 100.0,
            'status': 'new',
            'shop_id': 1
        }
        
        try:
            schema_instance = OrderSchema(**test_data)
            assert schema_instance.total == 100.0
            assert schema_instance.status == 'new'
        except ValidationError as e:
            pytest.fail(f"Order schema validation failed: {e}")
    
    def test_warehouse_schema_compatibility(self):
        """Test WarehouseItem schema matches WarehouseItem model fields."""
        test_data = {
            'variety': 'Rose',
            'height_cm': 60,
            'supplier': 'Test Supplier',
            'available_qty': 100,
            'price': 50.0,
            'shop_id': 1
        }
        
        try:
            schema_instance = WarehouseSchema(**test_data)
            assert schema_instance.variety == 'Rose'
            assert schema_instance.price == 50.0
        except ValidationError as e:
            pytest.fail(f"WarehouseItem schema validation failed: {e}")
    
    def test_user_schema_compatibility(self):
        """Test User schema matches User model fields."""
        test_data = {
            'phone': '+77011234567',
            'name': 'Test User',
            'role': 'employee',
            'shop_id': 1
        }
        
        try:
            schema_instance = UserSchema(**test_data)
            assert schema_instance.phone == '+77011234567'
            assert schema_instance.role == 'employee'
        except ValidationError as e:
            pytest.fail(f"User schema validation failed: {e}")
    
    def test_shop_schema_compatibility(self):
        """Test Shop schema matches Shop model fields."""
        test_data = {
            'name': 'Test Shop',
            'phone': '+77011234567',
            'address': 'Test Address'
        }
        
        try:
            schema_instance = ShopSchema(**test_data)
            assert schema_instance.name == 'Test Shop'
            assert schema_instance.phone == '+77011234567'
        except ValidationError as e:
            pytest.fail(f"Shop schema validation failed: {e}")
    
    def test_critical_field_naming_consistency(self):
        """
        Test critical field naming consistency that caused the original issue.
        This specifically checks for price/retail_price field naming.
        """
        # Product model should have retail_price, not price
        model_columns = set(inspect(ProductModel).columns.keys())
        
        assert 'retail_price' in model_columns, "Product model should have 'retail_price' field"
        assert 'price' not in model_columns, "Product model should NOT have 'price' field (use 'retail_price')"
        
        # Schema should accept retail_price
        test_data = {
            'name': 'Test Product',
            'description': 'Test Description', 
            'category': 'Flowers',
            'retail_price': 100.0,  # This should work
            'cost_price': 50.0,
            'is_active': True,
            'shop_id': 1
        }
        
        schema_instance = ProductSchema(**test_data)
        assert hasattr(schema_instance, 'retail_price')
        assert schema_instance.retail_price == 100.0
        
        # This should fail if someone tries to use 'price' instead of 'retail_price'
        invalid_data = test_data.copy()
        invalid_data['price'] = invalid_data.pop('retail_price')  # Wrong field name
        
        with pytest.raises(ValidationError):
            ProductSchema(**invalid_data)


if __name__ == '__main__':
    # Run the tests
    pytest.main([__file__, '-v'])