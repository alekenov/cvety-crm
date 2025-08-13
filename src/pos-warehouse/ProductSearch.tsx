import React from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Search, X } from 'lucide-react';

interface ProductSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  categories: string[];
}

export function ProductSearch({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
}: ProductSearchProps) {
  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Поиск по названию..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-12 h-14 text-base"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 w-10 p-0"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryChange(null)}
          className="h-12 px-5 text-base"
        >
          Все
        </Button>
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => onCategoryChange(category)}
            className="h-12 px-5 text-base"
          >
            {category}
          </Button>
        ))}
      </div>
    </div>
  );
}