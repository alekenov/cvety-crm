import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, Package, Plus, Trash2, ChevronDown } from 'lucide-react';

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

interface DeliveryItem {
  id: string;
  productId: string | null;
  productName: string;
  costPrice: number;
  quantity: number;
  category?: string;
}

interface DeliveryPageProps {
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
  onBack: () => void;
}

export function DeliveryPage({ products, onUpdateProducts, onBack }: DeliveryPageProps) {
  const [deliveryItems, setDeliveryItems] = useState<DeliveryItem[]>([
    { id: '1', productId: null, productName: '', costPrice: 0, quantity: 0 }
  ]);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const updateDeliveryItem = (id: string, updates: Partial<DeliveryItem>) => {
    setDeliveryItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, ...updates } : item
      )
    );
  };

  const addDeliveryItem = () => {
    const newItem: DeliveryItem = {
      id: Date.now().toString(),
      productId: null,
      productName: '',
      costPrice: 0,
      quantity: 0
    };
    setDeliveryItems(prev => [...prev, newItem]);
  };

  const removeDeliveryItem = (id: string) => {
    if (deliveryItems.length > 1) {
      setDeliveryItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleProductNameChange = (id: string, value: string) => {
    updateDeliveryItem(id, { productName: value, productId: null });
    
    if (value.length > 0) {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
      setActiveItemId(id);
    } else {
      setSuggestions([]);
      setActiveItemId(null);
    }
  };

  const selectProduct = (itemId: string, product: Product) => {
    updateDeliveryItem(itemId, {
      productId: product.id,
      productName: product.name,
      category: product.category,
      costPrice: product.costPrice || 0
    });
    setSuggestions([]);
    setActiveItemId(null);
    
    // Фокус на поле количества
    setTimeout(() => {
      const quantityInput = inputRefs.current[`quantity-${itemId}`];
      if (quantityInput) {
        quantityInput.focus();
        quantityInput.select();
      }
    }, 50);
  };

  const finishDelivery = () => {
    const currentDate = new Date().toISOString().split('T')[0];
    const validItems = deliveryItems.filter(item => 
      item.productName.trim().length > 0 && 
      item.quantity > 0 && 
      item.costPrice > 0
    );

    if (validItems.length === 0) return;

    let updatedProducts = [...products];
    const newProducts: Product[] = [];

    validItems.forEach(deliveryItem => {
      const existingProductIndex = updatedProducts.findIndex(p => p.id === deliveryItem.productId);
      
      if (existingProductIndex >= 0) {
        // Обновляем существующий товар
        const product = updatedProducts[existingProductIndex];
        const newHistoryEntry: ProductHistoryEntry = {
          id: `${product.id}-${Date.now()}`,
          date: currentDate,
          type: 'receipt',
          quantity: deliveryItem.quantity,
          description: 'Поставка товаров'
        };

        updatedProducts[existingProductIndex] = {
          ...product,
          quantity: product.quantity + deliveryItem.quantity,
          deliveryDate: currentDate,
          costPrice: deliveryItem.costPrice > 0 ? deliveryItem.costPrice : product.costPrice,
          history: [newHistoryEntry, ...(product.history || [])]
        };
      } else {
        // Создаем новый товар
        const newProduct: Product = {
          id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: deliveryItem.productName,
          quantity: deliveryItem.quantity,
          price: Math.round(deliveryItem.costPrice * 1.5), // Примерная наценка 50%
          category: deliveryItem.category || 'Разное',
          minQuantity: 5, // Значение по умолчанию
          deliveryDate: currentDate,
          costPrice: deliveryItem.costPrice,
          discount: 0,
          history: [{
            id: `new-${Date.now()}`,
            date: currentDate,
            type: 'receipt',
            quantity: deliveryItem.quantity,
            description: 'Поставка товаров (новый товар)'
          }]
        };
        newProducts.push(newProduct);
      }
    });
    
    onUpdateProducts([...updatedProducts, ...newProducts]);
    onBack();
  };

  const getTotalItems = () => {
    return deliveryItems.filter(item => 
      item.productName.trim().length > 0 && item.quantity > 0
    ).length;
  };

  const getTotalQuantity = () => {
    return deliveryItems
      .filter(item => item.productName.trim().length > 0 && item.quantity > 0)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  const isValidForSubmit = () => {
    return deliveryItems.some(item => 
      item.productName.trim().length > 0 && 
      item.quantity > 0 && 
      item.costPrice > 0
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent, itemId: string, field: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (field === 'productName' && suggestions.length > 0) {
        selectProduct(itemId, suggestions[0]);
        return;
      }
      
      const currentIndex = deliveryItems.findIndex(item => item.id === itemId);
      
      if (field === 'quantity' && currentIndex === deliveryItems.length - 1) {
        // Если это последняя строка, добавляем новую
        addDeliveryItem();
        // Фокус на новую строку
        setTimeout(() => {
          const newItemId = deliveryItems[deliveryItems.length - 1]?.id;
          if (newItemId) {
            const nextInput = inputRefs.current[`productName-${Date.now()}`];
            if (nextInput) {
              nextInput.focus();
            }
          }
        }, 50);
      } else if (currentIndex < deliveryItems.length - 1) {
        // Переходим к следующей строке
        const nextItem = deliveryItems[currentIndex + 1];
        const nextFieldName = field === 'productName' ? 'costPrice' : 
                            field === 'costPrice' ? 'quantity' : 'productName';
        const nextInput = inputRefs.current[`${nextFieldName}-${nextItem.id}`];
        if (nextInput) {
          nextInput.focus();
          if (nextFieldName !== 'productName') {
            nextInput.select();
          }
        }
      }
    }
  };

  // Закрытие подсказок при клике вне
  useEffect(() => {
    const handleClickOutside = () => {
      setSuggestions([]);
      setActiveItemId(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-10 w-10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Поставка товаров</h1>
          <p className="text-sm text-muted-foreground">
            Добавьте товары для поступления на склад
          </p>
        </div>
      </div>

      {/* Summary */}
      {getTotalItems() > 0 && (
        <Card className="mb-6 p-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span>Позиций: {getTotalItems()}</span>
            </div>
            <div>
              <span>Общее количество: {getTotalQuantity()} шт.</span>
            </div>
          </div>
        </Card>
      )}

      {/* Delivery Items */}
      <Card className="mb-6">
        <div className="p-4">
          <div className="space-y-4">
            {deliveryItems.map((item, index) => (
              <div key={item.id} className="relative">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  {/* Номер строки */}
                  <div className="md:col-span-1 flex items-center justify-center">
                    <Badge variant="secondary" className="text-xs">
                      {index + 1}
                    </Badge>
                  </div>

                  {/* Название товара */}
                  <div className="md:col-span-4 relative">
                    <label className="text-sm font-medium mb-1 block">
                      Название товара
                    </label>
                    <Input
                      ref={(el) => inputRefs.current[`productName-${item.id}`] = el}
                      placeholder="Начните вводить название..."
                      value={item.productName}
                      onChange={(e) => handleProductNameChange(item.id, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, item.id, 'productName')}
                      className="w-full"
                      onClick={(e) => e.stopPropagation()}
                    />
                    
                    {/* Подсказки */}
                    {activeItemId === item.id && suggestions.length > 0 && (
                      <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto">
                        <div className="p-2">
                          {suggestions.map(product => (
                            <div
                              key={product.id}
                              className="p-2 hover:bg-accent rounded cursor-pointer text-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                selectProduct(item.id, product);
                              }}
                            >
                              <div className="font-medium">{product.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {product.category} • Остаток: {product.quantity} шт.
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>

                  {/* Себестоимость */}
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium mb-1 block">
                      Себестоимость
                    </label>
                    <Input
                      ref={(el) => inputRefs.current[`costPrice-${item.id}`] = el}
                      type="number"
                      placeholder="0"
                      value={item.costPrice || ''}
                      onChange={(e) => updateDeliveryItem(item.id, { 
                        costPrice: parseFloat(e.target.value) || 0 
                      })}
                      onKeyDown={(e) => handleKeyDown(e, item.id, 'costPrice')}
                      className="w-full"
                    />
                  </div>

                  {/* Количество */}
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium mb-1 block">
                      Количество
                    </label>
                    <Input
                      ref={(el) => inputRefs.current[`quantity-${item.id}`] = el}
                      type="number"
                      placeholder="0"
                      value={item.quantity || ''}
                      onChange={(e) => updateDeliveryItem(item.id, { 
                        quantity: parseInt(e.target.value) || 0 
                      })}
                      onKeyDown={(e) => handleKeyDown(e, item.id, 'quantity')}
                      className="w-full"
                    />
                  </div>

                  {/* Сумма */}
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium mb-1 block">
                      Сумма
                    </label>
                    <div className="h-10 flex items-center px-3 bg-muted rounded-md text-sm">
                      {((item.costPrice || 0) * (item.quantity || 0)).toLocaleString('ru')} ₸
                    </div>
                  </div>

                  {/* Действия */}
                  <div className="md:col-span-1 flex gap-1">
                    {index === deliveryItems.length - 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={addDeliveryItem}
                        className="h-10 w-10"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                    {deliveryItems.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeDeliveryItem(item.id)}
                        className="h-10 w-10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Показать категорию если товар выбран */}
                {item.category && (
                  <div className="mt-2 ml-0 md:ml-20">
                    <Badge variant="outline" className="text-xs">
                      {item.category}
                    </Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {getTotalItems() > 0 && (
            <>Готово к поставке: {getTotalItems()} позиций, {getTotalQuantity()} шт.</>
          )}
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack}>
            Отмена
          </Button>
          <Button 
            onClick={finishDelivery}
            disabled={!isValidForSubmit()}
            className="gap-2"
          >
            <Check className="h-4 w-4" />
            Завершить поставку
          </Button>
        </div>
      </div>
    </div>
  );
}