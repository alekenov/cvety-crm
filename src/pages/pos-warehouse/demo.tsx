import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package2, Plus, Minus, Settings2, ClipboardList } from 'lucide-react';

// Демо-данные
const demoProducts = [
  { id: '1', name: 'Роза красная Freedom', quantity: 110, price: 500, category: 'Розы' },
  { id: '2', name: 'Роза белая Avalanche', quantity: 80, price: 550, category: 'Розы' },
  { id: '3', name: 'Тюльпан желтый Strong Gold', quantity: 200, price: 300, category: 'Тюльпаны' },
  { id: '4', name: 'Пион розовый Sarah Bernhardt', quantity: 50, price: 800, category: 'Пионы' },
  { id: '5', name: 'Эустома белая', quantity: 120, price: 400, category: 'Эустома' },
];

export function POSWarehouseDemo() {
  const [products, setProducts] = React.useState(demoProducts);
  const [selectedProduct, setSelectedProduct] = React.useState<any>(null);

  const handleQuickAdjust = (productId: string, adjustment: number) => {
    setProducts(prev => 
      prev.map(p => 
        p.id === productId 
          ? { ...p, quantity: Math.max(0, p.quantity + adjustment) }
          : p
      )
    );
  };

  const totalValue = products.reduce((sum, p) => sum + (p.quantity * p.price), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">POS Склад - Демо</h1>
          <div className="flex gap-2">
            <Button variant="outline">
              <ClipboardList className="h-4 w-4 mr-2" />
              Инвентаризация
            </Button>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="text-sm text-gray-500">Всего позиций</div>
            <div className="text-2xl font-bold">{products.length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-500">Общее количество</div>
            <div className="text-2xl font-bold">
              {products.reduce((sum, p) => sum + p.quantity, 0)} шт
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-500">Общая стоимость</div>
            <div className="text-2xl font-bold">₸{totalValue.toLocaleString()}</div>
          </Card>
        </div>

        {/* Таблица товаров */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4">Товар</th>
                  <th className="text-left p-4">Категория</th>
                  <th className="text-center p-4">Количество</th>
                  <th className="text-right p-4">Цена</th>
                  <th className="text-right p-4">Стоимость</th>
                  <th className="text-center p-4">Быстрые действия</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">{product.name}</td>
                    <td className="p-4">
                      <Badge variant="outline">{product.category}</Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-medium">{product.quantity} шт</span>
                        {product.quantity < 20 && (
                          <Badge variant="destructive" className="text-xs">Мало</Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">₸{product.price}</td>
                    <td className="p-4 text-right font-medium">
                      ₸{(product.quantity * product.price).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => handleQuickAdjust(product.id, -10)}
                        >
                          -10
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => handleQuickAdjust(product.id, -5)}
                        >
                          -5
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => handleQuickAdjust(product.id, 5)}
                        >
                          +5
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => handleQuickAdjust(product.id, 10)}
                        >
                          +10
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => setSelectedProduct(product)}
                        >
                          <Settings2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Информация о выбранном товаре */}
        {selectedProduct && (
          <Card className="mt-4 p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{selectedProduct.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Текущий остаток: {selectedProduct.quantity} шт × ₸{selectedProduct.price} = 
                  ₸{(selectedProduct.quantity * selectedProduct.price).toLocaleString()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedProduct(null)}
              >
                Закрыть
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}