"""add comments and payment fields

Revision ID: add_comments_and_payment_fields
Revises: add_missing_order_columns
Create Date: 2025-08-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_comments_and_payment_fields'
down_revision = 'add_missing_order_columns'
branch_labels = None
depends_on = None


def upgrade():
    # Create comments table if not exists
    conn = op.get_bind()
    inspector = sa.engine.Inspector.from_engine(conn)
    
    if 'comments' not in inspector.get_table_names():
        op.create_table('comments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('order_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('text', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_comments_order_id'), 'comments', ['order_id'], unique=False)
    
    # Add payment fields to orders table
    columns = [col['name'] for col in inspector.get_columns('orders')]
    
    if 'payment_method' not in columns:
        op.add_column('orders', sa.Column('payment_method', sa.String(20), nullable=True))
    
    if 'payment_date' not in columns:
        op.add_column('orders', sa.Column('payment_date', sa.DateTime(), nullable=True))


def downgrade():
    # Remove payment fields from orders table
    op.drop_column('orders', 'payment_date')
    op.drop_column('orders', 'payment_method')
    
    # Drop the enum type
    op.execute('DROP TYPE IF EXISTS paymentmethod')
    
    # Drop comments table
    op.drop_index(op.f('ix_comments_order_id'), table_name='comments')
    op.drop_table('comments')