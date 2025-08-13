import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { RotateCcw, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { warehouseApi } from '@/lib/api';
import { ProductSearch } from '@/pos-warehouse/ProductSearch';
import { ProductTable } from '@/pos-warehouse/ProductTable';
import { StockSummary } from '@/pos-warehouse/StockSummary';

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

export function POSWarehouseOriginal() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Загрузка товаров с склада
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['warehouse-products'],
    queryFn: async () => {
      const response = await warehouseApi.getItems({ limit: 100 });
      console.log('API Response:', response);
      return response.items.map((item: any) => ({
        id: item.id.toString(),
        name: item.variety || item.sku || 'Без названия',
        quantity: item.qty || 0,
        price: item.price || 0,
        category: item.product?.category || 'Цветы',
        minQuantity: item.minQuantity || 15,
        deliveryDate: item.deliveryDate || new Date().toISOString(),
        costPrice: item.cost || item.costPrice,
        discount: 0,
        history: []
      }));
    }
  });

  // Обновление количества товара
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      await warehouseApi.updateItem(id, { qty: quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-products'] });
      toast.success('Количество обновлено');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Ошибка обновления количества');
    }
  });

  // Корректировка остатков с причиной
  const adjustStockMutation = useMutation({
    mutationFn: async ({ id, adjustment, reason }: { id: string; adjustment: number; reason: string }) => {
      // В реальном API этот endpoint может не существовать
      // Используем обычное обновление количества
      const product = products.find(p => p.id === id);
      if (product) {
        const newQuantity = Math.max(0, product.quantity + adjustment);
        await warehouseApi.updateItem(id, { qty: newQuantity });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-products'] });
      toast.success('Корректировка выполнена');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Ошибка корректировки');
    }
  });

  // Фильтрация товаров
  const filteredProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    
    let filtered = products;

    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    return filtered;
  }, [products, searchQuery, selectedCategory]);

  // Получение уникальных категорий
  const categories = useMemo(() => {
    if (!products || products.length === 0) return [];
    return [...new Set(products.map(p => p.category))];
  }, [products]);

  const handleSync = async () => {
    await queryClient.invalidateQueries({ queryKey: ['warehouse-products'] });
    toast.success('Данные синхронизированы');
  };

  const handleQuantityUpdate = (productId: string, newQuantity: number) => {
    updateQuantityMutation.mutate({ id: productId, quantity: newQuantity });
  };

  const handleQuickAdjust = (productId: string, adjustment: number, reason: string) => {
    adjustStockMutation.mutate({ id: productId, adjustment, reason });
  };

  const handleProductClick = (productId: string) => {
    // Можно открыть детальную информацию о товаре
    console.log('Product clicked:', productId);
  };

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

        {/* Статистика - оригинальный дизайн */}
        <StockSummary
          products={products || []}
        />

        {/* Поиск и фильтры - оригинальный дизайн */}
        <div className="mt-6">
          <ProductSearch
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            categories={categories}
            onSearchChange={setSearchQuery}
            onCategoryChange={setSelectedCategory}
          />
        </div>

        {/* Таблица товаров - оригинальный дизайн */}
        <div className="mt-6">
          <ProductTable
            products={filteredProducts}
            isLoading={isLoading}
            onUpdateQuantity={handleQuantityUpdate}
            onProductClick={handleProductClick}
            onQuickAdjust={handleQuickAdjust}
          />
        </div>
      </div>
    </div>
  );
}