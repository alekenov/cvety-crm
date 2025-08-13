import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MobileProductList } from './MobileProductList';
import { QuickAdjustmentDialog } from './QuickAdjustmentDialog';
import { Minus, Plus, ArrowUpDown, Edit2, Check, X, Settings2 } from 'lucide-react';

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

interface ProductTableProps {
  products: Product[];
  isLoading?: boolean;
  onUpdateQuantity: (id: string, newQuantity: number) => void;
  onUpdateProduct?: (id: string, updates: Partial<Product>) => void;
  onShowProductDetail?: (productId: string) => void;
  onProductClick?: (productId: string) => void;
  onQuickAdjust?: (productId: string, adjustment: number, reason: string) => void;
}

type SortField = 'name' | 'quantity' | 'price';
type SortDirection = 'asc' | 'desc';

export function ProductTable({ products, onUpdateQuantity, onUpdateProduct, onShowProductDetail, onQuickAdjust }: ProductTableProps) {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Product>>({});
  const [adjustmentProduct, setAdjustmentProduct] = useState<Product | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedProducts = [...products].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = (bValue as string).toLowerCase();
    }
    
    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

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

  const getRowClass = (product: Product) => {
    if (product.quantity === 0) return 'bg-muted/30 opacity-60 text-muted-foreground';
    return '';
  };

  const getTextClass = (product: Product) => {
    if (product.quantity === 0) return 'text-muted-foreground';
    return '';
  };

  return (
    <>
      {/* Mobile view - показывается только на экранах меньше md */}
      <div className="md:hidden">
        <MobileProductList
          products={sortedProducts}
          onUpdateQuantity={onUpdateQuantity}
          onUpdateProduct={onUpdateProduct}
          onShowProductDetail={onShowProductDetail}
        />
      </div>

      {/* Desktop table view - показывается только на экранах md и больше */}
      <Card className="overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr className="text-left">
                <th className="p-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('name')}
                    className="h-auto p-0 font-medium justify-start text-base"
                  >
                    Название
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </th>
                <th className="p-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('price')}
                    className="h-auto p-0 font-medium justify-start text-base"
                  >
                    Цена
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </th>
                <th className="p-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('quantity')}
                    className="h-auto p-0 font-medium justify-start text-base"
                  >
                    Количество
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </th>
                <th className="p-4 text-base">Действия</th>
              </tr>
            </thead>
            <tbody>
              {sortedProducts.map((product) => (
                <tr 
                  key={product.id} 
                  className={`border-b transition-colors hover:bg-muted/30 ${getRowClass(product)}`}
                >
                  <td className="p-4">
                    {editingId === product.id ? (
                      <Input
                        value={editValues.name || ''}
                        onChange={(e) => setEditValues(prev => ({ ...prev, name: e.target.value }))}
                        className="h-10 text-base"
                      />
                    ) : (
                      <div 
                        className="cursor-pointer"
                        onClick={() => onShowProductDetail?.(product.id)}
                      >
                        <span className={`font-medium text-base hover:text-primary transition-colors ${getTextClass(product)}`}>
                          {product.name}
                        </span>
                        <div className={`text-sm text-muted-foreground mt-1 ${getTextClass(product)}`}>
                          {product.category}
                        </div>
                        <div className={`text-sm text-muted-foreground mt-1 ${getTextClass(product)}`}>
                          Поставка: {new Date(product.deliveryDate).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}
                        </div>
                        {product.discount && product.discount > 0 && (
                          <div className="text-sm text-green-600 mt-1">
                            Скидка {product.discount}%
                          </div>
                        )}
                        {product.quantity === 0 && (
                          <Badge className="bg-muted text-muted-foreground text-sm mt-2 px-3 py-1">
                            Нет в наличии
                          </Badge>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    {editingId === product.id ? (
                      <Input
                        type="number"
                        value={editValues.price || ''}
                        onChange={(e) => setEditValues(prev => ({ ...prev, price: Number(e.target.value) }))}
                        className="h-10 text-base w-28"
                      />
                    ) : (
                      <span className={`text-lg font-medium ${getTextClass(product)}`}>₸{product.price}</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => onUpdateQuantity(product.id, Math.max(0, product.quantity - 10))}
                          disabled={product.quantity === 0}
                          title="-10"
                        >
                          -10
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => onUpdateQuantity(product.id, Math.max(0, product.quantity - 5))}
                          disabled={product.quantity === 0}
                          title="-5"
                        >
                          -5
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => onUpdateQuantity(product.id, Math.max(0, product.quantity - 1))}
                          disabled={product.quantity === 0}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                      <span className={`min-w-[3rem] text-center font-medium text-lg ${getTextClass(product)}`}>
                        {product.quantity}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => onUpdateQuantity(product.id, product.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => onUpdateQuantity(product.id, product.quantity + 5)}
                          title="+5"
                        >
                          +5
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => onUpdateQuantity(product.id, product.quantity + 10)}
                          title="+10"
                        >
                          +10
                        </Button>
                      </div>
                      {onQuickAdjust && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 ml-2"
                          onClick={() => setAdjustmentProduct(product)}
                          title="Расширенная корректировка"
                        >
                          <Settings2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    {editingId === product.id ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 w-9 p-0"
                          onClick={saveEdit}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 w-9 p-0"
                          onClick={cancelEdit}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-9 w-9 p-0"
                        onClick={() => startEdit(product)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quick Adjustment Dialog */}
      {onQuickAdjust && (
        <QuickAdjustmentDialog
          product={adjustmentProduct}
          isOpen={!!adjustmentProduct}
          onClose={() => setAdjustmentProduct(null)}
          onAdjust={(productId, adjustment, reason) => {
            onQuickAdjust(productId, adjustment, reason);
            setAdjustmentProduct(null);
          }}
        />
      )}
    </>
  );
}