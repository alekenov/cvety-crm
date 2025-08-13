import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ArrowLeft, Check } from 'lucide-react';

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

interface InventoryItem extends Product {
  actualQuantity: number;
}

interface InventoryPageProps {
  products: Product[];
  onUpdateProducts?: (products: Product[]) => void;
  onBack: () => void;
  onProductSelect?: (productId: string) => void;
  onAdjustStock?: (productId: string, adjustment: number, reason: string) => void;
}

export function InventoryPage({ products, onUpdateProducts, onBack, onProductSelect, onAdjustStock }: InventoryPageProps) {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());

  // Инициализация инвентарных данных
  useEffect(() => {
    const items = products.map(product => ({
      ...product,
      actualQuantity: product.quantity
    }));
    setInventoryItems(items);
  }, [products]);

  const updateActualQuantity = (id: string, actualQuantity: number) => {
    setInventoryItems(prev =>
      prev.map(item =>
        item.id === id 
          ? { ...item, actualQuantity: Math.max(0, actualQuantity) }
          : item
      )
    );
  };

  const confirmItemInventory = (item: InventoryItem) => {
    if (item.actualQuantity !== item.quantity) {
      const adjustment = item.actualQuantity - item.quantity;
      if (onAdjustStock) {
        onAdjustStock(
          item.id, 
          adjustment, 
          `Инвентаризация: фактическое количество ${item.actualQuantity}, учетное ${item.quantity}`
        );
      }
    }
    setCompletedItems(prev => new Set(prev).add(item.id));
  };

  const finishInventory = () => {
    // Применяем все корректировки для незавершенных позиций
    inventoryItems.forEach(item => {
      if (!completedItems.has(item.id) && item.actualQuantity !== item.quantity) {
        const adjustment = item.actualQuantity - item.quantity;
        if (onAdjustStock) {
          onAdjustStock(
            item.id, 
            adjustment, 
            `Инвентаризация: фактическое количество ${item.actualQuantity}, учетное ${item.quantity}`
          );
        }
      }
    });
    
    onBack();
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="outline" size="sm" className="h-12 md:h-10 px-4 md:px-3 text-base">
            <ArrowLeft className="mr-2 h-5 w-5 md:h-4 md:w-4" />
            Назад
          </Button>
          <h1 className="text-2xl md:text-xl">Инвентаризация</h1>
        </div>
        <Button
          onClick={finishInventory}
          className="h-12 md:h-10 px-6 md:px-4 text-base"
        >
          <Check className="mr-2 h-5 w-5 md:h-4 md:w-4" />
          Закончить инвентаризацию
        </Button>
      </div>

      {/* Simple Inventory List */}
      <div className="space-y-4">
        {inventoryItems.map((item) => {
          const isCompleted = completedItems.has(item.id);
          const hasDifference = item.actualQuantity !== item.quantity;
          
          return (
            <div 
              key={item.id} 
              className={`flex items-center gap-4 p-5 bg-card rounded-lg border transition-all ${
                isCompleted ? 'opacity-60 border-green-500 bg-green-50 dark:bg-green-950' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <h3 className="text-base truncate">{item.name}</h3>
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-sm text-muted-foreground">{item.category}</p>
                  <p className="text-sm text-muted-foreground">
                    Учетное: <span className="font-medium">{item.quantity}</span>
                  </p>
                  {hasDifference && (
                    <p className={`text-sm font-medium ${
                      item.actualQuantity > item.quantity ? 'text-green-600' : 'text-red-600'
                    }`}>
                      Разница: {item.actualQuantity > item.quantity ? '+' : ''}{item.actualQuantity - item.quantity}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <label className="text-base text-muted-foreground min-w-[80px] text-right">
                  Факт:
                </label>
                <Input
                  type="number"
                  value={item.actualQuantity}
                  onChange={(e) => updateActualQuantity(item.id, Number(e.target.value))}
                  className="w-24 h-12 md:h-10 text-center text-lg"
                  min="0"
                  disabled={isCompleted}
                />
                <Button
                  variant={isCompleted ? "default" : "outline"}
                  size="sm"
                  onClick={() => confirmItemInventory(item)}
                  disabled={isCompleted}
                  className="h-12 md:h-10"
                >
                  {isCompleted ? (
                    <>
                      <Check className="h-4 w-4" />
                    </>
                  ) : (
                    'Подтвердить'
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Action */}
      <div className="mt-8 p-5 border-t bg-muted/20 -mx-4 md:-mx-6 sticky bottom-0">
        <div className="max-w-4xl mx-auto flex justify-center">
          <Button
            onClick={finishInventory}
            size="lg"
            className="h-14 md:h-12 px-8 md:px-6 text-base"
          >
            <Check className="mr-2 h-5 w-5 md:h-4 md:w-4" />
            Применить изменения
          </Button>
        </div>
      </div>
    </div>
  );
}