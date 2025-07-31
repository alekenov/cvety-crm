#!/usr/bin/env python3
"""Simple script to add auth to endpoints"""

import os

# Files to update
files_to_update = {
    "/Users/alekenov/projects/shadcn-test/backend/app/api/endpoints/warehouse.py": [
        ("@router.get(\"/\")", "    db: Session = Depends(deps.get_db),"),
        ("@router.post(\"/\"", "    db: Session = Depends(deps.get_db),"),
        ("@router.get(\"/{item_id}\"", "    db: Session = Depends(deps.get_db)"),
        ("@router.patch(\"/{item_id}\"", "    db: Session = Depends(deps.get_db),"),
    ],
    "/Users/alekenov/projects/shadcn-test/backend/app/api/endpoints/products.py": [
        ("@router.get(\"/\"", "    db: Session = Depends(deps.get_db),"),
        ("@router.post(\"/\"", "    db: Session = Depends(deps.get_db),"),
        ("@router.get(\"/{id}\"", "    db: Session = Depends(deps.get_db),"),
        ("@router.put(\"/{id}\"", "    db: Session = Depends(deps.get_db),"),
    ],
    "/Users/alekenov/projects/shadcn-test/backend/app/api/endpoints/production.py": [
        ("@router.get(\"/tasks/\")", "    db: Session = Depends(deps.get_db),"),
        ("@router.post(\"/tasks/\"", "    db: Session = Depends(deps.get_db),"),
    ],
    "/Users/alekenov/projects/shadcn-test/backend/app/api/endpoints/settings.py": [
        ("@router.get(\"/\"", "    db: Session = Depends(deps.get_db)"),
        ("@router.patch(\"/\"", "    db: Session = Depends(deps.get_db),"),
    ]
}

def add_auth_to_file(filepath, markers):
    """Add auth check after specific markers"""
    
    # Read file
    with open(filepath, 'r') as f:
        lines = f.readlines()
    
    # Check if already has auth
    file_content = ''.join(lines)
    if "get_current_shop" in file_content:
        print(f"✓ {os.path.basename(filepath)} already has auth")
        return
    
    # Add import if needed
    if "from app.models.shop import Shop" not in file_content:
        # Find last import
        last_import_idx = 0
        for i, line in enumerate(lines):
            if line.startswith('from ') or line.startswith('import '):
                last_import_idx = i
        
        lines.insert(last_import_idx + 1, "from app.models.shop import Shop\n")
    
    # Add auth dependency after db dependency
    modified = False
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Check if this is a line we should modify
        for marker, db_line in markers:
            if marker in line:
                # Find the db dependency line
                j = i + 1
                while j < len(lines) and j < i + 10:  # Look ahead up to 10 lines
                    if db_line in lines[j]:
                        # Add auth dependency after db line
                        auth_line = lines[j].replace("db: Session", "_: Shop").replace("deps.get_db", "deps.get_current_shop")
                        lines.insert(j + 1, auth_line)
                        modified = True
                        i = j + 1
                        break
                    j += 1
                break
        i += 1
    
    if modified:
        # Write back
        with open(filepath, 'w') as f:
            f.writelines(lines)
        print(f"✅ Added auth to {os.path.basename(filepath)}")
    else:
        print(f"⚠️  Could not add auth to {os.path.basename(filepath)}")

def main():
    print("Adding JWT authentication to endpoints...\n")
    
    for filepath, markers in files_to_update.items():
        if os.path.exists(filepath):
            add_auth_to_file(filepath, markers)
        else:
            print(f"❌ {filepath} not found")
    
    print("\n✅ Done!")

if __name__ == "__main__":
    main()