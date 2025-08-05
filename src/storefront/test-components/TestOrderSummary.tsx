import React from 'react';
import { Button } from '@/components/ui/button';

interface TestOrderSummaryProps {
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  onSubmit: () => void;
  buttonText?: string;
  isLoading?: boolean;
}

export const TestOrderSummary: React.FC<TestOrderSummaryProps> = ({
  subtotal,
  deliveryFee,
  serviceFee,
  total,
  onSubmit,
  buttonText = "Перейти к оформлению",
  isLoading = false,
}) => {
  const formatPrice = (price: number) => {
    return price.toLocaleString('ru-RU') + ' ₸';
  };

  return (
    <div className="panel mb-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Товары</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Доставка</span>
            <span className={deliveryFee === 0 ? "text-green-600" : ""}>
              {deliveryFee === 0 ? "Бесплатно" : formatPrice(deliveryFee)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Сервисный сбор</span>
            <span>{formatPrice(serviceFee)}</span>
          </div>
        </div>
        
        <div className="border-t pt-3">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-semibold">Итого</span>
            <span className="text-xl font-bold">{formatPrice(total)}</span>
          </div>
          
          <Button 
            onClick={onSubmit} 
            size="lg" 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Загрузка..." : buttonText}
          </Button>
        </div>
      </div>
    </div>
  );
};