"""Add supply_item_id column to warehouse_items

Revision ID: 50f47e5f4b7b
Revises: c3faca8869d2
Create Date: 2025-07-31 13:54:52.006438

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '50f47e5f4b7b'
down_revision: Union[str, None] = 'c3faca8869d2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add supply_item_id foreign key column to warehouse_items
    op.add_column('warehouse_items', sa.Column('supply_item_id', sa.Integer(), nullable=True))
    op.create_foreign_key(None, 'warehouse_items', 'supply_items', ['supply_item_id'], ['id'])


def downgrade() -> None:
    # Remove supply_item_id foreign key column from warehouse_items
    op.drop_constraint(None, 'warehouse_items', type_='foreignkey')
    op.drop_column('warehouse_items', 'supply_item_id')
