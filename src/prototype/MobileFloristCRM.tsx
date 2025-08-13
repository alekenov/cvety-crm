import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, X, ChevronRight, ShoppingBag, User } from 'lucide-react';

interface Client {
  id: number;
  name: string;
  phone: string;
  orders: number;
}

interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

const MobileFloristCRM = () => {
  const { toast } = useToast();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState<'client' | 'items' | 'summary'>('client');
  const [searchQuery, setSearchQuery] = useState('');
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [showNewClient, setShowNewClient] = useState(false);

  const clients: Client[] = [
    { id: 1, name: 'Анна Сергеева', phone: '+7 777 123 4567', orders: 3 },
    { id: 2, name: 'Марат Казбеков', phone: '+7 701 234 5678', orders: 1 },
    { id: 3, name: 'Ольга Петрова', phone: '+7 778 345 6789', orders: 7 },
    { id: 4, name: 'Дамир Аскаров', phone: '+7 747 456 7890', orders: 2 },
  ];

  const products: Product[] = [
    { id: 1, name: 'Розы красные', price: 800, quantity: 15, category: 'flowers' },
    { id: 2, name: 'Тюльпаны', price: 500, quantity: 8, category: 'flowers' },
    { id: 3, name: 'Хризантемы', price: 600, quantity: 12, category: 'flowers' },
    { id: 4, name: 'Гипсофила', price: 300, quantity: 5, category: 'greens' },
    { id: 5, name: 'Эвкалипт', price: 200, quantity: 20, category: 'greens' },
    { id: 6, name: 'Лилии белые', price: 1200, quantity: 6, category: 'flowers' },
    { id: 7, name: 'Герберы', price: 700, quantity: 10, category: 'flowers' },
    { id: 8, name: 'Пионы', price: 1500, quantity: 4, category: 'flowers' },
    { id: 9, name: 'Орхидеи', price: 2500, quantity: 3, category: 'flowers' },
  ];

  const quickBouquets = [
    { id: 'romantic', name: 'Романтический', price: 3500 },
    { id: 'birthday', name: 'День рождения', price: 4000 },
    { id: 'classic', name: 'Классический', price: 3000 },
  ];

  const selectClient = (client: Client) => {
    setSelectedClient(client);
    setCurrentStep('items');
    setSearchQuery('');
    setClientSearchQuery('');
  };

  const addItem = (item: Product) => {
    const existing = selectedItems.find(si => si.id === item.id);
    if (existing) {
      if (existing.selectedQuantity < item.quantity) {
        setSelectedItems(selectedItems.map(si => 
          si.id === item.id ? { ...si, selectedQuantity: si.selectedQuantity + 1 } : si
        ));
      }
    } else {
      setSelectedItems([...selectedItems, { ...item, selectedQuantity: 1 }]);
    }
  };

  const removeItem = (itemId: number) => {
    setSelectedItems(selectedItems.filter(si => si.id !== itemId));
  };

  const updateQuantity = (itemId: number, delta: number) => {
    setSelectedItems(selectedItems.map(si => {
      if (si.id === itemId) {
        const newQuantity = si.selectedQuantity + delta;
        if (newQuantity <= 0) return si;
        if (newQuantity > si.quantity) return si;
        return { ...si, selectedQuantity: newQuantity };
      }
      return si;
    }));
  };

  const getTotalAmount = () => {
    return selectedItems.reduce((sum, item) => sum + (item.price * item.selectedQuantity), 0);
  };

  const createOrder = () => {
    toast({
      title: "Заказ создан!",
      description: `Клиент: ${selectedClient?.name}, Сумма: ${getTotalAmount()} ₸`,
    });
    
    // Reset
    setSelectedClient(null);
    setSelectedItems([]);
    setCurrentStep('client');
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
    client.phone.includes(clientSearchQuery)
  );

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* Верхняя панель - Результат */}
      <div className="bg-white border-b shadow-sm">
        {/* Индикатор шагов */}
        <div className="flex justify-between p-2 text-xs">
          <div className={cn(
            "flex-1 text-center py-1 rounded-l",
            currentStep === 'client' ? 'bg-primary text-white' : 'bg-gray-100'
          )}>
            Клиент
          </div>
          <div className={cn(
            "flex-1 text-center py-1",
            currentStep === 'items' ? 'bg-primary text-white' : 'bg-gray-100'
          )}>
            Товары
          </div>
          <div className={cn(
            "flex-1 text-center py-1 rounded-r",
            currentStep === 'summary' ? 'bg-primary text-white' : 'bg-gray-100'
          )}>
            Итог
          </div>
        </div>

        {/* Панель результата */}
        <div className="p-4 space-y-2">
          {/* Выбранный клиент */}
          {selectedClient && (
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-600" />
                <div>
                  <div className="font-medium text-sm">{selectedClient.name}</div>
                  <div className="text-xs text-gray-500">{selectedClient.phone}</div>
                </div>
              </div>
              {currentStep === 'client' && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedClient(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {/* Состав заказа */}
          {selectedItems.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ShoppingBag className="h-4 w-4" />
                <span>Состав заказа:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedItems.map(item => (
                  <Badge key={item.id} variant="secondary" className="text-xs">
                    {item.name} x{item.selectedQuantity}
                  </Badge>
                ))}
              </div>
              <div className="text-right font-bold text-lg">
                Итого: {getTotalAmount()} ₸
              </div>
            </div>
          )}

          {/* Пустое состояние */}
          {!selectedClient && currentStep === 'client' && (
            <div className="text-center py-4 text-gray-400">
              <User className="h-12 w-12 mx-auto mb-2" />
              <div className="text-sm">Выберите клиента</div>
            </div>
          )}

          {selectedClient && selectedItems.length === 0 && currentStep === 'items' && (
            <div className="text-center py-4 text-gray-400">
              <ShoppingBag className="h-12 w-12 mx-auto mb-2" />
              <div className="text-sm">Добавьте товары</div>
            </div>
          )}
        </div>
      </div>

      {/* Центральная область - прокручиваемый контент для summary */}
      {currentStep === 'summary' && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-2">Состав заказа</h3>
                <div className="space-y-2">
                  {selectedItems.map(item => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <div className="text-sm font-medium">{item.name}</div>
                        <div className="text-xs text-gray-500">
                          {item.selectedQuantity} × {item.price} ₸
                        </div>
                      </div>
                      <div className="font-medium">
                        {item.selectedQuantity * item.price} ₸
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-3 pt-3 flex justify-between font-bold">
                  <span>Итого:</span>
                  <span>{getTotalAmount()} ₸</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Spacer для остальных шагов */}
      {currentStep !== 'summary' && <div className="flex-1" />}

      {/* Нижняя панель - Ввод */}
      <div className="bg-white border-t shadow-lg">
        {/* Шаг 1: Выбор клиента */}
        {currentStep === 'client' && (
          <div className="p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Введите имя или телефон клиента..."
                value={clientSearchQuery}
                onChange={(e) => setClientSearchQuery(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>

            {clientSearchQuery && (
              <div className="space-y-2">
                {filteredClients.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {filteredClients.map(client => (
                      <Button
                        key={client.id}
                        variant="outline"
                        className="w-full justify-between text-left p-3 h-auto"
                        onClick={() => selectClient(client)}
                      >
                        <div>
                          <div className="font-medium">{client.name}</div>
                          <div className="text-sm text-gray-500">{client.phone}</div>
                        </div>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="text-sm text-gray-500 mb-3">Клиент не найден</div>
                    <Button 
                      variant="default" 
                      className="w-full"
                      onClick={() => {
                        const newClient = {
                          id: Date.now(),
                          name: clientSearchQuery,
                          phone: '',
                          orders: 0
                        };
                        selectClient(newClient);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Создать нового клиента "{clientSearchQuery}"
                    </Button>
                  </div>
                )}
              </div>
            )}

            {!clientSearchQuery && (
              <div className="text-center py-8 text-gray-400">
                <Search className="h-12 w-12 mx-auto mb-3" />
                <div className="text-sm">Начните вводить имя или телефон клиента</div>
              </div>
            )}
          </div>
        )}

        {/* Шаг 2: Выбор товаров */}
        {currentStep === 'items' && (
          <div className="p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Поиск товара..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Быстрые букеты */}
            {!searchQuery && (
              <div className="flex gap-2 pb-2">
                {quickBouquets.map(bouquet => (
                  <Button
                    key={bouquet.id}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      toast({
                        title: "Добавлен готовый букет",
                        description: bouquet.name,
                      });
                    }}
                  >
                    <div className="text-[10px]">{bouquet.name}</div>
                    <div className="text-xs font-semibold">{bouquet.price}₸</div>
                  </Button>
                ))}
              </div>
            )}

            {/* Сетка товаров */}
            <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
              {filteredProducts.map(product => {
                const selectedItem = selectedItems.find(si => si.id === product.id);
                const isSelected = !!selectedItem;
                const selectedQty = selectedItem?.selectedQuantity || 0;
                const totalPrice = selectedQty * product.price;
                
                return (
                  <Button
                    key={product.id}
                    variant={isSelected ? "default" : "outline"}
                    className="h-24 flex flex-col justify-between p-2 relative"
                    onClick={() => addItem(product)}
                    disabled={product.quantity === 0}
                  >
                    {isSelected && (
                      <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center">
                        {selectedQty}
                      </Badge>
                    )}
                    <div className="text-xs font-medium leading-tight line-clamp-2">
                      {product.name}
                    </div>
                    <div className="text-sm font-semibold">
                      {isSelected ? `${totalPrice}₸` : `${product.price}₸`}
                    </div>
                  </Button>
                );
              })}
            </div>

            {/* Управление выбранными */}
            {selectedItems.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setCurrentStep('client')}
                >
                  Назад
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => setCurrentStep('summary')}
                >
                  Далее ({getTotalAmount()} ₸)
                </Button>
              </div>
            )}

            {selectedItems.length === 0 && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setCurrentStep('client')}
              >
                Назад к выбору клиента
              </Button>
            )}
          </div>
        )}

        {/* Шаг 3: Подтверждение */}
        {currentStep === 'summary' && (
          <div className="p-4 space-y-3">
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setCurrentStep('items')}
              >
                Назад
              </Button>
              <Button
                className="flex-1"
                onClick={createOrder}
              >
                Создать заказ
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileFloristCRM;