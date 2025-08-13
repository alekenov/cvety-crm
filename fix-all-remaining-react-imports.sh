#!/bin/bash

echo "Исправляем все оставшиеся React импорты..."

# Находим все файлы с проблемным паттерном
files=$(grep -r "import \* as React from \"react\"" src/ --include="*.tsx" -l)

if [ -z "$files" ]; then
    echo "✅ Нет файлов с проблемными импортами!"
    exit 0
fi

echo "Найдено файлов для исправления:"
echo "$files"
echo ""

for file in $files; do
    echo "Исправляем $file..."
    
    # Создаем резервную копию
    cp "$file" "$file.backup"
    
    # Заменяем import
    sed -i '' 's/import \* as React from "react"/import { createContext, useContext, useId, forwardRef, useState, useEffect } from "react"\nimport type { ComponentProps, ReactNode } from "react"/' "$file"
    
    # Заменяем все использования React.*
    sed -i '' 's/React\.ComponentProps/ComponentProps/g' "$file"
    sed -i '' 's/React\.ReactNode/ReactNode/g' "$file"
    sed -i '' 's/React\.forwardRef/forwardRef/g' "$file"
    sed -i '' 's/React\.createContext/createContext/g' "$file"
    sed -i '' 's/React\.useContext/useContext/g' "$file"
    sed -i '' 's/React\.useId/useId/g' "$file"
    sed -i '' 's/React\.useState/useState/g' "$file"
    sed -i '' 's/React\.useEffect/useEffect/g' "$file"
    
    echo "✅ $file исправлен (резервная копия: $file.backup)"
done

echo ""
echo "🎉 Исправление завершено! Всего файлов: $(echo "$files" | wc -l)"
echo ""
echo "Проверяем результат..."
remaining=$(grep -r "import \* as React from \"react\"" src/ --include="*.tsx" -l 2>/dev/null | wc -l)
echo "Оставшихся файлов с проблемными импортами: $remaining"

if [ "$remaining" -eq 0 ]; then
    echo "✅ Все импорты исправлены успешно!"
else
    echo "⚠️  Остались файлы с проблемными импортами, проверьте вручную"
fi