import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const FloristCRM = () => {
  const { toast } = useToast();
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState('client');
  const [comment, setComment] = useState('');

  const clients = [
    { id: 1, name: 'Анна Сергеева', phone: '+7 777 123 4567', orders: 3 },
    { id: 2, name: 'Марат Казбеков', phone: '+7 701 234 5678', orders: 1 },
    { id: 3, name: 'Ольга Петрова', phone: '+7 778 345 6789', orders: 7 },
    { id: 4, name: 'Дамир Аскаров', phone: '+7 747 456 7890', orders: 2 },
  ];

  const inventory = [
    { id: 1, name: 'Розы красные', quantity: 15, price: 800 },
    { id: 2, name: 'Тюльпаны желтые', quantity: 8, price: 500 },
    { id: 3, name: 'Хризантемы белые', quantity: 12, price: 600 },
    { id: 4, name: 'Гипсофила', quantity: 5, price: 300 },
    { id: 5, name: 'Эвкалипт', quantity: 20, price: 200 },
    { id: 6, name: 'Лилии белые', quantity: 6, price: 1200 },
    { id: 7, name: 'Герберы розовые', quantity: 10, price: 700 },
    { id: 8, name: 'Альстромерия', quantity: 18, price: 450 },
    { id: 9, name: 'Пионы', quantity: 4, price: 1500 },
    { id: 10, name: 'Рускус', quantity: 25, price: 150 },
  ];

  const selectClient = (client: any) => {
    setSelectedClient(client);
    setCurrentStep('items');
  };

  const addItem = (item: any) => {
    const existing = selectedItems.find(si => si.id === item.id);
    if (existing) {
      if (existing.quantity < item.quantity) {
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
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    setSelectedItems(selectedItems.map(si => {
      if (si.id === itemId) {
        const newQuantity = si.quantity + delta;
        if (newQuantity <= 0) return si;
        if (newQuantity > item.quantity) return si;
        return { ...si, quantity: newQuantity };
      }
      return si;
    }));
  };

  const getTotalAmount = () => {
    return selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const createOrder = async () => {
    try {
      // Здесь будет интеграция с API
      toast({
        title: "Заказ создан!",
        description: `Клиент: ${selectedClient.name}, Сумма: ${getTotalAmount()} ₸`,
      });
      
      // Сброс состояния
      setSelectedClient(null);
      setSelectedItems([]);
      setComment('');
      setCurrentStep('client');
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось создать заказ",
        variant: "destructive",
      });
    }
  };

  const steps = [
    { id: 'client', label: 'Клиент', number: 1 },
    { id: 'items', label: 'Товары', number: 2 },
    { id: 'summary', label: 'Подтверждение', number: 3 },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 bg-background min-h-screen">
      {/* Шапка с шагами */}
      <div className="border-b pb-4 mb-6">
        <h1 className="text-3xl font-bold mb-4">Новый заказ - Прототип</h1>
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
          <h2 className="text-2xl font-semibold mb-4">Выберите клиента</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {clients.map(client => (
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
                    <Badge variant="secondary">
                      {client.orders} заказов
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-6 pt-4 border-t">
            <Button variant="outline">
              + Добавить нового клиента
            </Button>
          </div>
        </div>
      )}

      {/* Шаг 2: Выбор товаров */}
      {currentStep === 'items' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Склад</h2>
              <Badge variant="outline" className="text-base px-3 py-1">
                {selectedItems.length > 0 ? 
                  `${selectedItems.reduce((sum, item) => sum + item.quantity, 0)} позиций • ${getTotalAmount()} ₸` 
                  : 'Выберите товары'
                }
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {inventory.map(item => {
                const selectedItem = selectedItems.find(si => si.id === item.id);
                const selectedQuantity = selectedItem ? selectedItem.quantity : 0;
                
                return (
                  <Card
                    key={item.id}
                    className={cn(
                      "relative cursor-pointer transition-all hover:shadow-md",
                      item.quantity === 0 && "opacity-50 cursor-not-allowed",
                      selectedQuantity > 0 && "ring-2 ring-primary"
                    )}
                    onClick={() => item.quantity > 0 && addItem(item)}
                  >
                    <CardContent className="p-3 text-center">
                      {selectedQuantity > 0 && (
                        <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center">
                          {selectedQuantity}
                        </Badge>
                      )}
                      <div className="font-medium text-sm mb-1">{item.name}</div>
                      <div className="text-sm text-muted-foreground mb-1">{item.price}₸</div>
                      <Badge 
                        variant={
                          item.quantity > 10 ? "default" :
                          item.quantity > 5 ? "secondary" :
                          item.quantity > 0 ? "destructive" :
                          "outline"
                        }
                        className="text-xs"
                      >
                        {item.quantity} шт
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
                    Выберите товары из склада
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
              >
                Назад
              </Button>
              <Button 
                onClick={createOrder}
                className="flex-1"
              >
                Создать заказ
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloristCRM;