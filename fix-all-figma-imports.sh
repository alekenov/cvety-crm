#!/bin/bash

# Fix all versioned imports in Figma components
cd /Users/alekenov/projects/shadcn-test/src/pos-warehouse-figma

# Remove version numbers from all imports
find . -name "*.tsx" -o -name "*.ts" | while read file; do
  if [ -f "$file" ]; then
    # Remove version numbers from any package import
    sed -i '' 's/"\([^"@]*\)@[0-9.]*"/"\1"/g' "$file"
    sed -i '' "s/'\([^'@]*\)@[0-9.]*'/'\1'/g" "$file"
  fi
done

echo "Fixed all versioned imports in pos-warehouse-figma/"