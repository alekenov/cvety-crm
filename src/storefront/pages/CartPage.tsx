import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Gift, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CartProvider, useCartContext } from '../context/CartContext';
import { CartItemCard } from '../components/cart/CartItemCard';

function CartContent() {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  const { cart, clearCart, getTotalPrice, getTotalItems } = useCartContext();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const deliveryFee = 2000;
  const serviceFee = 990;
  const totalAmount = getTotalPrice() + deliveryFee + serviceFee;

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
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate(`/shop/${shopId}`)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Вернуться в магазин
              </Button>
              <h1 className="text-2xl font-bold">Корзина</h1>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                if (window.confirm('Очистить корзину?')) {
                  clearCart();
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Очистить
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Ваш заказ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.items.map((item) => (
                  <CartItemCard key={item.id} item={item} />
                ))}
                
                {/* Add Gift Card Option */}
                <Separator />
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    // TODO: Implement gift card addition
                    alert('Функция добавления открытки в разработке');
                  }}
                >
                  <Gift className="mr-2 h-4 w-4" />
                  Добавить открытку
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Детали заказа</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Товары ({getTotalItems()} шт):</span>
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
                  size="lg" 
                  className="w-full"
                  onClick={() => navigate(`/shop/${shopId}/checkout`)}
                >
                  Оформить заказ
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Нажимая "Оформить заказ", вы соглашаетесь с условиями сервиса
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export function CartPage() {
  const { shopId } = useParams<{ shopId: string }>();
  
  if (!shopId) {
    return <div>Shop ID is required</div>;
  }

  return (
    <CartProvider shopId={Number(shopId)}>
      <CartContent />
    </CartProvider>
  );
}