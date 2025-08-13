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
    <Card className="p-6 mt-8">
      <div className="space-y-5">
        <h3 className="text-xl md:text-lg">Сводка остатков</h3>
        
        <div className="space-y-4">
          {/* В наличии */}
          {summary.inStock.count > 0 && (
            <div className="flex items-center justify-between p-4 rounded-lg bg-background border">
              <div className="flex items-center gap-4">
                <div className="h-5 w-5 rounded-full bg-green-500"></div>
                <span className="text-base">В наличии ({summary.inStock.count})</span>
              </div>
              <span className="font-medium text-lg">{formatValue(summary.inStock.value)}</span>
            </div>
          )}

          {/* Нет в наличии */}
          {summary.outOfStock.count > 0 && (
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-4">
                <div className="h-5 w-5 rounded-full bg-muted-foreground"></div>
                <span className="text-base">Нет в наличии ({summary.outOfStock.count})</span>
              </div>
              <span className="font-medium text-muted-foreground text-lg">{formatValue(summary.outOfStock.value)}</span>
            </div>
          )}
        </div>

        {/* Общая сумма */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-lg">Общая стоимость остатков</span>
            <span className="font-medium text-2xl">{formatValue(summary.total)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}