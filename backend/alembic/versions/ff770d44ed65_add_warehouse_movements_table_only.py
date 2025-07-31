"""add warehouse movements table only

Revision ID: ff770d44ed65
Revises: 50489c800785
Create Date: 2025-07-31 13:20:42.683666

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ff770d44ed65'
down_revision: Union[str, None] = '50489c800785'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create warehouse_movements table
    op.create_table('warehouse_movements',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('warehouse_item_id', sa.Integer(), nullable=False),
        sa.Column('type', sa.Enum('IN', 'OUT', 'ADJUSTMENT', name='movementtype'), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('description', sa.String(), nullable=False),
        sa.Column('reference_type', sa.String(), nullable=True),
        sa.Column('reference_id', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('created_by', sa.String(), nullable=False),
        sa.Column('qty_before', sa.Integer(), nullable=False),
        sa.Column('qty_after', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['warehouse_item_id'], ['warehouse_items.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_warehouse_movements_created_at'), 'warehouse_movements', ['created_at'], unique=False)
    op.create_index(op.f('ix_warehouse_movements_id'), 'warehouse_movements', ['id'], unique=False)
    op.create_index(op.f('ix_warehouse_movements_type'), 'warehouse_movements', ['type'], unique=False)


def downgrade() -> None:
    # Drop warehouse_movements table
    op.drop_index(op.f('ix_warehouse_movements_type'), table_name='warehouse_movements')
    op.drop_index(op.f('ix_warehouse_movements_id'), table_name='warehouse_movements')
    op.drop_index(op.f('ix_warehouse_movements_created_at'), table_name='warehouse_movements')
    op.drop_table('warehouse_movements')
