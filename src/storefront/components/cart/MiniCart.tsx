import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ShoppingCart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCartContext } from '../../context/CartContext';
import { CartItemCard } from './CartItemCard';

export function MiniCart() {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  const { cart, getTotalPrice, getTotalItems } = useCartContext();
  const [open, setOpen] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const itemCount = getTotalItems();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {itemCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {itemCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            Корзина
            {itemCount > 0 && (
              <span className="text-sm text-muted-foreground font-normal">
                {itemCount} {itemCount === 1 ? 'товар' : itemCount < 5 ? 'товара' : 'товаров'}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {cart.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <ShoppingCart className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium mb-2">Корзина пуста</p>
            <p className="text-sm text-muted-foreground mb-4">
              Добавьте товары для оформления заказа
            </p>
            <Button onClick={() => setOpen(false)}>
              Продолжить покупки
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6 mt-4" style={{ height: 'calc(100vh - 280px)' }}>
              <div className="space-y-4">
                {cart.items.map((item) => (
                  <CartItemCard key={item.id} item={item} />
                ))}
              </div>
            </ScrollArea>

            <div className="space-y-4 pt-4">
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Товары:</span>
                  <span>{formatPrice(getTotalPrice())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Доставка:</span>
                  <span>при оформлении</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Итого:</span>
                  <span>{formatPrice(getTotalPrice())}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => {
                    navigate(`/shop/${shopId}/checkout`);
                    setOpen(false);
                  }}
                >
                  Оформить заказ
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    navigate(`/shop/${shopId}/cart`);
                    setOpen(false);
                  }}
                >
                  Перейти в корзину
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}