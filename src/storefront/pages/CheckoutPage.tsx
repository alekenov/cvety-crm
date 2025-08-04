import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Clock, Gift, MapPin, Phone, User, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CartProvider, useCartContext } from '../context/CartContext';
import { ordersApi } from '../api/client';

function CheckoutContent() {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, clearCart, getTotalPrice } = useCartContext();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerPhone: '',
    recipientName: '',
    recipientPhone: '',
    address: '',
    deliveryMethod: 'delivery',
    deliveryDate: '',
    deliveryTime: '',
    cardText: ''
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const deliveryFee = formData.deliveryMethod === 'delivery' ? 2000 : 0;
  const totalAmount = getTotalPrice() + deliveryFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shopId) return;
    
    setLoading(true);
    try {
      const orderData = {
        customer_phone: formData.customerPhone,
        recipient_name: formData.recipientName,
        recipient_phone: formData.recipientPhone || formData.customerPhone,
        address: formData.address,
        delivery_method: formData.deliveryMethod,
        delivery_fee: deliveryFee,
        shop_id: Number(shopId),
        card_text: formData.cardText,
        delivery_time_text: `${formData.deliveryDate} ${formData.deliveryTime}`,
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
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/shop/${shopId}`)}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Вернуться в магазин
          </Button>
          <h1 className="text-2xl font-bold">Оформление заказа</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Order Form */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Контактная информация
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="customerPhone">Ваш телефон *</Label>
                    <Input
                      id="customerPhone"
                      type="tel"
                      placeholder="+7 (___) ___-__-__"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="recipientName">Имя получателя *</Label>
                    <Input
                      id="recipientName"
                      type="text"
                      placeholder="Имя"
                      value={formData.recipientName}
                      onChange={(e) => setFormData({...formData, recipientName: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="recipientPhone">Телефон получателя</Label>
                    <Input
                      id="recipientPhone"
                      type="tel"
                      placeholder="+7 (___) ___-__-__ (если отличается)"
                      value={formData.recipientPhone}
                      onChange={(e) => setFormData({...formData, recipientPhone: e.target.value})}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Delivery */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Доставка
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup 
                    value={formData.deliveryMethod}
                    onValueChange={(value) => setFormData({...formData, deliveryMethod: value})}
                  >
                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="delivery" id="delivery" />
                      <Label htmlFor="delivery" className="flex-1 cursor-pointer">
                        <div>Доставка курьером</div>
                        <div className="text-sm text-gray-600">Стоимость: {formatPrice(2000)}</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="self_pickup" id="self_pickup" />
                      <Label htmlFor="self_pickup" className="flex-1 cursor-pointer">
                        <div>Самовывоз</div>
                        <div className="text-sm text-gray-600">Бесплатно</div>
                      </Label>
                    </div>
                  </RadioGroup>

                  {formData.deliveryMethod === 'delivery' && (
                    <div>
                      <Label htmlFor="address">Адрес доставки *</Label>
                      <Input
                        id="address"
                        type="text"
                        placeholder="Город, улица, дом, квартира"
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        required={formData.deliveryMethod === 'delivery'}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Delivery Time */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Время доставки
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="deliveryDate">Дата *</Label>
                    <Input
                      id="deliveryDate"
                      type="date"
                      value={formData.deliveryDate}
                      onChange={(e) => setFormData({...formData, deliveryDate: e.target.value})}
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label htmlFor="deliveryTime">Время *</Label>
                    <Input
                      id="deliveryTime"
                      type="time"
                      value={formData.deliveryTime}
                      onChange={(e) => setFormData({...formData, deliveryTime: e.target.value})}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Card */}
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
                  />
                </CardContent>
              </Card>

              <Button 
                type="submit" 
                size="lg" 
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Оформление...' : `Оформить заказ на ${formatPrice(totalAmount)}`}
              </Button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Ваш заказ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        {item.quantity} × {formatPrice(item.sale_price || item.retail_price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Товары:</span>
                    <span>{formatPrice(getTotalPrice())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Доставка:</span>
                    <span>{formatPrice(deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Итого:</span>
                    <span>{formatPrice(totalAmount)}</span>
                  </div>
                </div>
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