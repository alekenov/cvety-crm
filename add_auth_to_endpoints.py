#!/usr/bin/env python3
"""Add JWT auth check to all protected endpoints"""

import os
import re

# Endpoints that should be protected
PROTECTED_ENDPOINTS = [
    "orders.py",
    "customers.py", 
    "warehouse.py",
    "products.py",
    "production.py",
    "settings.py"
]

# Endpoints that should remain public
PUBLIC_ENDPOINTS = [
    "auth.py",
    "tracking.py",
    "telegram.py",
    "init_data.py"
]

def add_auth_to_file(filepath):
    """Add auth dependency to all route handlers in a file"""
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Check if already has auth imports
    if "get_current_shop" in content:
        print(f"✓ {os.path.basename(filepath)} already has auth")
        return False
    
    # Add Shop import if not present
    if "from app.models.shop import Shop" not in content:
        # Find the last import line
        import_lines = []
        lines = content.split('\n')
        last_import_idx = 0
        
        for i, line in enumerate(lines):
            if line.startswith('from ') or line.startswith('import '):
                last_import_idx = i
        
        # Insert new import after last import
        lines.insert(last_import_idx + 1, "from app.models.shop import Shop")
        content = '\n'.join(lines)
    
    # Pattern to find route decorators
    route_pattern = r'(@router\.(get|post|put|patch|delete)\([^)]*\)\s*\ndef\s+\w+\s*\([^)]*\)):'
    
    def add_auth_param(match):
        full_match = match.group(0)
        # Extract the function definition
        func_def = match.group(1)
        
        # Check if already has auth
        if "get_current_shop" in func_def:
            return full_match
        
        # Add auth parameter
        if "db: Session = Depends(deps.get_db)" in func_def:
            # Add after db parameter
            new_func_def = func_def.replace(
                "db: Session = Depends(deps.get_db)",
                "db: Session = Depends(deps.get_db),\n    _: Shop = Depends(deps.get_current_shop)"
            )
        else:
            # Add as first parameter
            if "):" in func_def:
                new_func_def = func_def.replace(
                    "):",
                    ",\n    _: Shop = Depends(deps.get_current_shop)):"
                )
            else:
                # Handle multiline function definitions
                new_func_def = func_def.rstrip() + ",\n    _: Shop = Depends(deps.get_current_shop)"
        
        return new_func_def + ":"
    
    # Apply auth to all routes
    new_content = re.sub(route_pattern, add_auth_param, content, flags=re.MULTILINE | re.DOTALL)
    
    # Write back
    with open(filepath, 'w') as f:
        f.write(new_content)
    
    print(f"✅ Added auth to {os.path.basename(filepath)}")
    return True

def main():
    endpoints_dir = "/Users/alekenov/projects/shadcn-test/backend/app/api/endpoints"
    
    print("Adding JWT authentication to protected endpoints...\n")
    
    for filename in PROTECTED_ENDPOINTS:
        filepath = os.path.join(endpoints_dir, filename)
        if os.path.exists(filepath):
            add_auth_to_file(filepath)
        else:
            print(f"❌ {filename} not found")
    
    print("\nPublic endpoints (no auth required):")
    for filename in PUBLIC_ENDPOINTS:
        print(f"  - {filename}")
    
    print("\n✅ Authentication setup complete!")
    print("\nNOTE: Since the models don't have shop_id field, auth only verifies")
    print("the token validity but doesn't filter data by shop yet.")

if __name__ == "__main__":
    main()