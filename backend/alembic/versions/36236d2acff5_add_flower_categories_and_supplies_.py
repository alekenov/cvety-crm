"""add_flower_categories_and_supplies_tables

Revision ID: 36236d2acff5
Revises: 0c345ce07ccf
Create Date: 2025-07-31 11:16:51.095544

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '36236d2acff5'
down_revision: Union[str, None] = '0c345ce07ccf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create flower_categories table
    op.create_table('flower_categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('markup_percentage', sa.Float(), nullable=False),
        sa.Column('keywords', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    
    # Create supplies table
    op.create_table('supplies',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('supplier', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('total_cost', sa.Float(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('created_by', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create supply_items table
    op.create_table('supply_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('supply_id', sa.Integer(), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=True),
        sa.Column('flower_name', sa.String(), nullable=False),
        sa.Column('height_cm', sa.Integer(), nullable=False),
        sa.Column('purchase_price', sa.Float(), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('remaining_quantity', sa.Integer(), nullable=False),
        sa.Column('retail_price', sa.Float(), nullable=False),
        sa.Column('total_cost', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(['category_id'], ['flower_categories.id'], ),
        sa.ForeignKeyConstraint(['supply_id'], ['supplies.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index(op.f('ix_supply_items_flower_name'), 'supply_items', ['flower_name'], unique=False)
    
    # Insert default categories with Kazakhstan market markups
    op.execute("""
        INSERT INTO flower_categories (name, markup_percentage, keywords) VALUES
        ('Розы', 100, 'роза,роз,фридом,ред наоми,эксплорер,аваланж'),
        ('Хризантемы', 80, 'хризантема,хризантем'),
        ('Тюльпаны', 120, 'тюльпан'),
        ('Альстромерии', 90, 'альстромерия,альстромери'),
        ('Экзотика', 150, 'орхидея,стрелиция,антуриум,протея'),
        ('Зелень', 70, 'эвкалипт,рускус,папоротник,берграсс')
    """)


def downgrade() -> None:
    # Drop indexes
    op.drop_index(op.f('ix_supply_items_flower_name'), table_name='supply_items')
    
    # Drop tables in reverse order
    op.drop_table('supply_items')
    op.drop_table('supplies')
    op.drop_table('flower_categories')
