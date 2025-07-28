#!/usr/bin/env python3
"""Import data from JSON to PostgreSQL database"""

import json
import os
from datetime import datetime
from pathlib import Path
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Import all models to ensure tables exist
from app.db.base import Base
from app.core.config import settings

def parse_datetime(date_str):
    """Parse datetime string to datetime object"""
    if not date_str:
        return None
    try:
        # Try ISO format first
        return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
    except:
        # Try other common formats
        for fmt in ['%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M:%S.%f']:
            try:
                return datetime.strptime(date_str, fmt)
            except:
                continue
    return None

def import_to_postgres():
    """Import data from JSON to PostgreSQL"""
    json_path = Path(__file__).parent / "sqlite_export.json"
    
    if not json_path.exists():
        print(f"Export file not found at {json_path}")
        print("Please run export_sqlite_data.py first")
        return
    
    # Load data
    with open(json_path, 'r') as f:
        data = json.load(f)
    
    # Create engine and session
    engine = create_engine(settings.DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # Create all tables if they don't exist
        Base.metadata.create_all(bind=engine)
        print("Tables created/verified")
        
        # Define the order of tables to respect foreign key constraints
        table_order = [
            'company_settings',
            'products',
            'customers',
            'customer_addresses',
            'customer_important_dates',
            'warehouse_items',
            'deliveries',
            'delivery_positions',
            'product_images',
            'orders',
            'order_items',
            'florist_tasks',
            'task_items'
        ]
        
        # Import data in order
        for table_name in table_order:
            if table_name not in data:
                print(f"Skipping {table_name} - not in export")
                continue
                
            rows = data[table_name]
            if not rows:
                print(f"Skipping {table_name} - no data")
                continue
            
            # Get column names from first row
            if rows:
                columns = list(rows[0].keys())
                
                # Prepare values for bulk insert
                for row in rows:
                    # Convert datetime strings
                    for col in columns:
                        if col in ['created_at', 'updated_at', 'delivery_date', 'reserved_at', 
                                  'written_off_at', 'task_date', 'date']:
                            row[col] = parse_datetime(row[col])
                        # Convert SQLite boolean (0/1) to PostgreSQL boolean (True/False)
                        elif col in ['is_active', 'is_popular', 'is_new', 'on_showcase', 
                                    'to_write_off', 'hidden', 'has_pre_delivery_photos', 
                                    'has_issue', 'is_reserved', 'is_written_off', 'is_primary',
                                    'is_paid', 'is_anniversary', 'is_other']:
                            if row[col] is not None:
                                row[col] = bool(row[col])
                    
                    # Build insert statement
                    cols_str = ', '.join(columns)
                    vals_str = ', '.join([f':{col}' for col in columns])
                    
                    # Use INSERT ... ON CONFLICT DO NOTHING to handle duplicates
                    insert_sql = text(f"""
                        INSERT INTO {table_name} ({cols_str})
                        VALUES ({vals_str})
                        ON CONFLICT (id) DO NOTHING
                    """)
                    
                    session.execute(insert_sql, row)
                
                session.commit()
                print(f"Imported {len(rows)} rows into {table_name}")
        
        # Update sequences for PostgreSQL
        print("\nUpdating sequences...")
        for table_name in table_order:
            if table_name in data and data[table_name]:
                try:
                    # Get max ID
                    max_id = max(row.get('id', 0) for row in data[table_name] if row.get('id'))
                    if max_id > 0:
                        # Update sequence
                        session.execute(text(f"""
                            SELECT setval('{table_name}_id_seq', :max_id, true)
                        """), {'max_id': max_id})
                except Exception as e:
                    print(f"Could not update sequence for {table_name}: {e}")
        
        session.commit()
        print("\nData import completed successfully!")
        
    except Exception as e:
        session.rollback()
        print(f"Error during import: {e}")
        raise
    finally:
        session.close()

if __name__ == "__main__":
    import_to_postgres()