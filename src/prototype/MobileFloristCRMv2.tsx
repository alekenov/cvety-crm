import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, X, ChevronRight, ShoppingBag, User, MapPin, Clock, Calendar, Truck, Store, MessageSquare, CheckCircle, Phone, CalendarDays, Package, MessageCircle, UserPlus, Users, Hash } from 'lucide-react';
// Removed Command imports for simpler client search

interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

interface ReadyProduct {
  id: string;
  name: string;
  price: number;
  description?: string;
  category: 'popular' | 'additional';
}

interface Client {
  id: number;
  name: string;
  phone: string;
  addresses?: string[];
  orderCount?: number;
}

interface DeliveryInfo {
  type: 'delivery' | 'pickup';
  date: 'today' | 'tomorrow' | 'after-tomorrow';
  time: 'express' | 'morning' | 'afternoon' | 'evening' | 'custom';
  customTime?: string;
  address?: string;
  recipientName?: string;
  recipientPhone?: string;
}

const MobileFloristCRMv2 = () => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<'products' | 'delivery' | 'summary'>('products');
  const [productMode, setProductMode] = useState<'ready' | 'custom'>('ready');
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({
    type: 'delivery',
    date: 'today',
    time: 'morning',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [floristNote, setFloristNote] = useState('');
  const [courierNote, setCourierNote] = useState('');
  const [showFloristNote, setShowFloristNote] = useState(false);
  const [showCourierNote, setShowCourierNote] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Готовые букеты и товары
  const readyProducts: ReadyProduct[] = [
    { id: 'roses25', name: '25 роз', price: 12500, category: 'popular' },
    { id: 'roses51', name: '51 роза', price: 25500, category: 'popular' },
    { id: 'roses101', name: '101 роза', price: 50500, category: 'popular' },
    { id: 'bouquet-day', name: 'Букет дня', price: 8000, category: 'popular' },
    { id: 'wedding', name: 'Свадебный', price: 15000, category: 'popular' },
    { id: 'birthday', name: 'Юбилейный', price: 12000, category: 'popular' },
    { id: 'vase', name: 'Ваза стеклянная', price: 3000, category: 'additional' },
    { id: 'card', name: 'Открытка', price: 500, category: 'additional' },
    { id: 'toy', name: 'Мягкая игрушка', price: 4000, category: 'additional' },
  ];

  // Товары для конструктора
  const products: Product[] = [
    { id: 1, name: 'Розы красные', price: 500, quantity: 50, category: 'flowers' },
    { id: 2, name: 'Розы белые', price: 500, quantity: 30, category: 'flowers' },
    { id: 3, name: 'Тюльпаны', price: 300, quantity: 40, category: 'flowers' },
    { id: 4, name: 'Хризантемы', price: 400, quantity: 25, category: 'flowers' },
    { id: 5, name: 'Гипсофила', price: 200, quantity: 15, category: 'greens' },
    { id: 6, name: 'Эвкалипт', price: 150, quantity: 20, category: 'greens' },
    { id: 7, name: 'Лилии белые', price: 800, quantity: 10, category: 'flowers' },
    { id: 8, name: 'Герберы', price: 450, quantity: 15, category: 'flowers' },
    { id: 9, name: 'Пионы', price: 1200, quantity: 8, category: 'flowers' },
  ];

  // Примеры клиентов
  const [clients, setClients] = useState<Client[]>([
    { id: 1, name: 'Анна Сергеева', phone: '+77771234567', addresses: ['ул. Абая 150, кв. 25', 'пр. Достык 89'], orderCount: 5 },
    { id: 2, name: 'Марат Казбеков', phone: '+77012345678', addresses: ['ул. Сатпаева 22'], orderCount: 2 },
    { id: 3, name: 'Ольга Петрова', phone: '+77781234567', addresses: ['ул. Пушкина 12, кв. 45'], orderCount: 8 },
    { id: 4, name: 'Дамир Аскаров', phone: '+77477654321', addresses: ['пр. Назарбаева 34'], orderCount: 0 },
    { id: 5, name: 'Елена Иванова', phone: '+77052223344', addresses: ['ул. Гоголя 78, офис 5'], orderCount: 12 },
    { id: 6, name: 'Арман Жумабеков', phone: '+77759998877', addresses: [], orderCount: 3 },
  ]);

  const addReadyProduct = (product: ReadyProduct) => {
    setSelectedItems([...selectedItems, { ...product, selectedQuantity: 1, isReady: true }]);
  };

  const addCustomProduct = (product: Product) => {
    const existing = selectedItems.find(si => si.id === product.id && !si.isReady);
    if (existing) {
      if (existing.selectedQuantity < product.quantity) {
        setSelectedItems(selectedItems.map(si => 
          si.id === product.id && !si.isReady 
            ? { ...si, selectedQuantity: si.selectedQuantity + 1 } 
            : si
        ));
      }
    } else {
      setSelectedItems([...selectedItems, { ...product, selectedQuantity: 1, isReady: false }]);
    }
  };

  const removeItem = (item: any) => {
    setSelectedItems(selectedItems.filter(si => 
      si.isReady ? si.id !== item.id : (si.id !== item.id || si.isReady !== item.isReady)
    ));
  };

  const getTotalAmount = () => {
    return selectedItems.reduce((sum, item) => {
      const price = item.isReady ? item.price : (item.price * item.selectedQuantity);
      return sum + price;
    }, 0);
  };

  const formatPhone = (value: string) => {
    // Удаляем все не-цифры
    const numbers = value.replace(/\D/g, '');
    
    // Форматируем в формат +7 XXX XXX XX XX
    if (numbers.length === 0) return '';
    if (numbers.length === 1 && numbers[0] === '7') return '+7 ';
    
    let formatted = '';
    if (numbers[0] === '7') {
      formatted = '+7 ';
      const rest = numbers.slice(1);
      if (rest.length > 0) formatted += rest.slice(0, 3);
      if (rest.length > 3) formatted += ' ' + rest.slice(3, 6);
      if (rest.length > 6) formatted += ' ' + rest.slice(6, 8);
      if (rest.length > 8) formatted += ' ' + rest.slice(8, 10);
    } else if (numbers[0] === '8') {
      // Конвертируем 8 в +7
      formatted = '+7 ';
      const rest = numbers.slice(1);
      if (rest.length > 0) formatted += rest.slice(0, 3);
      if (rest.length > 3) formatted += ' ' + rest.slice(3, 6);
      if (rest.length > 6) formatted += ' ' + rest.slice(6, 8);
      if (rest.length > 8) formatted += ' ' + rest.slice(8, 10);
    } else {
      // Если не начинается с 7 или 8, добавляем +7
      formatted = '+7 ';
      if (numbers.length > 0) formatted += numbers.slice(0, 3);
      if (numbers.length > 3) formatted += ' ' + numbers.slice(3, 6);
      if (numbers.length > 6) formatted += ' ' + numbers.slice(6, 8);
      if (numbers.length > 8) formatted += ' ' + numbers.slice(8, 10);
    }
    
    return formatted;
  };

  const validatePhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, '');
    if (numbers.length === 0) {
      setPhoneError('');
      return false;
    }
    if (numbers.length !== 11 || (numbers[0] !== '7' && numbers[0] !== '8')) {
      setPhoneError('Введите корректный номер телефона');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value);
    setClientPhone(formatted);
    validatePhone(formatted);
  };

  const searchClient = () => {
    if (validatePhone(clientPhone)) {
      const numbers = clientPhone.replace(/\D/g, '');
      const found = clients.find(c => 
        c.phone.replace(/\D/g, '').includes(numbers)
      );
      if (found) {
        setSelectedClient(found);
        setPhoneError('');
      } else {
        setPhoneError('Клиент не найден');
      }
    }
  };



  const getDateLabel = (date: string) => {
    switch(date) {
      case 'today': return 'Сегодня';
      case 'tomorrow': return 'Завтра';
      case 'after-tomorrow': return 'Послезавтра';
      default: return date;
    }
  };

  const getTimeLabel = (time: string) => {
    switch(time) {
      case 'express': return 'Экспресс (1-4 часа)';
      case 'morning': return 'Утром (9:00-12:00)';
      case 'afternoon': return 'Днем (13:30-17:30)';
      case 'evening': return 'Вечером (17:30-21:00)';
      case 'custom': return deliveryInfo.customTime || 'Выбрать время';
      default: return time;
    }
  };

  const getDeliveryPrice = (): number => {
    if (deliveryInfo.time === 'express' && deliveryInfo.date === 'today') return 99;
    return 0;
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 md:py-6">
      <div className="max-w-5xl mx-auto md:px-6 bg-background md:rounded-lg md:shadow-lg overflow-hidden flex flex-col h-screen md:h-[calc(100vh-3rem)]">
        {/* Верхняя панель - Результат */}
        <div className="bg-white border-b shadow-sm">
          {/* Индикатор шагов */}
          <div className="flex justify-between p-2 text-xs md:text-sm md:p-3">
          <div className={cn(
            "flex-1 text-center py-1 md:py-2 rounded-l transition-colors",
            currentStep === 'products' ? 'bg-primary text-white' : 'bg-gray-100'
          )}>
            Товары
          </div>
          <div className={cn(
            "flex-1 text-center py-1 md:py-2 transition-colors",
            currentStep === 'delivery' ? 'bg-primary text-white' : 'bg-gray-100'
          )}>
            Доставка
          </div>
          <div className={cn(
            "flex-1 text-center py-1 md:py-2 rounded-r transition-colors",
            currentStep === 'summary' ? 'bg-primary text-white' : 'bg-gray-100'
          )}>
            Итог
          </div>
          </div>
        </div>

        {/* Панель результата */}
        <div className="p-3 space-y-2">
          {/* Состав заказа - только на шаге товаров */}
          {currentStep === 'products' && selectedItems.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ShoppingBag className="h-4 w-4" />
                <span>Заказ:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedItems.map((item, idx) => (
                  <Badge key={`${item.id}-${idx}`} variant="secondary" className="text-xs">
                    {item.name} {!item.isReady && `x${item.selectedQuantity}`}
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer" 
                      onClick={() => removeItem(item)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="text-right font-bold text-lg">
                Сумма: {getTotalAmount()} ₸
              </div>
            </div>
          )}

          {/* Информация о доставке - компактная версия */}
          {currentStep === 'delivery' && (
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium">Сумма заказа:</span>
              </div>
              <span className="text-lg font-bold text-purple-600">{getTotalAmount()} ₸</span>
            </div>
          )}

          {/* Итоговая информация */}
          {currentStep === 'summary' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-sm">Заказ:</span>
                <span className="font-bold">{getTotalAmount()} ₸</span>
              </div>
              {selectedClient && (
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <User className="h-4 w-4 text-gray-600" />
                  <div className="text-sm">
                    <div className="font-medium">{selectedClient.name}</div>
                    <div className="text-xs text-gray-500">
                      {deliveryInfo.type === 'delivery' ? 'Доставка' : 'Самовывоз'} • 
                      {' '}{getDateLabel(deliveryInfo.date)} • 
                      {' '}{getTimeLabel(deliveryInfo.time)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Пустое состояние */}
          {selectedItems.length === 0 && currentStep === 'products' && (
            <div className="text-center py-4 text-gray-400">
              <ShoppingBag className="h-12 w-12 mx-auto mb-2" />
              <div className="text-sm">Выберите товары</div>
            </div>
          )}
        </div>

      {/* Центральная область для summary */}
      {currentStep === 'summary' && (
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-2">Состав заказа</h3>
                <div className="space-y-2">
                  {selectedItems.map((item, idx) => (
                    <div key={`${item.id}-${idx}`} className="flex justify-between items-center">
                      <div>
                        <div className="text-sm font-medium">{item.name}</div>
                        {!item.isReady && (
                          <div className="text-xs text-gray-500">
                            {item.selectedQuantity} × {item.price} ₸
                          </div>
                        )}
                      </div>
                      <div className="font-medium">
                        {item.isReady ? item.price : (item.selectedQuantity * item.price)} ₸
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

            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-2">Информация о доставке</h3>
                <div className="space-y-1 text-sm">
                  <div><strong>Клиент:</strong> {selectedClient?.name}</div>
                  <div><strong>Телефон:</strong> {selectedClient?.phone}</div>
                  <div><strong>Тип:</strong> {deliveryInfo.type === 'delivery' ? 'Доставка' : 'Самовывоз'}</div>
                  <div><strong>Дата:</strong> {getDateLabel(deliveryInfo.date)}</div>
                  <div><strong>Время:</strong> {getTimeLabel(deliveryInfo.time)}</div>
                  {deliveryInfo.address && (
                    <div><strong>Адрес:</strong> {deliveryInfo.address}</div>
                  )}
                  {deliveryInfo.recipientName && (
                    <div><strong>Получатель:</strong> {deliveryInfo.recipientName}</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {(floristNote || courierNote) && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-2">Заметки</h3>
                  {floristNote && (
                    <div className="mb-2">
                      <div className="text-xs text-gray-500">Для флориста:</div>
                      <div className="text-sm">{floristNote}</div>
                    </div>
                  )}
                  {courierNote && (
                    <div>
                      <div className="text-xs text-gray-500">Для курьера:</div>
                      <div className="text-sm">{courierNote}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
        </div>
      )}

      {/* Центральная область для доставки */}
      {currentStep === 'delivery' && (
        <div className="flex-1 overflow-y-auto p-2 max-w-2xl mx-auto w-full space-y-2">
          {/* Карточка способа получения */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={deliveryInfo.type === 'delivery' ? 'default' : 'outline'}
                  className="flex-1 font-medium"
                  onClick={() => setDeliveryInfo({...deliveryInfo, type: 'delivery'})}
                >
                  Доставка
                </Button>
                <Button
                  type="button"
                  variant={deliveryInfo.type === 'pickup' ? 'default' : 'outline'}
                  className="flex-1 font-medium"
                  onClick={() => setDeliveryInfo({...deliveryInfo, type: 'pickup'})}
                >
                  Самовывоз
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Карточка выбора клиента */}
          <Card>
            <CardContent className="p-4">
                  
                  {selectedClient ? (
                    <div className="p-3 bg-secondary rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-secondary-foreground/10 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium">{selectedClient.name}</div>
                          <div className="text-sm text-gray-600">{formatPhone(selectedClient.phone)}</div>
                          {selectedClient.orderCount !== undefined && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              Заказов: {selectedClient.orderCount}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedClient(null);
                          setClientPhone('');
                          setPhoneError('');
                        }}
                      >
                        Изменить
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex w-full items-center gap-2">
                        <Input
                          type="tel"
                          placeholder="+7 (___) ___-__-__"
                          value={clientPhone}
                          onChange={(e) => {
                            const formatted = formatPhone(e.target.value);
                            setClientPhone(formatted);
                            // Автоматический поиск клиента по телефону
                            if (formatted.replace(/\D/g, '').length >= 11) {
                              const found = clients.find(c => 
                                c.phone.replace(/\D/g, '') === formatted.replace(/\D/g, '')
                              );
                              if (found) {
                                setSelectedClient(found);
                              }
                            }
                          }}
                          maxLength={18}
                          autoFocus
                        />
                        <Button 
                          size="icon"
                          onClick={() => {
                            if (clientPhone && clientPhone.replace(/\D/g, '').length >= 11) {
                              const newClient: Client = {
                                id: Date.now(),
                                name: 'Новый клиент',
                                phone: clientPhone.replace(/\D/g, ''),
                                orderCount: 0
                              };
                              setSelectedClient(newClient);
                            }
                          }}
                          disabled={!clientPhone || clientPhone.replace(/\D/g, '').length < 11}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {clientPhone && clientPhone.replace(/\D/g, '').length < 11 && (
                        <div className="text-xs text-gray-500 text-center">
                          Введите полный номер телефона
                        </div>
                      )}
                    </div>
                  )}
            </CardContent>
          </Card>

          {/* Карточка даты и времени доставки */}
          <Card>
            <CardContent className="p-4 space-y-4">

                  {/* Выбор даты и времени доставки */}
                  <div className="space-y-4">
                    {/* Выбор даты */}
                    <div>
                      <Label className="text-sm mb-2">Дата доставки</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={deliveryInfo.date === 'today' ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1"
                          onClick={() => setDeliveryInfo({...deliveryInfo, date: 'today'})}
                        >
                          Сегодня
                        </Button>
                        <Button
                          type="button"
                          variant={deliveryInfo.date === 'tomorrow' ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1"
                          onClick={() => setDeliveryInfo({...deliveryInfo, date: 'tomorrow', time: deliveryInfo.time === 'express' ? 'morning' : deliveryInfo.time})}
                        >
                          Завтра
                        </Button>
                      </div>
                    </div>
                    
                    {/* Выбор времени */}
                    <div>
                      <Label className="text-sm mb-2">Время доставки</Label>
                      <div className="flex gap-2 overflow-x-auto">
                        {deliveryInfo.date === 'today' && (
                          <Button
                            type="button"
                            variant={deliveryInfo.time === 'express' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setDeliveryInfo({...deliveryInfo, time: 'express'})}
                          >
                            120-150 мин
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant={deliveryInfo.time === 'morning' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setDeliveryInfo({...deliveryInfo, time: 'morning'})}
                        >
                          9:00-12:00
                        </Button>
                        <Button
                          type="button"
                          variant={deliveryInfo.time === 'afternoon' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setDeliveryInfo({...deliveryInfo, time: 'afternoon'})}
                        >
                          13:30-17:30
                        </Button>
                        <Button
                          type="button"
                          variant={deliveryInfo.time === 'evening' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setDeliveryInfo({...deliveryInfo, time: 'evening'})}
                        >
                          17:30-21:00
                        </Button>
                        <Button
                          type="button"
                          variant={deliveryInfo.time === 'custom' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setDeliveryInfo({...deliveryInfo, time: 'custom', customTime: '18:00-19:00'})}
                          className={cn(
                            "flex-shrink-0 text-center py-2 px-3 text-sm font-medium transition-all rounded-none",
                            deliveryInfo.time === 'custom' && deliveryInfo.customTime === '18:00-19:00'
                              ? "border-2 border-primary bg-primary/5 text-primary"
                              : "border border-gray-200 bg-background text-gray-700 hover:bg-accent"
                          )}
                        >
                          18:00-19:00
                        </Button>
                        <Button
                          type="button"
                          variant={deliveryInfo.time === 'custom' && deliveryInfo.customTime === '19:00-20:00' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setDeliveryInfo({...deliveryInfo, time: 'custom', customTime: '19:00-20:00'})}
                        >
                          19:00-20:00
                        </Button>
                        <Button
                          type="button"
                          variant={deliveryInfo.time === 'custom' && deliveryInfo.customTime === '20:00-21:00' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setDeliveryInfo({...deliveryInfo, time: 'custom', customTime: '20:00-21:00'})}
                        >
                          20:00-21:00
                        </Button>
                      </div>
                    </div>
                    
                    {/* Checkbox для уточнения времени */}
                    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Checkbox 
                        id="clarify-time"
                        checked={deliveryInfo.clarifyTime || false}
                        onCheckedChange={(checked) => setDeliveryInfo({...deliveryInfo, clarifyTime: !!checked})}
                      />
                      <div className="space-y-1">
                        <Label htmlFor="clarify-time" className="text-sm font-medium cursor-pointer">
                          Уточнить время у получателя
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Мы сами свяжемся и согласуем доставку
                        </p>
                      </div>
                    </div>
                  </div>
            </CardContent>
          </Card>

          {/* Карточка адреса доставки - показываем только если выбрана доставка */}
          {deliveryInfo.type === 'delivery' && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Адрес доставки */}
                  <div>
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-5 h-5 text-gray-500" />
                        <h3 className="text-base font-semibold">Адрес доставки</h3>
                      </div>
                      <span className="text-sm text-gray-500 ml-7">Доставим по указанному адресу</span>
                    </div>
                    
                    <div className="space-y-3">
                      <Input
                        placeholder="Улица и номер дома"
                        value={deliveryInfo.address || ''}
                        onChange={(e) => setDeliveryInfo({...deliveryInfo, address: e.target.value})}
                      />
                      
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          placeholder="Квартира/офис"
                          value={deliveryInfo.apartment || ''}
                          onChange={(e) => setDeliveryInfo({...deliveryInfo, apartment: e.target.value})}
                        />
                        <Input
                          placeholder="Этаж"
                          value={deliveryInfo.floor || ''}
                          onChange={(e) => setDeliveryInfo({...deliveryInfo, floor: e.target.value})}
                        />
                      </div>
                    </div>
                    {selectedClient?.addresses && selectedClient.addresses.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-muted-foreground mb-1">Сохраненные адреса:</div>
                        {selectedClient.addresses.map((addr, idx) => (
                          <Button
                            key={idx}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-sm"
                            onClick={() => setDeliveryInfo({...deliveryInfo, address: addr})}
                          >
                            <MapPin className="h-3 w-3 mr-2" />
                            {addr}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm mb-1">Получатель (если отличается от заказчика)</Label>
                    <div className="space-y-2">
                      <Input
                        placeholder="Имя получателя"
                        value={deliveryInfo.recipientName || ''}
                        onChange={(e) => setDeliveryInfo({...deliveryInfo, recipientName: e.target.value})}
                      />
                      <Input
                        placeholder="Телефон получателя"
                        value={deliveryInfo.recipientPhone || ''}
                        onChange={(e) => setDeliveryInfo({...deliveryInfo, recipientPhone: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Кнопка добавления комментария */}
          {!deliveryInfo.showComment ? (
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={() => setDeliveryInfo({...deliveryInfo, showComment: true})}
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить комментарий для курьера
            </Button>
          ) : (
            <Card>
              <CardContent className="p-4">
                <div>
                  <Label className="text-sm mb-1">Комментарий для курьера</Label>
                  <Textarea
                    placeholder="Например: позвонить за час до доставки"
                    value={deliveryInfo.comment || ''}
                    onChange={(e) => setDeliveryInfo({...deliveryInfo, comment: e.target.value})}
                    className="min-h-[80px]"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Навигация - закрепленная внизу */}
          <div className="mt-4">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={() => setCurrentStep('products')}
                >
                  Назад
                </Button>
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={() => {
                    if (validatePhone(clientPhone)) {
                      setCurrentStep('summary');
                    }
                  }}
                  disabled={!clientPhone || phoneError !== '' || (deliveryInfo.type === 'delivery' && !deliveryInfo.address)}
                >
                  Далее
                </Button>
              </div>
          </div>
        </div>
      )}

      {/* Spacer для остальных шагов */}
      {currentStep === 'products' && <div className="flex-1"></div>}

      {/* Нижняя панель - Ввод */}
      <div className="bg-white border-t shadow-lg">
        {/* Шаг 1: Выбор товаров */}
        {currentStep === 'products' && (
          <div className="p-4 space-y-3">
            {/* Переключатель режима */}
            <div className="flex gap-2 md:max-w-md md:mx-auto">
              <Button
                variant={productMode === 'ready' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setProductMode('ready')}
              >
                Готовые букеты
              </Button>
              <Button
                variant={productMode === 'custom' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setProductMode('custom')}
              >
                Собрать букет
              </Button>
            </div>

            {/* Готовые букеты */}
            {productMode === 'ready' && (
              <div className="space-y-1">
                <div className="text-xs text-gray-500">Популярные:</div>
                <div className="grid grid-cols-3 gap-2">
                  {readyProducts.filter(p => p.category === 'popular').map(product => (
                    <Button
                      key={product.id}
                      variant="outline"
                      className="h-16 flex flex-col justify-center p-1"
                      onClick={() => addReadyProduct(product)}
                    >
                      <div className="text-xs font-medium">{product.name}</div>
                      <div className="text-sm font-semibold mt-1">{product.price}₸</div>
                    </Button>
                  ))}
                </div>
                <div className="text-xs text-gray-500">Дополнительно:</div>
                <div className="grid grid-cols-3 gap-2">
                  {readyProducts.filter(p => p.category === 'additional').map(product => (
                    <Button
                      key={product.id}
                      variant="outline"
                      className="h-14 flex flex-col justify-center p-1"
                      onClick={() => addReadyProduct(product)}
                    >
                      <div className="text-xs">{product.name}</div>
                      <div className="text-xs font-semibold">{product.price}₸</div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Конструктор букета */}
            {productMode === 'custom' && (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Поиск товара..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                  {filteredProducts.map(product => {
                    const selectedItem = selectedItems.find(si => si.id === product.id && !si.isReady);
                    const isSelected = !!selectedItem;
                    const selectedQty = selectedItem?.selectedQuantity || 0;
                    const totalPrice = selectedQty * product.price;
                    
                    return (
                      <Button
                        key={product.id}
                        variant={isSelected ? "default" : "outline"}
                        className="h-20 flex flex-col justify-between p-2 relative"
                        onClick={() => addCustomProduct(product)}
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
              </div>
            )}

            {/* Навигация */}
            <Button
              className="w-full"
              onClick={() => setCurrentStep('delivery')}
              disabled={selectedItems.length === 0}
            >
              Далее {selectedItems.length > 0 && `(${getTotalAmount()} ₸)`}
            </Button>
          </div>
        )}

        {/* Шаг 3: Итог */}
        {currentStep === 'summary' && (
          <div className="p-4 space-y-3">
            {/* Кнопки заметок */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setShowFloristNote(!showFloristNote)}
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                Флористу
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setShowCourierNote(!showCourierNote)}
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                Курьеру
              </Button>
            </div>

            {/* Поля для заметок */}
            {showFloristNote && (
              <Input
                placeholder="Заметка для флориста..."
                value={floristNote}
                onChange={(e) => setFloristNote(e.target.value)}
              />
            )}
            {showCourierNote && (
              <Input
                placeholder="Заметка для курьера..."
                value={courierNote}
                onChange={(e) => setCourierNote(e.target.value)}
              />
            )}

            {/* Навигация */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setCurrentStep('delivery')}
              >
                Назад
              </Button>
              <Button
                className="flex-1"
                onClick={() => setShowConfirmDialog(true)}
              >
                Создать заказ
              </Button>
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Диалог подтверждения создания заказа */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Подтверждение заказа</DialogTitle>
            <DialogDescription>
              Проверьте правильность данных перед созданием заказа
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Сумма заказа:</span>
              <span className="text-lg font-bold text-purple-600">{getTotalAmount()} ₸</span>
            </div>
            
            {selectedClient && (
              <div className="p-3 bg-gray-50 rounded-lg space-y-1">
                <div className="text-sm">
                  <span className="font-medium">Клиент:</span> {selectedClient.name}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Телефон:</span> {selectedClient.phone}
                </div>
              </div>
            )}
            
            <div className="p-3 bg-gray-50 rounded-lg space-y-1">
              <div className="text-sm">
                <span className="font-medium">Способ получения:</span> {deliveryInfo.type === 'delivery' ? 'Доставка' : 'Самовывоз'}
              </div>
              <div className="text-sm">
                <span className="font-medium">Дата:</span> {getDateLabel(deliveryInfo.date)}
              </div>
              <div className="text-sm">
                <span className="font-medium">Время:</span> {getTimeLabel(deliveryInfo.time)}
              </div>
              {deliveryInfo.address && (
                <div className="text-sm">
                  <span className="font-medium">Адрес:</span> {deliveryInfo.address}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmDialog(false)}
            >
              Отмена
            </Button>
            <Button 
              onClick={() => {
                // Создаем заказ
                toast({
                  title: "Заказ успешно создан!",
                  description: (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Номер заказа: #{Math.floor(Math.random() * 10000)}</span>
                    </div>
                  ),
                });
                
                // Reset все состояния
                setSelectedItems([]);
                setSelectedClient(null);
                setDeliveryInfo({ type: 'delivery', date: 'today', time: 'asap' });
                setClientPhone('');
                setFloristNote('');
                setCourierNote('');
                setCurrentStep('products');
                setShowConfirmDialog(false);
              }}
            >
              Подтвердить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MobileFloristCRMv2;