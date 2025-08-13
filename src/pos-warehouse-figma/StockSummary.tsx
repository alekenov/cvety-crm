import React from 'react';
import { Card } from './ui/card';

interface Product {
  id: string;
  name: string;
  quantity: number;
  price: number;
  category: string;
  minQuantity: number;
  deliveryDate: string;
  costPrice?: number;
  discount?: number;
  history?: ProductHistoryEntry[];
}

interface ProductHistoryEntry {
  id: string;
  date: string;
  type: 'receipt' | 'sale' | 'writeoff' | 'order' | 'adjustment';
  quantity: number;
  description: string;
  orderId?: string;
}

interface StockSummaryProps {
  products: Product[];
}

export function StockSummary({ products }: StockSummaryProps) {
  const summary = React.useMemo(() => {
    const inStock = products.filter(p => p.quantity > 0);
    const outOfStock = products.filter(p => p.quantity === 0);

    const inStockValue = inStock.reduce((sum, p) => sum + (p.quantity * p.price), 0);
    const outOfStockValue = outOfStock.reduce((sum, p) => sum + (p.minQuantity * p.price), 0);

    return {
      inStock: { count: inStock.length, value: inStockValue },
      outOfStock: { count: outOfStock.length, value: outOfStockValue },
      total: inStockValue + outOfStockValue
    };
  }, [products]);

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `₸${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `₸${(value / 1000).toFixed(0)}K`;
    } else {
      return `₸${value}`;
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h3>Сводка остатков</h3>
        
        <div className="space-y-3">
          {/* В наличии */}
          {summary.inStock.count > 0 && (
            <div className="flex items-center justify-between p-4 rounded-lg bg-background border">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full bg-primary"></div>
                <span>В наличии ({summary.inStock.count})</span>
              </div>
              <span>{formatValue(summary.inStock.value)}</span>
            </div>
          )}

          {/* Нет в наличии */}
          {summary.outOfStock.count > 0 && (
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full bg-muted-foreground"></div>
                <span>Нет в наличии ({summary.outOfStock.count})</span>
              </div>
              <span className="text-muted-foreground">{formatValue(summary.outOfStock.value)}</span>
            </div>
          )}
        </div>

        {/* Общая сумма */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span>Общая стоимость остатков</span>
            <span className="text-xl">{formatValue(summary.total)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}