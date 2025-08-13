import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
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
      } else {
        // Переход к следующему полю или строке
        const currentIndex = deliveryItems.findIndex(item => item.id === itemId);
        if (field === 'quantity' && currentIndex === deliveryItems.length - 1) {
          addDeliveryItem();
        }
      }
    }
  };

  const setInputRef = (key: string, element: HTMLInputElement | null) => {
    inputRefs.current[key] = element;
  };

  // Автофокус на новые строки
  useEffect(() => {
    const lastItem = deliveryItems[deliveryItems.length - 1];
    if (lastItem && !lastItem.productName) {
      setTimeout(() => {
        const input = inputRefs.current[`name-${lastItem.id}`];
        if (input) {
          input.focus();
        }
      }, 50);
    }
  }, [deliveryItems.length]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-4">
        {/* Mobile Layout */}
        <div className="block md:hidden">
          <div className="flex items-center justify-between mb-3">
            <Button onClick={onBack} variant="outline" className="h-12 px-4 text-base rounded-xl">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад
            </Button>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">
                {getTotalItems()} товаров • {getTotalQuantity()} единиц
              </div>
            </div>
          </div>
          <h1 className="text-xl">Поставка товаров</h1>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex md:items-center md:gap-4">
          <Button onClick={onBack} variant="outline" className="h-10 px-3 text-base">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад
          </Button>
          <div>
            <h1 className="text-xl">Поставка товаров</h1>
            <p className="text-sm text-muted-foreground">
              {getTotalItems()} товаров • {getTotalQuantity()} единиц
            </p>
          </div>
        </div>
      </div>

      {/* Delivery Items */}
      <div className="space-y-2 relative">
        {deliveryItems.map((item, index) => (
          <Card key={item.id} className="p-3">
            <div className="space-y-3">
              {/* Row Header */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Позиция {index + 1}</span>
                {deliveryItems.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDeliveryItem(item.id)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Product Name Input with Autocomplete */}
              <div className="relative">
                <label className="text-sm text-muted-foreground mb-1 block">Товар</label>
                <div className="relative">
                  <Input
                    ref={(el) => setInputRef(`name-${item.id}`, el)}
                    type="text"
                    placeholder="Начните вводить название товара..."
                    value={item.productName}
                    onChange={(e) => handleProductNameChange(item.id, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, item.id, 'productName')}
                    className="h-10 text-base pr-8"
                  />
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  
                  {/* Suggestions Dropdown */}
                  {activeItemId === item.id && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {suggestions.map((product) => (
                        <div
                          key={product.id}
                          onClick={() => selectProduct(item.id, product)}
                          className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                        >
                          <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                              <p className="text-base truncate">{product.name}</p>
                              <p className="text-xs text-muted-foreground">{product.category}</p>
                            </div>
                            <div className="text-right ml-3">
                              <Badge variant="outline" className="text-xs px-2 py-0">
                                {product.quantity}
                              </Badge>
                              {product.costPrice && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  ₸{product.costPrice}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Selected Product Info */}
                {item.productName && (
                  <div className="mt-1">
                    {item.productId ? (
                      <Badge className="text-xs px-2 py-0 bg-green-50 text-green-700 border-green-200">
                        {item.category}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs px-2 py-0 border-blue-200 text-blue-700">
                        Новый товар
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Category for new products */}
              {!item.productId && item.productName && (
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Категория</label>
                  <Input
                    type="text"
                    placeholder="Введите категорию товара..."
                    value={item.category || ''}
                    onChange={(e) => updateDeliveryItem(item.id, { category: e.target.value })}
                    className="h-10 text-base"
                  />
                </div>
              )}

              {/* Cost Price and Quantity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">
                    Себестоимость <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">₸</span>
                    <Input
                      type="number"
                      placeholder="0"
                      value={item.costPrice || ''}
                      onChange={(e) => updateDeliveryItem(item.id, { costPrice: Number(e.target.value) || 0 })}
                      className={`h-10 text-base pl-6 ${item.costPrice === 0 ? 'border-red-200 focus:border-red-300' : ''}`}
                      min="0"
                      step="10"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">
                    Количество <span className="text-red-500">*</span>
                  </label>
                  <Input
                    ref={(el) => setInputRef(`quantity-${item.id}`, el)}
                    type="number"
                    placeholder="0"
                    value={item.quantity || ''}
                    onChange={(e) => updateDeliveryItem(item.id, { quantity: Number(e.target.value) || 0 })}
                    onKeyDown={(e) => handleKeyDown(e, item.id, 'quantity')}
                    className={`h-10 text-base text-center ${item.quantity === 0 ? 'border-red-200 focus:border-red-300' : ''}`}
                    min="0"
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}

        {/* Add New Item Button */}
        <Button
          onClick={addDeliveryItem}
          variant="outline"
          className="w-full h-10 text-base border-dashed"
        >
          <Plus className="mr-2 h-4 w-4" />
          Добавить товар
        </Button>
      </div>

      {/* Summary */}
      {isValidForSubmit() && (
        <Card className="mt-4 p-4 bg-muted/20 border-primary/20">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base">Сводка поставки</h3>
              <p className="text-sm text-muted-foreground">
                {getTotalItems()} наименований • {getTotalQuantity()} единиц товара
              </p>
            </div>
            <Package className="h-6 w-6 text-primary/60" />
          </div>
          
          {/* Items List */}
          <div className="space-y-2 mb-3">
            {deliveryItems
              .filter(item => item.productName.trim().length > 0 && item.quantity > 0)
              .map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-background rounded">
                  <div className="flex-1">
                    <span className="text-sm">{item.productName}</span>
                    <span className="text-xs text-muted-foreground ml-2">×{item.quantity}</span>
                    {!item.productId && (
                      <span className="text-xs text-blue-600 ml-2">(новый)</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-sm">₸{item.costPrice}</span>
                  </div>
                </div>
              ))}
          </div>
          
          <Button
            onClick={finishDelivery}
            size="lg"
            className="w-full h-16 text-lg rounded-xl"
          >
            <Check className="mr-3 h-6 w-6" />
            Принять поставку и обновить остатки
          </Button>
        </Card>
      )}

      {/* Click outside to close suggestions */}
      {activeItemId && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setActiveItemId(null);
            setSuggestions([]);
          }}
        />
      )}
    </div>
  );
}