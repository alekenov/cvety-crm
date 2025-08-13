import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { MovementHistory } from './MovementHistory';
import { ArrowLeft, Save, Percent, Calculator, Clock, ShoppingBag, Minus, FileText, AlertTriangle } from 'lucide-react';

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

interface ProductDetailPageProps {
  product: Product;
  onUpdateProduct: (id: string, updates: Partial<Product>) => void;
  onBack: () => void;
}

export function ProductDetailPage({ product, onUpdateProduct, onBack }: ProductDetailPageProps) {
  const [editingCostPrice, setEditingCostPrice] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(false);
  const [costPrice, setCostPrice] = useState(product.costPrice || 0);
  const [discount, setDiscount] = useState(product.discount || 0);

  // Обновляем состояние при изменении товара
  React.useEffect(() => {
    setCostPrice(product.costPrice || 0);
    setDiscount(product.discount || 0);
  }, [product.id, product.costPrice, product.discount]);

  const saveCostPrice = () => {
    onUpdateProduct(product.id, { costPrice });
    setEditingCostPrice(false);
  };

  const saveDiscount = () => {
    onUpdateProduct(product.id, { discount: Math.max(0, Math.min(100, discount)) });
    setEditingDiscount(false);
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date('2025-08-12'); // Текущая дата в системе
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Сегодня';
    if (diffDays === 1) return 'Вчера';
    if (diffDays === 2) return '2 дня назад';
    if (diffDays <= 7) return `${diffDays} дней назад`;
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)} недель назад`;
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'receipt': return <ShoppingBag className="h-5 w-5 text-green-600" />;
      case 'sale': return <Minus className="h-5 w-5 text-blue-600" />;
      case 'writeoff': return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'order': return <FileText className="h-5 w-5 text-purple-600" />;
      case 'adjustment': return <Calculator className="h-5 w-5 text-gray-600" />;
      default: return <Clock className="h-5 w-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'receipt': return 'Поступление';
      case 'sale': return 'Продажа';
      case 'writeoff': return 'Списание';
      case 'order': return 'Заказ';
      case 'adjustment': return 'Корректировка';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'receipt': return 'bg-green-50 text-green-700 border-green-200';
      case 'sale': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'writeoff': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'order': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'adjustment': return 'bg-gray-50 text-gray-700 border-gray-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const finalPrice = product.price * (1 - (discount / 100));
  const margin = product.costPrice ? ((finalPrice - product.costPrice) / finalPrice * 100) : 0;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="outline" size="sm" className="h-12 md:h-10 px-4 md:px-3 text-base">
            <ArrowLeft className="mr-2 h-5 w-5 md:h-4 md:w-4" />
            Назад
          </Button>
          <div>
            <h1 className="text-2xl md:text-xl">{product.name}</h1>
            <p className="text-sm text-muted-foreground">{product.category}</p>
          </div>
        </div>
        
        {product.quantity === 0 && (
          <Badge className="bg-muted text-muted-foreground text-base px-3 py-1">Нет в наличии</Badge>
        )}
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <Card className="p-6">
          <h2 className="text-xl md:text-lg mb-4">Основная информация</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Количество</p>
              <p className="text-2xl font-medium">{product.quantity}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground mb-1">Цена продажи</p>
              <p className="text-2xl font-medium">₸{product.price}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground mb-1">Дата поставки</p>
              <p className="text-lg">
                {new Date(product.deliveryDate).toLocaleDateString('ru-RU', { 
                  day: '2-digit', 
                  month: 'short' 
                })}
              </p>
            </div>
          </div>
        </Card>

        {/* Financial Info */}
        <Card className="p-6">
          <h2 className="text-xl md:text-lg mb-4">Финансовая информация</h2>
          
          <div className="space-y-4">
            {/* Cost Price */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-muted-foreground" />
                <span className="text-base">Себестоимость</span>
              </div>
              
              <div className="flex items-center gap-2">
                {editingCostPrice ? (
                  <>
                    <span className="text-base">₸</span>
                    <Input
                      type="number"
                      value={costPrice}
                      onChange={(e) => setCostPrice(Number(e.target.value))}
                      className="w-24 h-10 text-base"
                      min="0"
                    />
                    <Button size="sm" onClick={saveCostPrice} className="text-base">
                      <Save className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="font-medium text-base">₸{product.costPrice || 0}</span>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setEditingCostPrice(true)}
                      className="h-9 w-9 p-0"
                    >
                      <Calculator className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Discount */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <span className="text-base">Скидка</span>
              </div>
              
              <div className="flex items-center gap-2">
                {editingDiscount ? (
                  <>
                    <Input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="w-20 h-10 text-base"
                      min="0"
                      max="100"
                    />
                    <span className="text-base">%</span>
                    <Button size="sm" onClick={saveDiscount} className="text-base">
                      <Save className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="font-medium text-base">{product.discount || 0}%</span>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setEditingDiscount(true)}
                      className="h-9 w-9 p-0"
                    >
                      <Percent className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            <Separator />

            {/* Final Price & Margin */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-base">Итоговая цена</span>
                <span className="font-medium text-lg">₸{Math.round(finalPrice)}</span>
              </div>
              
              {product.costPrice && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Маржа</span>
                  <span className={`text-sm font-medium ${margin > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {margin.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Movement History from Backend */}
        <MovementHistory 
          productId={product.id} 
          productName={product.name} 
        />
      </div>
    </div>
  );
}