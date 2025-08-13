import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Minus, Plus, Edit2, Check, X } from 'lucide-react';

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

interface MobileProductListProps {
  products: Product[];
  onUpdateQuantity: (id: string, newQuantity: number) => void;
  onUpdateProduct?: (id: string, updates: Partial<Product>) => void;
  onShowProductDetail?: (productId: string) => void;
}

export function MobileProductList({ products, onUpdateQuantity, onUpdateProduct, onShowProductDetail }: MobileProductListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Product>>({});

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditValues({
      name: product.name,
      price: product.price,
      minQuantity: product.minQuantity
    });
  };

  const saveEdit = () => {
    if (editingId && onUpdateProduct) {
      onUpdateProduct(editingId, editValues);
    }
    setEditingId(null);
    setEditValues({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const getCardClass = (product: Product) => {
    if (product.quantity === 0) return 'border-muted bg-muted/30 opacity-60';
    return 'border-border';
  };

  const getStockBadge = (product: Product) => {
    if (product.quantity === 0) {
      return <Badge className="bg-muted text-muted-foreground text-base px-3 py-1">Нет</Badge>;
    }
    return null;
  };

  const getTextClass = (product: Product) => {
    if (product.quantity === 0) return 'text-muted-foreground';
    return '';
  };

  return (
    <div className="space-y-5">
      {products.map((product) => (
        <Card key={product.id} className={`p-6 ${getCardClass(product)}`}>
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                {editingId === product.id ? (
                  <Input
                    value={editValues.name || ''}
                    onChange={(e) => setEditValues(prev => ({ ...prev, name: e.target.value }))}
                    className="h-12 text-base"
                  />
                ) : (
                  <div 
                    className="cursor-pointer"
                    onClick={() => onShowProductDetail?.(product.id)}
                  >
                    <h3 className={`text-base leading-tight hover:text-primary transition-colors ${getTextClass(product)}`}>
                      {product.name}
                    </h3>
                    <p className={`text-sm text-muted-foreground mt-2 ${getTextClass(product)}`}>{product.category}</p>
                    <p className={`text-sm text-muted-foreground mt-1 ${getTextClass(product)}`}>
                      Поставка: {new Date(product.deliveryDate).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}
                    </p>
                    {product.discount && product.discount > 0 && (
                      <p className="text-sm text-green-600 mt-1">Скидка {product.discount}%</p>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-4 ml-4">
                {getStockBadge(product)}
                {editingId === product.id ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-11 w-11 p-0"
                      onClick={saveEdit}
                    >
                      <Check className="h-5 w-5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-11 w-11 p-0"
                      onClick={cancelEdit}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-11 w-11 p-0"
                    onClick={() => startEdit(product)}
                  >
                    <Edit2 className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Price and Quantity Controls */}
            <div className="flex items-center justify-between">
              {editingId === product.id ? (
                <div className="flex items-center gap-3">
                  <span className="text-base">₸</span>
                  <Input
                    type="number"
                    value={editValues.price || ''}
                    onChange={(e) => setEditValues(prev => ({ ...prev, price: Number(e.target.value) }))}
                    className="h-11 w-28 text-base"
                  />
                </div>
              ) : (
                <span className={`text-lg ${getTextClass(product)}`}>₸{product.price}</span>
              )}
              
              <div className="flex items-center gap-4">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-12 w-12 p-0"
                  onClick={() => onUpdateQuantity(product.id, Math.max(0, product.quantity - 1))}
                  disabled={product.quantity === 0}
                >
                  <Minus className="h-5 w-5" />
                </Button>
                
                <span className={`min-w-[3.5rem] text-center text-xl ${getTextClass(product)}`}>
                  {product.quantity}
                </span>
                
                <Button
                  size="sm"
                  className="h-12 w-12 p-0"
                  onClick={() => onUpdateQuantity(product.id, product.quantity + 1)}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}