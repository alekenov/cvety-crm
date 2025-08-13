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
  onUpdateProducts: (products: Product[]) => void;
  onBack: () => void;
}

export function InventoryPage({ products, onUpdateProducts, onBack }: InventoryPageProps) {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

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

  const finishInventory = () => {
    const updatedProducts = inventoryItems.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.actualQuantity,
      price: item.price,
      category: item.category,
      minQuantity: item.minQuantity,
      deliveryDate: item.deliveryDate,
      costPrice: item.costPrice,
      discount: item.discount,
      history: item.history
    }));
    
    onUpdateProducts(updatedProducts);
    onBack();
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        {/* Mobile Layout */}
        <div className="block md:hidden">
          <div className="flex items-center justify-between mb-3">
            <Button onClick={onBack} variant="outline" className="h-12 px-4 rounded-xl">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад
            </Button>
          </div>
          <h1>Инвентаризация</h1>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex md:items-center md:gap-4">
          <Button onClick={onBack} variant="outline" className="h-10 px-3">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад
          </Button>
          <h1>Инвентаризация</h1>
        </div>
      </div>

      {/* Simple Inventory List */}
      <div className="space-y-3">
        {inventoryItems.map((item) => (
          <div key={item.id} className="flex items-center gap-4 p-4 bg-card rounded-lg border">
            <div className="flex-1 min-w-0">
              <h3 className="truncate">{item.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{item.category}</p>
            </div>
            
            <div className="flex items-center gap-3">
              <label className="text-sm text-muted-foreground min-w-[80px] text-right">
                Остаток:
              </label>
              <Input
                type="number"
                value={item.actualQuantity}
                onChange={(e) => updateActualQuantity(item.id, Number(e.target.value))}
                className="w-24 h-12 md:h-10 text-center"
                min="0"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Action */}
      <div className="mt-6 p-4 border-t bg-muted/20 -mx-4 md:-mx-6 sticky bottom-0">
        <div className="max-w-4xl mx-auto flex justify-center">
          <Button
            onClick={finishInventory}
            size="lg"
            className="h-14 md:h-12 px-8 md:px-6 rounded-xl"
          >
            <Check className="mr-2 h-5 w-5 md:h-4 md:w-4" />
            Применить изменения
          </Button>
        </div>
      </div>
    </div>
  );
}