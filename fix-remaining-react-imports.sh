#!/bin/bash

# Файлы для исправления
files=(
  "src/components/ui/form.tsx"
  "src/components/ui/alert.tsx"
  "src/components/ui/textarea.tsx"
  "src/components/ui/checkbox.tsx"
  "src/components/ui/switch.tsx"
  "src/components/ui/badge.tsx"
  "src/components/ui/radio-group.tsx"
  "src/components/ui/progress.tsx"
  "src/components/ui/slider.tsx"
  "src/components/ui/separator.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Исправляем $file..."
    
    # Заменяем import * as React на нужные импорты
    sed -i '' 's/import \* as React from "react"/import { createContext, useContext, useId, forwardRef } from "react"\nimport type { ComponentProps } from "react"/' "$file"
    
    # Заменяем все вхождения React.*
    sed -i '' 's/React\.ComponentProps/ComponentProps/g' "$file"
    sed -i '' 's/React\.forwardRef/forwardRef/g' "$file" 
    sed -i '' 's/React\.createContext/createContext/g' "$file"
    sed -i '' 's/React\.useContext/useContext/g' "$file"
    sed -i '' 's/React\.useId/useId/g' "$file"
    
    echo "✅ $file исправлен"
  else
    echo "❌ $file не найден"
  fi
done

echo "Готово! Исправлено ${#files[@]} файлов."