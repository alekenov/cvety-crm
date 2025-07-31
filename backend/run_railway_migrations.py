#!/usr/bin/env python3
"""Run database migrations on Railway production"""

import os
import sys
import subprocess

# Get DATABASE_URL from Railway
result = subprocess.run(['railway', 'variables'], capture_output=True, text=True)
if result.returncode != 0:
    print("Error getting Railway variables")
    sys.exit(1)

# Extract DATABASE_URL
database_url = None
for line in result.stdout.split('\n'):
    if 'DATABASE_URL=' in line:
        database_url = line.split('=', 1)[1].strip()
        break

if not database_url:
    print("DATABASE_URL not found in Railway variables")
    sys.exit(1)

print(f"Found DATABASE_URL: {database_url[:50]}...")

# Set environment variable
os.environ['DATABASE_URL'] = database_url

# Change to backend directory
os.chdir('/Users/alekenov/projects/shadcn-test/backend')

# Run migrations
print("Running migrations...")
result = subprocess.run(['alembic', 'upgrade', 'head'], capture_output=True, text=True)

if result.returncode == 0:
    print("Migrations completed successfully!")
    print(result.stdout)
else:
    print("Migration failed!")
    print(result.stderr)
    sys.exit(1)