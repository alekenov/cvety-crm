#!/usr/bin/env python3
"""Add auth to remaining product endpoints"""

import re

filepath = "/Users/alekenov/projects/shadcn-test/backend/app/api/endpoints/products.py"

# Read file
with open(filepath, 'r') as f:
    content = f.read()

# Pattern to find route handlers without auth
pattern = r'(@router\.(post|get|put|patch|delete)\([^)]*\)\s*def\s+\w+\s*\([^)]*)\n(\s*)(db: Session = Depends\(deps\.get_db\))'

def add_auth(match):
    # Extract parts
    decorator_and_func = match.group(1)
    indent = match.group(3)
    db_line = match.group(4)
    
    # Check if already has auth
    if "get_current_shop" in match.group(0):
        return match.group(0)
    
    # Add auth line
    auth_line = f"{indent}_: Shop = Depends(deps.get_current_shop),  # Require auth"
    
    return f"{decorator_and_func}\n{indent}{db_line},\n{auth_line}"

# Apply replacements
new_content = re.sub(pattern, add_auth, content, flags=re.MULTILINE)

# Write back
with open(filepath, 'w') as f:
    f.write(new_content)

print("✅ Added auth to all endpoints in products.py")