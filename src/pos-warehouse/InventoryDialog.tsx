import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Check, X, AlertTriangle } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  quantity: number;
  price: number;
  category: string;
  minQuantity: number;
}

interface InventoryItem extends Product {
  actualQuantity: number;
  checked: boolean;
}

interface InventoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
}

export function InventoryDialog({ isOpen, onClose, products, onUpdateProducts }: InventoryDialogProps) {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Инициализация инвентарных данных
  useEffect(() => {
    if (isOpen) {
      const items = products.map(product => ({
        ...product,
        actualQuantity: product.quantity,
        checked: false
      }));
      setInventoryItems(items);
      setCurrentIndex(0);
    }
  }, [isOpen, products]);

  const updateActualQuantity = (id: string, actualQuantity: number) => {
    setInventoryItems(prev =>
      prev.map(item =>
        item.id === id 
          ? { ...item, actualQuantity: Math.max(0, actualQuantity), checked: true }
          : item
      )
    );
  };

  const moveToNext = () => {
    if (currentIndex < inventoryItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const moveToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const applyInventory = () => {
    const updatedProducts = inventoryItems.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.actualQuantity,
      price: item.price,
      category: item.category,
      minQuantity: item.minQuantity
    }));
    
    onUpdateProducts(updatedProducts);
    onClose();
  };

  const calculateDifferences = () => {
    const differences = inventoryItems.map(item => ({
      ...item,
      difference: item.actualQuantity - item.quantity
    }));
    
    const totalDifference = differences.reduce((sum, item) => sum + item.difference, 0);
    const checkedCount = differences.filter(item => item.checked).length;
    const withDifferences = differences.filter(item => item.difference !== 0).length;
    
    return { differences, totalDifference, checkedCount, withDifferences };
  };

  const { differences, totalDifference, checkedCount, withDifferences } = calculateDifferences();
  const currentItem = inventoryItems[currentIndex];

  if (!currentItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl md:text-xl">Инвентаризация</DialogTitle>
          <DialogDescription>
            Сверьте фактические остатки товаров с учетными данными и внесите корректировки при необходимости.
          </DialogDescription>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Проверено: {checkedCount} из {inventoryItems.length}</span>
            <span>Расхождений: {withDifferences}</span>
            {totalDifference !== 0 && (
              <Badge variant={totalDifference > 0 ? "default" : "secondary"} className="text-xs">
                {totalDifference > 0 ? '+' : ''}{totalDifference}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="flex flex-col md:flex-row h-full">
          {/* Текущий товар для проверки */}
          <div className="flex-1 p-6">
            <Card className="p-6 mb-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl md:text-lg font-medium mb-2">{currentItem.name}</h3>
                  <p className="text-sm text-muted-foreground">{currentItem.category}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Учетное количество:</span>
                    <p className="text-xl md:text-lg font-medium">{currentItem.quantity}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Цена за единицу:</span>
                    <p className="text-xl md:text-lg font-medium">₸{currentItem.price}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <label className="text-base font-medium">Фактическое количество:</label>
                  <Input
                    type="number"
                    value={currentItem.actualQuantity}
                    onChange={(e) => updateActualQuantity(currentItem.id, Number(e.target.value))}
                    className="h-16 md:h-12 text-2xl md:text-xl text-center font-medium"
                    autoFocus
                  />
                  
                  {currentItem.actualQuantity !== currentItem.quantity && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Расхождение: {currentItem.actualQuantity > currentItem.quantity ? '+' : ''}
                        {currentItem.actualQuantity - currentItem.quantity}
                      </span>
                    </div>
                  )}
                </div>

                {/* Навигация */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={moveToPrevious}
                    disabled={currentIndex === 0}
                    className="h-12 md:h-10 px-6 md:px-4"
                  >
                    Назад
                  </Button>
                  
                  <span className="text-sm text-muted-foreground">
                    {currentIndex + 1} из {inventoryItems.length}
                  </span>
                  
                  <Button
                    onClick={moveToNext}
                    disabled={currentIndex === inventoryItems.length - 1}
                    className="h-12 md:h-10 px-6 md:px-4"
                  >
                    Далее
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Список всех товаров */}
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l bg-muted/20">
            <div className="p-4">
              <h4 className="font-medium mb-4 text-base">Все товары</h4>
              <ScrollArea className="h-64 md:h-96">
                <div className="space-y-2">
                  {differences.map((item, index) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        index === currentIndex 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-background hover:bg-muted/50'
                      }`}
                      onClick={() => setCurrentIndex(index)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs">{item.quantity} → {item.actualQuantity}</span>
                            {item.checked && (
                              <Check className="h-3 w-3 text-green-500" />
                            )}
                          </div>
                        </div>
                        {item.difference !== 0 && (
                          <Badge 
                            variant={item.difference > 0 ? "default" : "secondary"}
                            className="text-xs ml-2"
                          >
                            {item.difference > 0 ? '+' : ''}{item.difference}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="p-6 pt-0 border-t">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="h-12 md:h-10 px-6 md:px-4"
            >
              <X className="mr-2 h-4 w-4" />
              Отмена
            </Button>
            
            <div className="text-sm text-muted-foreground">
              {checkedCount === inventoryItems.length ? (
                <span className="text-green-600">Все товары проверены</span>
              ) : (
                <span>Проверено {checkedCount} из {inventoryItems.length}</span>
              )}
            </div>
            
            <Button
              onClick={applyInventory}
              className="h-12 md:h-10 px-6 md:px-4"
              disabled={checkedCount === 0}
            >
              <Check className="mr-2 h-4 w-4" />
              Применить изменения
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}