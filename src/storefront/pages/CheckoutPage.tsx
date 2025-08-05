import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, User, MapPin, Clock, Gift, Truck, Store, CalendarIcon } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PhoneInput } from '@/components/checkout/PhoneInput';
import { PaymentMethods } from '../components/checkout/PaymentMethods';
import { CartProvider, useCartContext } from '../context/CartContext';
import { ordersApi } from '../api/client';
import { cn } from '@/lib/utils';

function CheckoutContent() {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  const { cart, clearCart, getTotalPrice } = useCartContext();
  
  const [loading, setLoading] = useState(false);
  const [orderType, setOrderType] = useState<'gift' | 'self'>('gift');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  
  const [formData, setFormData] = useState({
    customerPhone: '',
    customerName: '',
    recipientName: '',
    recipientPhone: '',
    address: '',
    deliveryMethod: 'delivery' as 'delivery' | 'self_pickup',
    paymentMethod: 'kaspi',
    cardText: '',
    clarifyTimeWithRecipient: false,
    clarifyAddressWithRecipient: false,
    courierComment: ''
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
  const serviceFee = 990;
  const totalAmount = getTotalPrice() + deliveryFee + serviceFee;
  
  const handleTimeSlotSelect = (slot: string) => {
    setSelectedTimeSlot(slot);
  };
  
  const isToday = selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  const currentHour = new Date().getHours();
  
  const availableTimeSlots = timeSlots.filter(slot => {
    if (!isToday) return true;
    const slotHour = parseInt(slot.from.split(':')[0]);
    return slotHour > currentHour + 2;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shopId) return;
    
    setLoading(true);
    try {
      const orderData = {
        customer_phone: formData.customerPhone.replace(/\D/g, ''),
        recipient_name: orderType === 'self' ? formData.customerName : formData.recipientName,
        recipient_phone: orderType === 'self' 
          ? formData.customerPhone.replace(/\D/g, '') 
          : formData.recipientPhone.replace(/\D/g, ''),
        address: formData.address,
        delivery_method: formData.deliveryMethod,
        delivery_fee: deliveryFee,
        shop_id: Number(shopId),
        card_text: formData.cardText,
        delivery_time_text: selectedDate && selectedTimeSlot 
          ? `${format(selectedDate, 'yyyy-MM-dd')} ${selectedTimeSlot.replace('-', ' - ')}`
          : '',
        items: cart.items.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.sale_price || item.retail_price
        }))
      };

      const response = await ordersApi.createPublic(orderData);
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
    navigate(`/shop/${shopId}/cart`);
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(`/shop/${shopId}/cart`)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад
            </Button>
            <h1 className="text-xl font-bold">Оформление заказа</h1>
            <Button 
              variant="ghost" 
              size="sm"
              className="ml-auto"
              onClick={() => clearCart()}
            >
              Очистить
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left Column - Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Type Selection */}
              <Card>
                <CardContent className="pt-6">
                  <RadioGroup 
                    value={orderType} 
                    onValueChange={(value: 'gift' | 'self') => setOrderType(value)}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div className={cn(
                      "flex items-center space-x-2 p-4 rounded-lg border-2 cursor-pointer transition-all",
                      orderType === 'gift' ? "border-primary bg-primary/5" : "border-gray-200"
                    )}>
                      <RadioGroupItem value="gift" id="gift" />
                      <Label htmlFor="gift" className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Gift className="h-5 w-5" />
                          <span className="font-medium">Хочу подарить</span>
                        </div>
                      </Label>
                    </div>
                    <div className={cn(
                      "flex items-center space-x-2 p-4 rounded-lg border-2 cursor-pointer transition-all",
                      orderType === 'self' ? "border-primary bg-primary/5" : "border-gray-200"
                    )}>
                      <RadioGroupItem value="self" id="self" />
                      <Label htmlFor="self" className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          <span className="font-medium">Заказываю себе</span>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Delivery Time */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Когда доставить
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Date Selection */}
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant={selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? "default" : "outline"}
                      onClick={() => setSelectedDate(new Date())}
                    >
                      Сегодня
                    </Button>
                    <Button
                      type="button"
                      variant={selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(addDays(new Date(), 1), 'yyyy-MM-dd') ? "default" : "outline"}
                      onClick={() => setSelectedDate(addDays(new Date(), 1))}
                    >
                      Завтра
                    </Button>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline">
                          <CalendarIcon className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          disabled={(date) => date < new Date() || date > addDays(new Date(), 30)}
                          initialFocus
                          locale={ru}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Time Slots */}
                  {selectedDate && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        {availableTimeSlots.length > 0 ? (
                          availableTimeSlots.map((slot) => (
                            <Button
                              key={`${slot.from}-${slot.to}`}
                              type="button"
                              variant={selectedTimeSlot === `${slot.from}-${slot.to}` ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleTimeSlotSelect(`${slot.from}-${slot.to}`)}
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
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="clarifyTime"
                          checked={formData.clarifyTimeWithRecipient}
                          onCheckedChange={(checked) => 
                            setFormData({...formData, clarifyTimeWithRecipient: checked as boolean})
                          }
                        />
                        <Label htmlFor="clarifyTime" className="text-sm cursor-pointer">
                          <span className="font-medium">Уточнить время у получателя</span>
                          <span className="text-muted-foreground block">
                            Мы сами свяжемся и согласуем доставку
                          </span>
                        </Label>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recipient Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Информация о получателе
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {orderType === 'gift' ? (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="recipientName">Имя получателя *</Label>
                          <Input
                            id="recipientName"
                            value={formData.recipientName}
                            onChange={(e) => setFormData({...formData, recipientName: e.target.value})}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="recipientPhone">Телефон получателя *</Label>
                          <PhoneInput
                            id="recipientPhone"
                            value={formData.recipientPhone}
                            onChange={(value) => setFormData({...formData, recipientPhone: value})}
                            required
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="customerName">Ваше имя *</Label>
                        <Input
                          id="customerName"
                          value={formData.customerName}
                          onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="customerPhone">Ваш телефон *</Label>
                        <PhoneInput
                          id="customerPhone"
                          value={formData.customerPhone}
                          onChange={(value) => setFormData({...formData, customerPhone: value})}
                          required
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Delivery Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Адрес доставки
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup 
                    value={formData.deliveryMethod}
                    onValueChange={(value: 'delivery' | 'self_pickup') => 
                      setFormData({...formData, deliveryMethod: value})
                    }
                  >
                    <div className={cn(
                      "flex items-start space-x-2 p-4 rounded-lg border-2 transition-all cursor-pointer",
                      formData.deliveryMethod === 'delivery' ? "border-primary bg-primary/5" : "border-gray-200"
                    )}>
                      <RadioGroupItem value="delivery" id="delivery" className="mt-1" />
                      <Label htmlFor="delivery" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2 mb-1">
                          <Truck className="h-4 w-4" />
                          <span className="font-medium">Доставка курьером</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          По городу: {formatPrice(2000)}
                        </p>
                      </Label>
                    </div>
                    <div className={cn(
                      "flex items-start space-x-2 p-4 rounded-lg border-2 transition-all cursor-pointer",
                      formData.deliveryMethod === 'self_pickup' ? "border-primary bg-primary/5" : "border-gray-200"
                    )}>
                      <RadioGroupItem value="self_pickup" id="self_pickup" className="mt-1" />
                      <Label htmlFor="self_pickup" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2 mb-1">
                          <Store className="h-4 w-4" />
                          <span className="font-medium">Самовывоз</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Бесплатно • ул. Абая 150, с 9:00 до 21:00
                        </p>
                      </Label>
                    </div>
                  </RadioGroup>

                  {formData.deliveryMethod === 'delivery' && (
                    <>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="clarifyAddress"
                          checked={formData.clarifyAddressWithRecipient}
                          onCheckedChange={(checked) => 
                            setFormData({...formData, clarifyAddressWithRecipient: checked as boolean})
                          }
                        />
                        <Label htmlFor="clarifyAddress" className="text-sm cursor-pointer">
                          Уточнить адрес у получателя по телефону
                        </Label>
                      </div>
                      
                      {!formData.clarifyAddressWithRecipient && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="address">Адрес доставки *</Label>
                            <Textarea
                              id="address"
                              placeholder="Город, улица, дом, квартира"
                              value={formData.address}
                              onChange={(e) => setFormData({...formData, address: e.target.value})}
                              required={formData.deliveryMethod === 'delivery' && !formData.clarifyAddressWithRecipient}
                              className="min-h-[80px]"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="courierComment">Комментарий для курьера</Label>
                            <Textarea
                              id="courierComment"
                              placeholder="Код домофона, этаж, как найти..."
                              value={formData.courierComment}
                              onChange={(e) => setFormData({...formData, courierComment: e.target.value})}
                              className="min-h-[60px]"
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Gift Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5" />
                    Открытка
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Label htmlFor="cardText">Текст открытки (необязательно)</Label>
                  <Textarea
                    id="cardText"
                    placeholder="Напишите пожелания..."
                    value={formData.cardText}
                    onChange={(e) => setFormData({...formData, cardText: e.target.value})}
                    rows={4}
                    className="mt-2"
                  />
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle>Оплата</CardTitle>
                </CardHeader>
                <CardContent>
                  <PaymentMethods
                    value={formData.paymentMethod}
                    onChange={(value) => setFormData({...formData, paymentMethod: value})}
                  />
                  
                  {orderType === 'gift' && (
                    <div className="mt-4 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="customerPhone2">Номер телефона заказчика *</Label>
                        <PhoneInput
                          id="customerPhone2"
                          value={formData.customerPhone}
                          onChange={(value) => setFormData({...formData, customerPhone: value})}
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Для отправки ссылки на оплату
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Детали заказа</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Cart Items */}
                  <div className="space-y-3">
                    {cart.items.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                          {item.image_url ? (
                            <img 
                              src={item.image_url} 
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Gift className="h-6 w-6" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm leading-tight">{item.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.quantity} × {formatPrice(item.sale_price || item.retail_price)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Totals */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Товары:</span>
                      <span>{formatPrice(getTotalPrice())}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Доставка:</span>
                      <span>{formatPrice(deliveryFee)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Сервисный сбор:</span>
                      <span>{formatPrice(serviceFee)}</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-bold text-lg">
                    <span>Итого:</span>
                    <span>{formatPrice(totalAmount)}</span>
                  </div>

                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? 'Оформление...' : 'Оформить заказ'}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Нажимая "Оформить заказ", вы соглашаетесь с условиями сервиса
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
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