import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Clock, Gift, MapPin, Phone, User, Trash2, ChevronDown, CalendarIcon, Truck, Store, CreditCard } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useMediaQuery } from '@/hooks/use-media-query';
import { CheckoutStepper } from '@/components/checkout/CheckoutStepper';
import { PhoneInput } from '@/components/checkout/PhoneInput';
import { CartProvider, useCartContext } from '../context/CartContext';
import { ordersApi } from '../api/client';
import { cn } from '@/lib/utils';

function OrderSummaryContent({ deliveryFee, formatPrice }: { deliveryFee: number, formatPrice: (price: number) => string }) {
  const { cart, updateQuantity, removeFromCart, getTotalPrice } = useCartContext();

  return (
    <div className="space-y-4">
      {/* Cart Items */}
      <div className="space-y-3">
        {cart.items.map((item) => (
          <div key={item.id} className="flex gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm leading-tight truncate">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                {item.quantity} × {formatPrice(item.sale_price || item.retail_price)}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="h-6 w-6 p-0"
              >
                -
              </Button>
              <span className="w-6 text-center text-sm">{item.quantity}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="h-6 w-6 p-0"
              >
                +
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeFromCart(item.id)}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <Separator />
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Товары:</span>
          <span>{formatPrice(getTotalPrice())}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Доставка:</span>
          <span>{formatPrice(deliveryFee)}</span>
        </div>
        <Separator />
        <div className="flex justify-between font-bold">
          <span>Итого:</span>
          <span className="text-lg">{formatPrice(getTotalPrice() + deliveryFee)}</span>
        </div>
      </div>
    </div>
  );
}

function CheckoutContent() {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, clearCart, getTotalPrice } = useCartContext();
  
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const [formData, setFormData] = useState({
    customerPhone: '',
    recipientName: '',
    recipientPhone: '',
    address: '',
    deliveryMethod: 'delivery' as 'delivery' | 'self_pickup',
    deliveryDate: '',
    deliveryTime: '',
    cardText: ''
  });
  
  const timeSlots = [
    { from: '09:00', to: '11:00' },
    { from: '11:00', to: '13:00' },
    { from: '13:00', to: '15:00' },
    { from: '15:00', to: '17:00' },
    { from: '17:00', to: '19:00' },
    { from: '19:00', to: '21:00' },
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const deliveryFee = formData.deliveryMethod === 'delivery' ? 2000 : 0;
  const totalAmount = getTotalPrice() + deliveryFee;
  
  const steps = ['Контакты', 'Доставка', 'Оплата'];
  
  // Auto-advance to next step when current step is complete
  useEffect(() => {
    if (currentStep === 1 && formData.customerPhone && formData.recipientName) {
      // Step 1 is complete
    } else if (currentStep === 2 && selectedDate && selectedTimeSlot && 
              (formData.deliveryMethod === 'self_pickup' || formData.address)) {
      // Step 2 is complete
    }
  }, [currentStep, formData, selectedDate, selectedTimeSlot]);
  
  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return formData.customerPhone && formData.recipientName;
      case 2:
        return selectedDate && selectedTimeSlot && 
               (formData.deliveryMethod === 'self_pickup' || formData.address);
      case 3:
        return true; // Payment step is always valid
      default:
        return false;
    }
  };
  
  const handleTimeSlotSelect = (slot: string) => {
    setSelectedTimeSlot(slot);
    const [from, to] = slot.split('-');
    setFormData({
      ...formData,
      deliveryTime: `${from.trim()} - ${to.trim()}`
    });
  };
  
  const isToday = selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  const currentHour = new Date().getHours();
  
  const availableTimeSlots = timeSlots.filter(slot => {
    if (!isToday) return true;
    const slotHour = parseInt(slot.from.split(':')[0]);
    return slotHour > currentHour + 2; // Minimum 2 hours preparation
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shopId) return;
    
    setLoading(true);
    try {
      const orderData = {
        customer_phone: formData.customerPhone.replace(/\D/g, ''),
        recipient_name: formData.recipientName,
        recipient_phone: formData.recipientPhone.replace(/\D/g, '') || formData.customerPhone.replace(/\D/g, ''),
        address: formData.address,
        delivery_method: formData.deliveryMethod,
        delivery_fee: deliveryFee,
        shop_id: Number(shopId),
        card_text: formData.cardText,
        delivery_time_text: selectedDate ? `${format(selectedDate, 'yyyy-MM-dd')} ${formData.deliveryTime}` : '',
        items: cart.items.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.sale_price || item.retail_price
        }))
      };

      const response = await ordersApi.createPublic(orderData);
      
      // Clear cart and navigate to success page
      clearCart();
      navigate(`/shop/${shopId}/order-success/${response.tracking_token}`);
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Произошла ошибка при оформлении заказа. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Корзина пуста</h2>
            <p className="text-gray-600 mb-4">Добавьте товары для оформления заказа</p>
            <Button onClick={() => navigate(`/shop/${shopId}`)}>
              Вернуться к покупкам
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(`/shop/${shopId}`)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Вернуться в магазин</span>
              <span className="sm:hidden">Назад</span>
            </Button>
            <Badge variant="outline" className="sm:hidden">
              {cart.items.reduce((sum, item) => sum + item.quantity, 0)} товаров
            </Badge>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mb-4">Оформление заказа</h1>
          <CheckoutStepper steps={steps} currentStep={currentStep} />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {/* Mobile Order Summary */}
        {isMobile && (
          <Collapsible 
            open={showOrderSummary} 
            onOpenChange={setShowOrderSummary}
            className="mb-6"
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      Ваш заказ ({cart.items.length})
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{formatPrice(totalAmount)}</span>
                      <ChevronDown className={cn("h-4 w-4 transition-transform", showOrderSummary && "rotate-180")} />
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <OrderSummaryContent deliveryFee={deliveryFee} formatPrice={formatPrice} />
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}
        
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Order Form */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Contact Information */}
              {currentStep === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Phone className="h-5 w-5" />
                      Контактная информация
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="customerPhone">Ваш телефон *</Label>
                      <PhoneInput
                        id="customerPhone"
                        value={formData.customerPhone}
                        onChange={(value) => setFormData({...formData, customerPhone: value})}
                        required
                        className="max-w-[200px]"
                      />
                      <p className="text-xs text-muted-foreground">Для связи по заказу</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recipientName">Имя получателя *</Label>
                      <Input
                        id="recipientName"
                        type="text"
                        placeholder="Имя"
                        value={formData.recipientName}
                        onChange={(e) => setFormData({...formData, recipientName: e.target.value})}
                        required
                        className="max-w-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recipientPhone">Телефон получателя</Label>
                      <PhoneInput
                        id="recipientPhone"
                        value={formData.recipientPhone}
                        onChange={(value) => setFormData({...formData, recipientPhone: value})}
                        className="max-w-[200px]"
                      />
                      <p className="text-xs text-muted-foreground">Если отличается от вашего</p>
                    </div>
                    
                    <div className="pt-4">
                      <Button 
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        disabled={!isStepValid(1)}
                        className="w-full sm:w-auto"
                      >
                        Далее: Доставка
                        <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 2: Delivery */}
              {currentStep === 2 && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <MapPin className="h-5 w-5" />
                        Способ доставки
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <RadioGroup 
                        value={formData.deliveryMethod}
                        onValueChange={(value: 'delivery' | 'self_pickup') => setFormData({...formData, deliveryMethod: value})}
                      >
                        <div className={cn(
                          "flex items-start space-x-2 p-4 rounded-lg border-2 transition-all cursor-pointer",
                          formData.deliveryMethod === 'delivery' ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
                        )}>
                          <RadioGroupItem value="delivery" id="delivery" className="mt-1" />
                          <Label htmlFor="delivery" className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2 mb-1">
                              <Truck className="h-4 w-4 text-primary" />
                              <span className="font-medium">Доставка курьером</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              По городу: {formatPrice(2000)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Доставим в удобное время
                            </p>
                          </Label>
                        </div>
                        <div className={cn(
                          "flex items-start space-x-2 p-4 rounded-lg border-2 transition-all cursor-pointer",
                          formData.deliveryMethod === 'self_pickup' ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
                        )}>
                          <RadioGroupItem value="self_pickup" id="self_pickup" className="mt-1" />
                          <Label htmlFor="self_pickup" className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2 mb-1">
                              <Store className="h-4 w-4 text-primary" />
                              <span className="font-medium">Самовывоз</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Бесплатно
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              ул. Абая 150, с 9:00 до 21:00
                            </p>
                          </Label>
                        </div>
                      </RadioGroup>

                      {formData.deliveryMethod === 'delivery' && (
                        <div className="space-y-2 animate-in slide-in-from-top-2">
                          <Label htmlFor="address">Адрес доставки *</Label>
                          <Textarea
                            id="address"
                            placeholder="Город, улица, дом, квартира"
                            value={formData.address}
                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                            required={formData.deliveryMethod === 'delivery'}
                            className="max-w-xl min-h-[80px] resize-none"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Delivery Time */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Clock className="h-5 w-5" />
                        Время доставки
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Дата *</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full max-w-[280px] justify-start text-left font-normal",
                                !selectedDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {selectedDate ? (
                                format(selectedDate, "d MMMM yyyy", { locale: ru })
                              ) : (
                                <span>Выберите дату</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={selectedDate}
                              onSelect={(date) => {
                                setSelectedDate(date);
                                if (date) {
                                  setFormData({
                                    ...formData,
                                    deliveryDate: format(date, 'yyyy-MM-dd')
                                  });
                                }
                              }}
                              disabled={(date) => date < new Date() || date > addDays(new Date(), 30)}
                              initialFocus
                              locale={ru}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      {selectedDate && (
                        <div className="space-y-2 animate-in slide-in-from-top-2">
                          <Label>Время *</Label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {availableTimeSlots.length > 0 ? (
                              availableTimeSlots.map((slot) => (
                                <Button
                                  key={`${slot.from}-${slot.to}`}
                                  type="button"
                                  variant={selectedTimeSlot === `${slot.from}-${slot.to}` ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleTimeSlotSelect(`${slot.from}-${slot.to}`)}
                                  className="w-full"
                                >
                                  {slot.from} - {slot.to}
                                </Button>
                              ))
                            ) : (
                              <div className="col-span-full">
                                <Alert>
                                  <AlertDescription>
                                    На сегодня доставка уже недоступна. Выберите другую дату.
                                  </AlertDescription>
                                </Alert>
                              </div>
                            )}
                          </div>
                          {isToday && selectedTimeSlot && (
                            <p className="text-xs text-muted-foreground">
                              Минимальное время подготовки заказа - 2 часа
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Gift className="h-5 w-5" />
                        Открытка
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Label htmlFor="cardText">Текст открытки (необязательно)</Label>
                      <Textarea
                        id="cardText"
                        placeholder="Напишите пожелания..."
                        value={formData.cardText}
                        onChange={(e) => setFormData({...formData, cardText: e.target.value})}
                        rows={4}
                        className="max-w-xl resize-none"
                      />
                    </CardContent>
                  </Card>

                  {/* Step 2 Navigation */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                      className="w-full sm:w-auto order-2 sm:order-1"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Назад: Контакты
                    </Button>
                    <Button 
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      disabled={!isStepValid(2)}
                      className="w-full sm:w-auto order-1 sm:order-2"
                    >
                      Далее: Оплата
                      <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                    </Button>
                  </div>
                </>
              )}

              {/* Step 3: Payment */}
              {currentStep === 3 && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <CreditCard className="h-5 w-5" />
                        Способ оплаты
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="p-4 border rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">K</span>
                          </div>
                          <div>
                            <p className="font-medium">Kaspi Pay</p>
                            <p className="text-sm text-muted-foreground">
                              Оплата через приложение Kaspi.kz
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-3">
                          После оформления заказа вы получите ссылку для оплаты
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Order Summary for Step 3 */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Детали заказа</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Получатель:</span>
                          <span>{formData.recipientName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Способ доставки:</span>
                          <span>{formData.deliveryMethod === 'delivery' ? 'Курьером' : 'Самовывоз'}</span>
                        </div>
                        {formData.deliveryMethod === 'delivery' && formData.address && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Адрес:</span>
                            <span className="text-right max-w-[60%]">{formData.address}</span>
                          </div>
                        )}
                        {selectedDate && selectedTimeSlot && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Дата и время:</span>
                            <span className="text-right">
                              {format(selectedDate, "d MMM", { locale: ru })}, {selectedTimeSlot.replace('-', ' - ')}
                            </span>
                          </div>
                        )}
                      </div>
                      <Separator />
                      <div className="flex justify-between font-medium">
                        <span>Итого к оплате:</span>
                        <span className="text-lg">{formatPrice(totalAmount)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Step 3 Navigation */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(2)}
                      className="w-full sm:w-auto order-2 sm:order-1"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Назад: Доставка
                    </Button>
                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full sm:w-auto order-1 sm:order-2"
                      disabled={loading}
                    >
                      {loading ? 'Оформление...' : `Оформить заказ на ${formatPrice(totalAmount)}`}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </div>

          {/* Desktop Order Summary */}
          <div className="lg:col-span-1 hidden lg:block">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Ваш заказ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <OrderSummaryContent deliveryFee={deliveryFee} formatPrice={formatPrice} />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export function CheckoutPage() {
  const { shopId } = useParams<{ shopId: string }>();
  
  if (!shopId) {
    return <div>Shop ID is required</div>;
  }

  return (
    <CartProvider shopId={Number(shopId)}>
      <CheckoutContent />
    </CartProvider>
  );
}