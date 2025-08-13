import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Minus, Plus } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  quantity: number;
  price: number;
  category: string;
  minQuantity: number;
}

interface ProductCardProps {
  product: Product;
  onUpdateQuantity: (id: string, newQuantity: number) => void;
}

export function ProductCard({ product, onUpdateQuantity }: ProductCardProps) {
  const getCardClass = () => {
    if (product.quantity === 0) return 'border-muted bg-muted/30 opacity-60';
    return 'border-border hover:bg-muted/20';
  };

  const getStockBadge = () => {
    if (product.quantity === 0) {
      return <Badge className="bg-muted text-muted-foreground text-sm px-2 py-1">Нет</Badge>;
    }
    return null;
  };

  const getTextClass = () => {
    if (product.quantity === 0) return 'text-muted-foreground';
    return '';
  };

  return (
    <Card className={`p-5 md:p-4 transition-colors ${getCardClass()}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h3 className={`font-medium leading-tight text-base md:text-base ${getTextClass()}`}>
              {product.name}
            </h3>
            {getStockBadge()}
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-lg md:text-base font-medium ${getTextClass()}`}>₸{product.price}</span>
            <span className={`text-sm md:text-xs text-muted-foreground ${getTextClass()}`}>{product.category}</span>
          </div>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center justify-between">
          <span className={`text-base md:text-sm text-muted-foreground ${getTextClass()}`}>Количество</span>
          
          <div className="flex items-center gap-4 md:gap-3">
            <Button
              size="sm"
              variant="outline"
              className="h-11 w-11 md:h-9 md:w-9 p-0"
              onClick={() => onUpdateQuantity(product.id, Math.max(0, product.quantity - 1))}
              disabled={product.quantity === 0}
            >
              <Minus className="h-5 w-5 md:h-4 md:w-4" />
            </Button>
            
            <span className={`min-w-[3rem] md:min-w-[2rem] text-center font-medium text-xl md:text-lg ${getTextClass()}`}>
              {product.quantity}
            </span>
            
            <Button
              size="sm"
              className="h-11 w-11 md:h-9 md:w-9 p-0"
              onClick={() => onUpdateQuantity(product.id, product.quantity + 1)}
            >
              <Plus className="h-5 w-5 md:h-4 md:w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}