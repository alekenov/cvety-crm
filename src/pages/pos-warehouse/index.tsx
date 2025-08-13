import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ProductSearch } from '@/pos-warehouse/ProductSearch';
import { ProductTable } from '@/pos-warehouse/ProductTable';
import { StockSummary } from '@/pos-warehouse/StockSummary';
import { InventoryPage } from '@/pos-warehouse/InventoryPage';
import { ProductDetailPage } from '@/pos-warehouse/ProductDetailPage';
import { Button } from '@/components/ui/button';
import { RotateCcw, Package, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';

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

export function POSWarehousePage() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [currentView, setCurrentView] = React.useState<'warehouse' | 'inventory' | 'detail'>('warehouse');
  const [selectedProductId, setSelectedProductId] = React.useState<string | null>(null);
  const queryClient = useQueryClient();

  // Загрузка товаров с склада
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['warehouse-products'],
    queryFn: async () => {
      const response = await api.get('/warehouse/', {
        params: { limit: 100 }
      });
      console.log('API Response:', response.data);
      console.log('First item:', response.data.items[0]);
      return response.data.items.map((item: any) => ({
        id: item.id.toString(),
        name: item.variety || item.product?.name || item.name || 'Без названия',
        quantity: item.qty || item.quantity || 0,
        price: item.price || item.product?.price || 0,
        category: item.product?.category || 'Другое',
        minQuantity: item.min_quantity || 15,
        deliveryDate: item.delivery_date || item.last_updated || new Date().toISOString(),
        costPrice: item.cost || item.product?.cost_price,
        discount: 0,
        history: []
      }));
    }
  });

  // Обновление количества товара
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      await api.patch(`/warehouse/${id}`, { qty: quantity });
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
      await api.post(`/warehouse/${id}/adjust-stock`, {
        adjustment,
        reason,
        created_by: 'user' // В реальном приложении брать из контекста авторизации
      });
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
  const filteredProducts = React.useMemo(() => {
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

  // Статистика
  const stats = React.useMemo(() => {
    if (!products || products.length === 0) {
      return {
        totalProducts: 0,
        lowStockCount: 0,
        totalValue: 0,
        totalCost: 0,
        profit: 0
      };
    }
    
    const lowStock = products.filter(p => p.quantity <= p.minQuantity);
    const totalValue = products.reduce((sum, p) => sum + (p.quantity * p.price), 0);
    const totalCost = products.reduce((sum, p) => sum + (p.quantity * (p.costPrice || 0)), 0);
    
    return {
      totalProducts: products.length,
      lowStockCount: lowStock.length,
      totalValue,
      totalCost,
      profit: totalValue - totalCost
    };
  }, [products]);

  const handleSync = async () => {
    await queryClient.invalidateQueries({ queryKey: ['warehouse-products'] });
    toast.success('Данные синхронизированы');
  };

  const handleProductClick = (productId: string) => {
    setSelectedProductId(productId);
    setCurrentView('detail');
  };

  const handleQuantityUpdate = (productId: string, newQuantity: number) => {
    updateQuantityMutation.mutate({ id: productId, quantity: newQuantity });
  };

  const handleQuickAdjust = (productId: string, adjustment: number, reason: string) => {
    adjustStockMutation.mutate({ id: productId, adjustment, reason });
  };

  if (currentView === 'inventory') {
    return (
      <InventoryPage
        products={products}
        onBack={() => setCurrentView('warehouse')}
        onProductSelect={handleProductClick}
        onAdjustStock={handleQuickAdjust}
      />
    );
  }

  if (currentView === 'detail' && selectedProductId) {
    const product = products.find(p => p.id === selectedProductId);
    if (product) {
      return (
        <ProductDetailPage
          product={product}
          onBack={() => setCurrentView('warehouse')}
          onQuantityUpdate={handleQuantityUpdate}
        />
      );
    }
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
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Синхронизировать
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentView('inventory')}
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              Инвентаризация
            </Button>
          </div>
        </div>

        {/* Статистика */}
        <StockSummary
          products={products || []}
        />

        {/* Поиск */}
        <ProductSearch
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
          categories={products && products.length > 0 ? [...new Set(products.map(p => p.category))] : []}
          onSearchChange={setSearchQuery}
          onCategoryChange={setSelectedCategory}
        />

        {/* Таблица товаров */}
        <ProductTable
          products={filteredProducts}
          isLoading={isLoading}
          onProductClick={handleProductClick}
          onQuantityUpdate={handleQuantityUpdate}
          onQuickAdjust={handleQuickAdjust}
        />
      </div>
    </div>
  );
}