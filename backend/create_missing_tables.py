#!/usr/bin/env python3
"""
Create missing tables in the database.
This script is idempotent - safe to run multiple times.
"""

import logging
from sqlalchemy import inspect, text
from app.db.session import get_engine, SessionLocal
from app.db.base import Base
from app.core.config import get_settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_missing_tables():
    """Create any missing tables in the database"""
    engine = get_engine()
    settings = get_settings()
    
    # Get inspector to check existing tables
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    
    logger.info(f"Database: {settings.DATABASE_URL[:50]}...")
    logger.info(f"Existing tables: {existing_tables}")
    
    # Get all tables that should exist
    all_tables = Base.metadata.tables.keys()
    logger.info(f"Expected tables: {list(all_tables)}")
    
    # Find missing tables
    missing_tables = set(all_tables) - set(existing_tables)
    
    if missing_tables:
        logger.info(f"Missing tables: {missing_tables}")
        logger.info("Creating missing tables...")
        
        # Create only missing tables
        for table_name in missing_tables:
            table = Base.metadata.tables[table_name]
            table.create(engine, checkfirst=True)
            logger.info(f"Created table: {table_name}")
    else:
        logger.info("All tables already exist")
    
    # Special handling for PostgreSQL to ensure proper column types
    if "postgresql" in settings.DATABASE_URL:
        with engine.connect() as conn:
            # Check if is_primary column exists in customer_addresses
            result = conn.execute(text("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'customer_addresses' 
                AND column_name = 'is_primary'
            """))
            
            if not result.fetchone():
                logger.info("Adding is_primary column to customer_addresses table")
                try:
                    conn.execute(text("""
                        ALTER TABLE customer_addresses 
                        ADD COLUMN is_primary INTEGER DEFAULT 0
                    """))
                    conn.commit()
                    logger.info("Added is_primary column successfully")
                except Exception as e:
                    logger.warning(f"Could not add is_primary column: {e}")
    
    # Verify all tables were created
    inspector = inspect(engine)
    final_tables = inspector.get_table_names()
    logger.info(f"Final tables in database: {final_tables}")
    
    still_missing = set(all_tables) - set(final_tables)
    if still_missing:
        logger.error(f"Failed to create tables: {still_missing}")
        return False
    
    logger.info("✅ All tables verified successfully")
    return True


def verify_table_structure():
    """Verify that critical tables have the correct structure"""
    engine = get_engine()
    inspector = inspect(engine)
    
    # Check customer_addresses table
    if 'customer_addresses' in inspector.get_table_names():
        columns = [col['name'] for col in inspector.get_columns('customer_addresses')]
        logger.info(f"customer_addresses columns: {columns}")
        
        required_columns = ['id', 'customer_id', 'address', 'label', 'is_primary', 
                          'usage_count', 'last_used_at', 'created_at']
        missing_columns = set(required_columns) - set(columns)
        if missing_columns:
            logger.warning(f"Missing columns in customer_addresses: {missing_columns}")
    
    # Check customer_important_dates table
    if 'customer_important_dates' in inspector.get_table_names():
        columns = [col['name'] for col in inspector.get_columns('customer_important_dates')]
        logger.info(f"customer_important_dates columns: {columns}")
        
        required_columns = ['id', 'customer_id', 'date', 'description', 
                          'remind_days_before', 'last_reminded_year', 'created_at']
        missing_columns = set(required_columns) - set(columns)
        if missing_columns:
            logger.warning(f"Missing columns in customer_important_dates: {missing_columns}")


if __name__ == "__main__":
    logger.info("Starting table creation/verification...")
    
    try:
        success = create_missing_tables()
        if success:
            verify_table_structure()
            logger.info("✅ Database setup completed successfully")
        else:
            logger.error("❌ Database setup failed")
            exit(1)
    except Exception as e:
        logger.error(f"❌ Error during database setup: {e}")
        exit(1)