import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface Customer {
  id: number;
  name: string;
  phone: string;
  orders_count?: number;
}

interface WarehouseItem {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  category: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  quantity?: number;
  category: string;
}

const FloristCRMWithAPI = () => {
  const { toast } = useToast();
  const [selectedClient, setSelectedClient] = useState<Customer | null>(null);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState('client');
  const [comment, setComment] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  
  // Data from API
  const [clients, setClients] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Авторизация для тестирования
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Получаем тестовый токен (POST без body)
        const authRes = await api.post('/api/auth/test-token');
        localStorage.setItem('authToken', authRes.data.access_token);
        localStorage.setItem('shopPhone', '+77011234567'); // правильный номер тестового магазина
        loadData();
      } catch (error) {
        console.error('Auth error:', error);
        // Используем статичные данные если API недоступен
        loadData(); // все равно вызываем loadData для fallback
      }
    };
    initAuth();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [customersRes, productsRes, warehouseRes] = await Promise.all([
        api.get('/api/customers'),
        api.get('/api/products'),
        api.get('/api/warehouse')
      ]);
      
      setClients(customersRes.data);
      
      // Преобразуем товары из каталога в формат для инвентаря
      const productsWithStock = productsRes.data.map((product: Product) => {
        const warehouseItem = warehouseRes.data.find((w: WarehouseItem) => 
          w.name.toLowerCase().includes(product.name.toLowerCase())
        );
        return {
          ...product,
          quantity: warehouseItem?.quantity || Math.floor(Math.random() * 20) + 1
        };
      });
      
      setProducts(productsWithStock);
      setWarehouseItems(warehouseRes.data);
    } catch (error: any) {
      console.error('Error loading data:', error);
      
      // Используем фалбэк данные для демонстрации
      const fallbackClients = [
        { id: 1, name: 'Анна Сергеева', phone: '+7 777 123 4567', orders_count: 3 },
        { id: 2, name: 'Марат Казбеков', phone: '+7 701 234 5678', orders_count: 1 },
        { id: 3, name: 'Ольга Петрова', phone: '+7 778 345 6789', orders_count: 7 },
        { id: 4, name: 'Дамир Аскаров', phone: '+7 747 456 7890', orders_count: 2 },
      ];
      
      const fallbackProducts = [
        { id: 1, name: 'Розы красные', price: 800, quantity: 15, category: 'Цветы' },
        { id: 2, name: 'Тюльпаны желтые', price: 500, quantity: 8, category: 'Цветы' },
        { id: 3, name: 'Хризантемы белые', price: 600, quantity: 12, category: 'Цветы' },
        { id: 4, name: 'Гипсофила', price: 300, quantity: 5, category: 'Зелень' },
        { id: 5, name: 'Эвкалипт', price: 200, quantity: 20, category: 'Зелень' },
        { id: 6, name: 'Лилии белые', price: 1200, quantity: 6, category: 'Цветы' },
        { id: 7, name: 'Герберы розовые', price: 700, quantity: 10, category: 'Цветы' },
        { id: 8, name: 'Альстромерия', price: 450, quantity: 18, category: 'Цветы' },
        { id: 9, name: 'Пионы', price: 1500, quantity: 4, category: 'Цветы' },
        { id: 10, name: 'Рускус', price: 150, quantity: 25, category: 'Зелень' },
      ];
      
      setClients(fallbackClients);
      setProducts(fallbackProducts);
      
      toast({
        title: "Режим демонстрации",
        description: "Используются тестовые данные",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectClient = (client: Customer) => {
    setSelectedClient(client);
    setCurrentStep('items');
  };

  const addItem = (item: Product) => {
    const existing = selectedItems.find(si => si.id === item.id);
    if (existing) {
      if (existing.quantity < (item.quantity || 0)) {
        setSelectedItems(selectedItems.map(si => 
          si.id === item.id ? { ...si, quantity: si.quantity + 1 } : si
        ));
      }
    } else {
      setSelectedItems([...selectedItems, { ...item, quantity: 1 }]);
    }
  };

  const removeItem = (itemId: number) => {
    setSelectedItems(selectedItems.filter(si => si.id !== itemId));
  };

  const updateItemQuantity = (itemId: number, delta: number) => {
    const item = products.find(p => p.id === itemId);
    if (!item) return;

    setSelectedItems(selectedItems.map(si => {
      if (si.id === itemId) {
        const newQuantity = si.quantity + delta;
        if (newQuantity <= 0) return si;
        if (newQuantity > (item.quantity || 0)) return si;
        return { ...si, quantity: newQuantity };
      }
      return si;
    }));
  };

  const getTotalAmount = () => {
    return selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const createOrder = async () => {
    if (!selectedClient) return;
    
    setCreating(true);
    try {
      const orderData = {
        customer_id: selectedClient.id,
        delivery_address: deliveryAddress || 'Самовывоз',
        total_amount: getTotalAmount(),
        status: 'new',
        comment: comment,
        items: selectedItems.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price,
          product_name: item.name,
          product_category: item.category
        }))
      };

      const response = await api.post('/api/orders', orderData);
      
      toast({
        title: "Заказ создан!",
        description: `Заказ #${response.data.id} на сумму ${getTotalAmount()} ₸`,
      });
      
      // Сброс состояния
      setSelectedClient(null);
      setSelectedItems([]);
      setComment('');
      setDeliveryAddress('');
      setCurrentStep('client');
      
      // Перезагружаем данные
      loadData();
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast({
        title: "Ошибка",
        description: error.response?.data?.detail || "Не удалось создать заказ",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const steps = [
    { id: 'client', label: 'Клиент', number: 1 },
    { id: 'items', label: 'Товары', number: 2 },
    { id: 'summary', label: 'Подтверждение', number: 3 },
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-4">
        <Skeleton className="h-12 w-48" />
        <div className="grid gap-3 md:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-background min-h-screen">
      {/* Шапка с шагами */}
      <div className="border-b pb-4 mb-6">
        <h1 className="text-3xl font-bold mb-4">Новый заказ - Прототип с API</h1>
        <div className="flex gap-2">
          {steps.map((step) => (
            <div
              key={step.id}
              className={cn(
                "px-4 py-2 rounded-lg border transition-colors",
                currentStep === step.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-muted-foreground border-border"
              )}
            >
              <span className="font-medium">{step.number}. {step.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Шаг 1: Выбор клиента */}
      {currentStep === 'client' && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Выберите клиента ({clients.length})</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {clients.slice(0, 12).map(client => (
              <Card 
                key={client.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => selectClient(client)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-lg">{client.name}</div>
                      <div className="text-muted-foreground">{client.phone}</div>
                    </div>
                    {client.orders_count !== undefined && (
                      <Badge variant="secondary">
                        {client.orders_count} заказов
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => window.location.href = '/customers'}>
              Перейти к полному списку клиентов →
            </Button>
          </div>
        </div>
      )}

      {/* Шаг 2: Выбор товаров */}
      {currentStep === 'items' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Каталог товаров</h2>
              <Badge variant="outline" className="text-base px-3 py-1">
                {selectedItems.length > 0 ? 
                  `${selectedItems.reduce((sum, item) => sum + item.quantity, 0)} позиций • ${getTotalAmount()} ₸` 
                  : 'Выберите товары'
                }
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {products.map(item => {
                const selectedItem = selectedItems.find(si => si.id === item.id);
                const selectedQuantity = selectedItem ? selectedItem.quantity : 0;
                const stockQuantity = item.quantity || 0;
                
                return (
                  <Card
                    key={item.id}
                    className={cn(
                      "relative cursor-pointer transition-all hover:shadow-md",
                      stockQuantity === 0 && "opacity-50 cursor-not-allowed",
                      selectedQuantity > 0 && "ring-2 ring-primary"
                    )}
                    onClick={() => stockQuantity > 0 && addItem(item)}
                  >
                    <CardContent className="p-3 text-center">
                      {selectedQuantity > 0 && (
                        <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center">
                          {selectedQuantity}
                        </Badge>
                      )}
                      <div className="font-medium text-sm mb-1 line-clamp-2">{item.name}</div>
                      <div className="text-sm text-muted-foreground mb-1">{item.price}₸</div>
                      <Badge 
                        variant={
                          stockQuantity > 10 ? "default" :
                          stockQuantity > 5 ? "secondary" :
                          stockQuantity > 0 ? "destructive" :
                          "outline"
                        }
                        className="text-xs"
                      >
                        {stockQuantity} шт
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Заказ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedClient && (
                  <div className="p-3 rounded-lg bg-muted">
                    <div className="font-medium">{selectedClient.name}</div>
                    <div className="text-sm text-muted-foreground">{selectedClient.phone}</div>
                  </div>
                )}

                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {selectedItems.map(item => (
                    <Card key={item.id}>
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{item.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {item.quantity} × {item.price} ₸
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateItemQuantity(item.id, -1);
                                }}
                              >
                                -
                              </Button>
                              <span className="w-8 text-center text-sm">{item.quantity}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateItemQuantity(item.id, 1);
                                }}
                              >
                                +
                              </Button>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeItem(item.id);
                              }}
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                        <div className="text-right font-medium text-sm mt-1">
                          {item.quantity * item.price} ₸
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {selectedItems.length === 0 && (
                  <div className="text-center text-muted-foreground py-8 border border-dashed rounded-lg">
                    Выберите товары из каталога
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Итого:</span>
                    <span>{getTotalAmount()} ₸</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button 
                    onClick={() => setCurrentStep('summary')}
                    disabled={selectedItems.length === 0}
                    className="w-full"
                  >
                    Далее
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setCurrentStep('client')}
                    className="w-full"
                  >
                    Назад
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Шаг 3: Подтверждение */}
      {currentStep === 'summary' && (
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4">Подтверждение заказа</h2>
          
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Клиент</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-medium">{selectedClient?.name}</div>
                <div className="text-muted-foreground">{selectedClient?.phone}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Состав заказа</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedItems.map(item => (
                    <div key={item.id} className="flex justify-between py-1">
                      <span>{item.name} × {item.quantity}</span>
                      <span className="font-medium">{item.quantity * item.price} ₸</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-3 mt-3 flex justify-between text-lg font-bold">
                  <span>Итого:</span>
                  <span>{getTotalAmount()} ₸</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Доставка</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="address">Адрес доставки</Label>
                  <Input
                    id="address"
                    placeholder="Введите адрес доставки или оставьте пустым для самовывоза"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Дополнительно</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Комментарий к заказу..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                />
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={() => setCurrentStep('items')}
                className="flex-1"
                disabled={creating}
              >
                Назад
              </Button>
              <Button 
                onClick={createOrder}
                className="flex-1"
                disabled={creating}
              >
                {creating ? 'Создание...' : 'Создать заказ'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloristCRMWithAPI;