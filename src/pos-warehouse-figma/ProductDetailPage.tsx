import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
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
  sku?: string;
  batchCode?: string;
  farm?: string;
  supplier?: string;
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
      case 'receipt': return <ShoppingBag className="h-5 w-5 text-primary" />;
      case 'sale': return <Minus className="h-5 w-5 text-primary" />;
      case 'writeoff': return <AlertTriangle className="h-5 w-5 text-muted-foreground" />;
      case 'order': return <FileText className="h-5 w-5 text-primary" />;
      case 'adjustment': return <Calculator className="h-5 w-5 text-muted-foreground" />;
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
      case 'receipt': return 'bg-primary/10 text-primary border-primary/20';
      case 'sale': return 'bg-primary/10 text-primary border-primary/20';
      case 'writeoff': return 'bg-muted text-muted-foreground border-muted';
      case 'order': return 'bg-primary/10 text-primary border-primary/20';
      case 'adjustment': return 'bg-muted text-muted-foreground border-muted';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const finalPrice = product.price * (1 - (discount / 100));
  const margin = product.costPrice ? ((finalPrice - product.costPrice) / finalPrice * 100) : 0;

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
            {product.quantity === 0 && (
              <Badge className="bg-muted text-muted-foreground px-3 py-1">Нет в наличии</Badge>
            )}
          </div>
          <div>
            <h1>{product.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">{product.category}</p>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={onBack} variant="outline" className="h-10 px-3">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад
            </Button>
            <div>
              <h1>{product.name}</h1>
              <p className="text-sm text-muted-foreground">{product.category}</p>
            </div>
          </div>
          
          {product.quantity === 0 && (
            <Badge className="bg-muted text-muted-foreground px-3 py-1">Нет в наличии</Badge>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <Card className="p-6">
          <h2 className="mb-4">Основная информация</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Количество</p>
              <p className="text-2xl">{product.quantity}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground mb-1">Цена продажи</p>
              <p className="text-2xl">₸{product.price}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground mb-1">Дата поставки</p>
              <p>
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
          <h2 className="mb-4">Финансовая информация</h2>
          
          <div className="space-y-4">
            {/* Cost Price */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-muted-foreground" />
                <span>Себестоимость</span>
              </div>
              
              <div className="flex items-center gap-2">
                {editingCostPrice ? (
                  <>
                    <span>₸</span>
                    <Input
                      type="number"
                      value={costPrice}
                      onChange={(e) => setCostPrice(Number(e.target.value))}
                      className="w-24 h-10"
                      min="0"
                    />
                    <Button size="sm" onClick={saveCostPrice}>
                      <Save className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span>₸{product.costPrice || 0}</span>
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
                <span>Скидка</span>
              </div>
              
              <div className="flex items-center gap-2">
                {editingDiscount ? (
                  <>
                    <Input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="w-20 h-10"
                      min="0"
                      max="100"
                    />
                    <span>%</span>
                    <Button size="sm" onClick={saveDiscount}>
                      <Save className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span>{product.discount || 0}%</span>
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
                <span>Итоговая цена</span>
                <span>₸{Math.round(finalPrice)}</span>
              </div>
              
              {product.costPrice && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Маржа</span>
                  <span className={`text-sm ${margin > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                    {margin.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Warehouse Details */}
        <Card className="p-6">
          <h2 className="mb-4">Складская информация</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {product.sku && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">SKU</p>
                <p className="font-mono text-sm bg-muted px-2 py-1 rounded">{product.sku}</p>
              </div>
            )}
            
            {product.batchCode && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Код партии</p>
                <p className="font-mono text-sm bg-muted px-2 py-1 rounded">{product.batchCode}</p>
              </div>
            )}
            
            {product.supplier && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Поставщик</p>
                <p>{product.supplier}</p>
              </div>
            )}
            
            {product.farm && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Ферма</p>
                <p>{product.farm}</p>
              </div>
            )}
          </div>
        </Card>

        {/* History */}
        <Card className="p-6">
          <h2 className="mb-4">История операций</h2>
          
          {product.history && product.history.length > 0 ? (
            <div className="space-y-4">
              {product.history
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((entry) => (
                  <div key={entry.id} className="flex items-start gap-4 p-4 bg-muted/20 rounded-lg">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      {getTypeIcon(entry.type)}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={`px-3 py-1 ${getTypeColor(entry.type)}`}>
                            {getTypeLabel(entry.type)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {getRelativeTime(entry.date)}
                          </span>
                        </div>
                        <p className="mb-1">{entry.description}</p>
                        {entry.orderId && (
                          <p className="text-sm text-muted-foreground">
                            <strong>Заказ:</strong> {entry.orderId}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right ml-4">
                      <span className={`text-xl ${entry.quantity > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                        {entry.quantity > 0 ? '+' : ''}{entry.quantity}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p>История операций пуста</p>
              <p className="text-sm">Операции будут отображаться здесь</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}