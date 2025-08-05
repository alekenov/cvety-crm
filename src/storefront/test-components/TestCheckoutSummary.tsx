import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Gift } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  description?: string;
  retail_price: number;
  sale_price?: number | null;
  quantity: number;
  image_url?: string | null;
}

interface TestCheckoutSummaryProps {
  products: Product[];
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  onSubmit: () => void;
  isLoading?: boolean;
}

export const TestCheckoutSummary: React.FC<TestCheckoutSummaryProps> = ({
  products,
  subtotal,
  deliveryFee,
  serviceFee,
  total,
  onSubmit,
  isLoading = false,
}) => {
  const formatPrice = (price: number) => {
    return price.toLocaleString('ru-RU') + ' ₸';
  };
  
  return (
    <div className="panel sticky top-20">
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">Ваш заказ</h3>
        
        {/* Products */}
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {products.map((item) => (
            <div key={item.id} className="flex gap-3">
              <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                {item.image_url ? (
                  <img 
                    src={item.image_url} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Gift className="h-5 w-5" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight line-clamp-2">{item.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {item.quantity} × {formatPrice(item.sale_price || item.retail_price)}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <Separator />
        
        {/* Summary */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Товары:</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Доставка:</span>
            <span className={deliveryFee === 0 ? "text-green-600" : ""}>
              {deliveryFee === 0 ? "Бесплатно" : formatPrice(deliveryFee)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Сервисный сбор:</span>
            <span>{formatPrice(serviceFee)}</span>
          </div>
        </div>
        
        <Separator />
        
        <div className="flex justify-between font-bold text-lg">
          <span>Итого:</span>
          <span>{formatPrice(total)}</span>
        </div>
        
        <Button 
          type="button"
          size="lg" 
          className="w-full"
          onClick={onSubmit}
          disabled={isLoading}
        >
          {isLoading ? 'Оформление...' : 'Оформить заказ'}
        </Button>
        
        <p className="text-xs text-center text-muted-foreground">
          Нажимая "Оформить заказ", вы соглашаетесь с условиями сервиса
        </p>
      </div>
    </div>
  );
};