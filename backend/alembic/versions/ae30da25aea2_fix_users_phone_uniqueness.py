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
    # Check if we're running on PostgreSQL
    connection = op.get_bind()
    
    # Check if constraint already exists in a more robust way
    constraint_exists = False
    if connection.dialect.name == 'postgresql':
        try:
            result = connection.execute(sa.text("""
                SELECT 1 
                FROM information_schema.table_constraints 
                WHERE constraint_name = 'uq_users_shop_phone' 
                AND table_name = 'users'
            """))
            constraint_exists = result.fetchone() is not None
        except Exception as e:
            print(f"Could not check constraint existence: {e}")
    
    if constraint_exists:
        print("Constraint 'uq_users_shop_phone' already exists, skipping creation")
        return
    
    # Check if index exists and remove it first if it's unique
    index_exists = False
    if connection.dialect.name == 'postgresql':
        try:
            result = connection.execute(sa.text("""
                SELECT 1 
                FROM pg_indexes 
                WHERE indexname = 'ix_users_phone' 
                AND tablename = 'users'
            """))
            index_exists = result.fetchone() is not None
        except Exception as e:
            print(f"Could not check index existence: {e}")
    
    # Drop existing unique index if it exists
    if index_exists:
        try:
            op.drop_index('ix_users_phone', table_name='users')
            print("Dropped existing index 'ix_users_phone'")
        except Exception as e:
            print(f"Could not drop existing index: {e}")
    
    # Use batch mode for SQLite compatibility
    try:
        with op.batch_alter_table('users', schema=None) as batch_op:
            # Create a composite unique constraint on shop_id and phone
            batch_op.create_unique_constraint(
                'uq_users_shop_phone',
                ['shop_id', 'phone']
            )
        print("Created constraint 'uq_users_shop_phone'")
    except Exception as e:
        print(f"Could not create constraint: {e}")
        raise
    
    # Create a regular index on phone for performance
    try:
        op.create_index('ix_users_phone', 'users', ['phone'], unique=False)
        print("Created index 'ix_users_phone'")
    except Exception as e:
        print(f"Could not create index: {e}")
        # Don't raise - this is not critical


def downgrade() -> None:
    # Use batch mode for SQLite compatibility
    with op.batch_alter_table('users', schema=None) as batch_op:
        # Remove the composite unique constraint
        batch_op.drop_constraint('uq_users_shop_phone', type_='unique')
    
    # Remove the non-unique index
    op.drop_index('ix_users_phone', table_name='users')
    
    # Recreate the unique index on phone
    op.create_index('ix_users_phone', 'users', ['phone'], unique=True)
