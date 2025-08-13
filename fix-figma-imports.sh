#!/bin/bash

# Fix all versioned imports in Figma UI components
cd /Users/alekenov/projects/shadcn-test/src/pos-warehouse-figma/ui

# Remove version numbers from all @radix-ui imports
for file in *.tsx; do
  if [ -f "$file" ]; then
    sed -i '' 's/@radix-ui\/\([^@"]*\)@[0-9.]*/@radix-ui\/\1/g' "$file"
  fi
done

echo "Fixed all @radix-ui imports in pos-warehouse-figma/ui/"