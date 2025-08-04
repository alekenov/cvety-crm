"""add_shop_id_to_customers_and_products

Revision ID: 1eaaa5457342
Revises: add_comments_and_payment_fields
Create Date: 2025-08-01 17:53:17.290305

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1eaaa5457342'
down_revision: Union[str, None] = 'add_comments_and_payment_fields'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Check if columns exist before adding them
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    # Add shop_id to customers table
    customers_columns = [col['name'] for col in inspector.get_columns('customers')]
    if 'shop_id' not in customers_columns:
        op.add_column('customers', sa.Column('shop_id', sa.Integer(), nullable=False, server_default='1'))
        # Skip foreign key for SQLite
        # op.create_foreign_key(None, 'customers', 'shops', ['shop_id'], ['id'])
        
        # Update unique constraint - remove old and add new
        try:
            op.drop_constraint('_customer_phone_uc', 'customers', type_='unique')
        except:
            pass  # Constraint might not exist
        op.create_unique_constraint('_customer_phone_shop_uc', 'customers', ['phone', 'shop_id'])
    
    # Add shop_id to products table
    products_columns = [col['name'] for col in inspector.get_columns('products')]
    if 'shop_id' not in products_columns:
        op.add_column('products', sa.Column('shop_id', sa.Integer(), nullable=False, server_default='1'))
        # Skip foreign key for SQLite
        # op.create_foreign_key(None, 'products', 'shops', ['shop_id'], ['id'])


def downgrade() -> None:
    # Remove unique constraint
    try:
        op.drop_constraint('_customer_phone_shop_uc', 'customers', type_='unique')
    except:
        pass
    op.create_unique_constraint('_customer_phone_uc', 'customers', ['phone'])
    
    # Remove columns
    op.drop_column('products', 'shop_id')
    op.drop_column('customers', 'shop_id')