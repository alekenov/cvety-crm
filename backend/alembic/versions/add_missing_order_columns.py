"""Add missing order-related columns

Revision ID: add_missing_order_columns
Revises: 9e14c68966fa
Create Date: 2025-01-31 20:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_missing_order_columns'
down_revision = '1cb156b39497'
branch_labels = None
depends_on = None


def upgrade():
    # Add missing columns to orders table if they don't exist
    conn = op.get_bind()
    inspector = sa.engine.Inspector.from_engine(conn)
    columns = [col['name'] for col in inspector.get_columns('orders')]
    
    if 'assigned_florist_id' not in columns:
        op.add_column('orders', sa.Column('assigned_florist_id', sa.Integer(), nullable=True))
        # Skip foreign key for SQLite
    
    if 'courier_id' not in columns:
        op.add_column('orders', sa.Column('courier_id', sa.Integer(), nullable=True))
        # Skip foreign key for SQLite
    
    if 'courier_phone' not in columns:
        op.add_column('orders', sa.Column('courier_phone', sa.String(), nullable=True))
    
    if 'shop_id' not in columns:
        op.add_column('orders', sa.Column('shop_id', sa.Integer(), nullable=False, server_default='1'))
        # Skip foreign key for SQLite
    
    # Add missing columns to customers table if they don't exist
    customer_columns = [col['name'] for col in inspector.get_columns('customers')]
    
    if 'shop_id' not in customer_columns:
        op.add_column('customers', sa.Column('shop_id', sa.Integer(), nullable=False, server_default='1'))
        # Skip foreign key for SQLite
    
    if 'orders_count' not in customer_columns:
        op.add_column('customers', sa.Column('orders_count', sa.Integer(), nullable=False, server_default='0'))
    
    if 'total_spent' not in customer_columns:
        op.add_column('customers', sa.Column('total_spent', sa.Float(), nullable=False, server_default='0'))
    
    # Add missing columns to order_items table if they don't exist
    order_items_columns = [col['name'] for col in inspector.get_columns('order_items')]
    
    if 'product_name' not in order_items_columns:
        op.add_column('order_items', sa.Column('product_name', sa.String(255), nullable=True))
    
    if 'product_category' not in order_items_columns:
        op.add_column('order_items', sa.Column('product_category', sa.String(50), nullable=True))
    
    # Add missing columns to products table if they don't exist
    product_columns = [col['name'] for col in inspector.get_columns('products')]
    
    if 'shop_id' not in product_columns:
        op.add_column('products', sa.Column('shop_id', sa.Integer(), nullable=False, server_default='1'))
        # Skip foreign key for SQLite
    
    # Add missing columns to users table if they don't exist
    user_columns = [col['name'] for col in inspector.get_columns('users')]
    
    if 'shop_id' not in user_columns:
        op.add_column('users', sa.Column('shop_id', sa.Integer(), nullable=False, server_default='1'))
        # Skip foreign key for SQLite
    
    # Check if we need to create order_history table
    if 'order_history' not in inspector.get_table_names():
        op.create_table('order_history',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('order_id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=True),
            sa.Column('event_type', sa.String(50), nullable=False),
            sa.Column('old_status', sa.String(20), nullable=True),
            sa.Column('new_status', sa.String(20), nullable=True),
            sa.Column('comment', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_order_history_created_at'), 'order_history', ['created_at'], unique=False)
        op.create_index(op.f('ix_order_history_order_id'), 'order_history', ['order_id'], unique=False)


def downgrade():
    # Drop added columns
    op.drop_column('orders', 'assigned_florist_id')
    op.drop_column('orders', 'courier_id')
    op.drop_column('orders', 'shop_id')
    op.drop_column('customers', 'shop_id')
    op.drop_column('customers', 'orders_count')
    op.drop_column('customers', 'total_spent')
    op.drop_column('order_items', 'product_name')
    op.drop_column('order_items', 'product_category')
    op.drop_column('products', 'shop_id')
    op.drop_column('users', 'shop_id')
    op.drop_table('order_history')