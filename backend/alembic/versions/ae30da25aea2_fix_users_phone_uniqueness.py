"""fix_users_phone_uniqueness

Revision ID: ae30da25aea2
Revises: 0fad4fe9421a
Create Date: 2025-08-06 14:40:10.455130

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ae30da25aea2'
down_revision: Union[str, None] = '0fad4fe9421a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Use batch mode for SQLite compatibility
    with op.batch_alter_table('users', schema=None) as batch_op:
        # Note: ix_users_phone doesn't exist in SQLite, only in PostgreSQL
        # So we just create the new constraint
        
        # Create a composite unique constraint on shop_id and phone
        batch_op.create_unique_constraint(
            'uq_users_shop_phone',
            ['shop_id', 'phone']
        )
    
    # Create a regular index on phone for performance
    op.create_index('ix_users_phone', 'users', ['phone'], unique=False)


def downgrade() -> None:
    # Use batch mode for SQLite compatibility
    with op.batch_alter_table('users', schema=None) as batch_op:
        # Remove the composite unique constraint
        batch_op.drop_constraint('uq_users_shop_phone', type_='unique')
    
    # Remove the non-unique index
    op.drop_index('ix_users_phone', table_name='users')
    
    # Recreate the unique index on phone
    op.create_index('ix_users_phone', 'users', ['phone'], unique=True)
