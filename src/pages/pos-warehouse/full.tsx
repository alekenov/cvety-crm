import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Package2, 
  Plus, 
  Minus, 
  Settings2, 
  ClipboardList, 
  Search,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { warehouseApi } from '@/lib/api';
import { QuickAdjustmentDialog } from '@/pos-warehouse/QuickAdjustmentDialog';

interface Product {
  id: string;
  name: string;
  quantity: number;
  price: number;
  category: string;
  minQuantity: number;
  reserved: number;
}

export function POSWarehouseFull() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Загрузка товаров с склада
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['pos-warehouse-products'],
    queryFn: async () => {
      try {
        const response = await warehouseApi.getItems({ limit: 100 });
        return response.items.map((item: any) => ({
          id: item.id.toString(),
          name: item.variety || item.sku || 'Без названия',
          quantity: item.qty || 0,
          price: item.price || 0,
          category: item.product?.category || 'Цветы',
          minQuantity: 15,
          reserved: item.reservedQty || 0
        }));
      } catch (err) {
        console.error('Error fetching warehouse items:', err);
        throw err;
      }
    },
    retry: 1,
    staleTime: 30000
  });

  // Обновление количества товара
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      await warehouseApi.updateItem(id, { qty: quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-warehouse-products'] });
      toast.success('Количество обновлено');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Ошибка обновления количества');
    }
  });

  // Быстрая корректировка
  const handleQuickAdjust = (productId: string, adjustment: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const newQuantity = Math.max(0, product.quantity + adjustment);
    updateQuantityMutation.mutate({ id: productId, quantity: newQuantity });
  };

  // Расширенная корректировка с причиной
  const handleAdvancedAdjust = (productId: string, adjustment: number, reason: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const newQuantity = Math.max(0, product.quantity + adjustment);
    updateQuantityMutation.mutate({ id: productId, quantity: newQuantity });
  };

  // Фильтрация товаров
  const filteredProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    
    if (searchQuery) {
      return products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return products;
  }, [products, searchQuery]);

  // Статистика
  const stats = useMemo(() => {
    if (!products || products.length === 0) {
      return {
        totalProducts: 0,
        lowStockCount: 0,
        totalValue: 0,
        availableValue: 0
      };
    }
    
    const lowStock = products.filter(p => p.quantity <= p.minQuantity);
    const totalValue = products.reduce((sum, p) => sum + (p.quantity * p.price), 0);
    const availableValue = products.reduce((sum, p) => sum + ((p.quantity - p.reserved) * p.price), 0);
    
    return {
      totalProducts: products.length,
      lowStockCount: lowStock.length,
      totalValue,
      availableValue
    };
  }, [products]);

  const handleSync = async () => {
    await queryClient.invalidateQueries({ queryKey: ['pos-warehouse-products'] });
    toast.success('Данные синхронизированы');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="p-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Ошибка загрузки</h2>
            </div>
            <p className="mt-2 text-gray-600">
              Не удалось загрузить данные склада. Проверьте соединение с сервером.
            </p>
            <Button onClick={handleSync} className="mt-4">
              Повторить попытку
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4 max-w-7xl">
        {/* Заголовок */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">POS Склад</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={isLoading}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Синхронизировать
            </Button>
            <Button
              variant="outline"
              size="sm"
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              Инвентаризация
            </Button>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="text-sm text-gray-500">Всего позиций</div>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-500">Мало на складе</div>
            <div className="text-2xl font-bold text-orange-600">
              {stats.lowStockCount}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-500">Общая стоимость</div>
            <div className="text-2xl font-bold">
              ₸{stats.totalValue.toLocaleString()}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-500">Доступно к продаже</div>
            <div className="text-2xl font-bold text-green-600">
              ₸{stats.availableValue.toLocaleString()}
            </div>
          </Card>
        </div>

        {/* Поиск */}
        <Card className="p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Поиск товара..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {/* Таблица товаров */}
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-gray-500">Загрузка данных...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4">Товар</th>
                    <th className="text-center p-4">В наличии</th>
                    <th className="text-center p-4">Резерв</th>
                    <th className="text-center p-4">Доступно</th>
                    <th className="text-right p-4">Цена</th>
                    <th className="text-right p-4">Стоимость</th>
                    <th className="text-center p-4">Быстрые действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const available = product.quantity - product.reserved;
                    const isLowStock = product.quantity <= product.minQuantity;
                    
                    return (
                      <tr key={product.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div className="font-medium">{product.name}</div>
                          <Badge variant="outline" className="mt-1">
                            {product.category}
                          </Badge>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-medium">{product.quantity} шт</span>
                            {isLowStock && (
                              <Badge variant="destructive" className="text-xs">
                                Мало
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-center text-gray-500">
                          {product.reserved} шт
                        </td>
                        <td className="p-4 text-center">
                          <span className={available > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                            {available} шт
                          </span>
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
                              disabled={product.quantity < 10}
                            >
                              -10
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0"
                              onClick={() => handleQuickAdjust(product.id, -5)}
                              disabled={product.quantity < 5}
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
                              onClick={() => {
                                setSelectedProduct(product);
                                setIsAdjustmentDialogOpen(true);
                              }}
                            >
                              <Settings2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Диалог расширенной корректировки */}
      <QuickAdjustmentDialog
        product={selectedProduct}
        isOpen={isAdjustmentDialogOpen}
        onClose={() => {
          setIsAdjustmentDialogOpen(false);
          setSelectedProduct(null);
        }}
        onAdjust={handleAdvancedAdjust}
      />
    </div>
  );
}