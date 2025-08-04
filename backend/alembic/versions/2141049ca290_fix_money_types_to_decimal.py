"""fix_money_types_to_decimal

Revision ID: 2141049ca290
Revises: 7003b649b672
Create Date: 2025-08-02 23:31:52.617846

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2141049ca290'
down_revision: Union[str, None] = '7003b649b672'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Check database type
    conn = op.get_bind()
    dialect_name = conn.dialect.name
    inspector = sa.inspect(conn)
    
    if dialect_name == 'postgresql':
        # PostgreSQL: Change FLOAT/DOUBLE PRECISION to DECIMAL
        
        # Fix orders table
        op.alter_column('orders', 'flower_sum',
                       type_=sa.Numeric(10, 2),
                       postgresql_using='flower_sum::numeric(10,2)')
        op.alter_column('orders', 'delivery_fee',
                       type_=sa.Numeric(10, 2),
                       postgresql_using='delivery_fee::numeric(10,2)')
        op.alter_column('orders', 'total',
                       type_=sa.Numeric(10, 2),
                       postgresql_using='total::numeric(10,2)')
        
        # Fix order_items table
        op.alter_column('order_items', 'price',
                       type_=sa.Numeric(10, 2),
                       postgresql_using='price::numeric(10,2)')
        op.alter_column('order_items', 'total',
                       type_=sa.Numeric(10, 2),
                       postgresql_using='total::numeric(10,2)')
        
        # Fix products table
        op.alter_column('products', 'cost_price',
                       type_=sa.Numeric(10, 2),
                       postgresql_using='cost_price::numeric(10,2)')
        op.alter_column('products', 'retail_price',
                       type_=sa.Numeric(10, 2),
                       postgresql_using='retail_price::numeric(10,2)')
        op.alter_column('products', 'sale_price',
                       type_=sa.Numeric(10, 2),
                       nullable=True,
                       postgresql_using='sale_price::numeric(10,2)')
        
        # Fix customers table
        op.alter_column('customers', 'total_spent',
                       type_=sa.Numeric(10, 2),
                       postgresql_using='total_spent::numeric(10,2)')
        
        # Fix warehouse_items table - check if columns exist
        warehouse_columns = [col['name'] for col in inspector.get_columns('warehouse_items')]
        
        if 'cost_price' in warehouse_columns:
            op.alter_column('warehouse_items', 'cost_price',
                           type_=sa.Numeric(10, 2),
                           nullable=True,
                           postgresql_using='cost_price::numeric(10,2)')
        elif 'cost' in warehouse_columns:
            # Railway has 'cost' instead of 'cost_price'
            op.alter_column('warehouse_items', 'cost',
                           type_=sa.Numeric(10, 2),
                           nullable=True,
                           postgresql_using='cost::numeric(10,2)')
            op.alter_column('warehouse_items', 'price',
                           type_=sa.Numeric(10, 2),
                           nullable=True,
                           postgresql_using='price::numeric(10,2)')
            op.alter_column('warehouse_items', 'recommended_price',
                           type_=sa.Numeric(10, 2),
                           nullable=True,
                           postgresql_using='recommended_price::numeric(10,2)')
        
        # Standardize phone columns to VARCHAR(20)
        op.alter_column('orders', 'customer_phone',
                       type_=sa.String(20))
        op.alter_column('orders', 'recipient_phone',
                       type_=sa.String(20))
        op.alter_column('orders', 'courier_phone',
                       type_=sa.String(20))
        
        op.alter_column('customers', 'phone',
                       type_=sa.String(20))
        
        op.alter_column('users', 'phone',
                       type_=sa.String(20))
        
        # Check if shops table has owner_phone column
        shops_columns = [col['name'] for col in inspector.get_columns('shops')]
        if 'owner_phone' in shops_columns:
            op.alter_column('shops', 'owner_phone',
                           type_=sa.String(20))
        elif 'phone' in shops_columns:
            # Railway has 'phone' instead of 'owner_phone'
            op.alter_column('shops', 'phone',
                           type_=sa.String(20))
    
    else:
        # SQLite doesn't support ALTER COLUMN, but we document the intended types
        # These will be applied when recreating tables
        print("SQLite detected. Money types should use DECIMAL(10,2) in new tables.")
        print("Phone fields should use VARCHAR(20) in new tables.")


def downgrade() -> None:
    # Revert to FLOAT types (not recommended)
    conn = op.get_bind()
    dialect_name = conn.dialect.name
    
    if dialect_name == 'postgresql':
        # Orders
        op.alter_column('orders', 'flower_sum', type_=sa.Float)
        op.alter_column('orders', 'delivery_fee', type_=sa.Float)
        op.alter_column('orders', 'total', type_=sa.Float)
        
        # Order items
        op.alter_column('order_items', 'price', type_=sa.Float)
        op.alter_column('order_items', 'total', type_=sa.Float)
        
        # Products
        op.alter_column('products', 'cost_price', type_=sa.Float)
        op.alter_column('products', 'retail_price', type_=sa.Float)
        op.alter_column('products', 'sale_price', type_=sa.Float)
        
        # Customers
        op.alter_column('customers', 'total_spent', type_=sa.Float)
        
        # Warehouse
        op.alter_column('warehouse_items', 'cost_price', type_=sa.Float)
        
        # Phone columns back to String (no length)
        op.alter_column('orders', 'customer_phone', type_=sa.String)
        op.alter_column('orders', 'recipient_phone', type_=sa.String)
        op.alter_column('orders', 'courier_phone', type_=sa.String)
        op.alter_column('customers', 'phone', type_=sa.String)
        op.alter_column('users', 'phone', type_=sa.String)
        op.alter_column('shops', 'owner_phone', type_=sa.String)
