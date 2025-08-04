"""Add address_needs_clarification to orders

Revision ID: 7003b649b672
Revises: 1eaaa5457342
Create Date: 2025-08-01 18:11:14.520536

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7003b649b672'
down_revision: Union[str, None] = '1eaaa5457342'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add address_needs_clarification column to orders table
    op.add_column('orders', sa.Column('address_needs_clarification', sa.Boolean(), nullable=True, server_default='0'))


def downgrade() -> None:
    # Remove address_needs_clarification column from orders table
    op.drop_column('orders', 'address_needs_clarification')
