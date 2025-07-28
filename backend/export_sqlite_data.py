#!/usr/bin/env python3
"""Export data from SQLite database to JSON for migration to PostgreSQL"""

import json
import sqlite3
from datetime import datetime
from pathlib import Path

def datetime_handler(obj):
    """JSON serializer for datetime objects"""
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

def export_sqlite_data():
    """Export all data from SQLite database"""
    db_path = Path(__file__).parent / "flower_shop.db"
    
    if not db_path.exists():
        print(f"Database not found at {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Get all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row['name'] for row in cursor.fetchall()]
    
    # Export data from each table
    data = {}
    for table in tables:
        cursor.execute(f"SELECT * FROM {table}")
        rows = cursor.fetchall()
        data[table] = [dict(row) for row in rows]
        print(f"Exported {len(data[table])} rows from {table}")
    
    # Save to JSON
    output_path = Path(__file__).parent / "sqlite_export.json"
    with open(output_path, 'w') as f:
        json.dump(data, f, indent=2, default=datetime_handler)
    
    print(f"\nData exported to {output_path}")
    conn.close()

if __name__ == "__main__":
    export_sqlite_data()