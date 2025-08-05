import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CreditCard, Banknote } from 'lucide-react';
import { PhoneInput } from '@/components/checkout/PhoneInput';
import { cn } from '@/lib/utils';

interface TestPaymentSectionProps {
  paymentMethod: string;
  customerPhone: string;
  deliveryType: 'other' | 'self';
  onPaymentMethodChange: (method: string) => void;
  onCustomerPhoneChange: (phone: string) => void;
}

const KaspiIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="4" fill="#FF5F5F"/>
    <path d="M7 12L10 15L17 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const TestPaymentSection: React.FC<TestPaymentSectionProps> = ({
  paymentMethod,
  customerPhone,
  deliveryType,
  onPaymentMethodChange,
  onCustomerPhoneChange,
}) => {
  const paymentMethods = [
    {
      id: 'kaspi',
      name: 'Kaspi Pay',
      description: 'Оплата через приложение Kaspi',
      icon: <KaspiIcon />,
    },
    {
      id: 'card',
      name: 'Банковская карта',
      description: 'Visa, Mastercard',
      icon: <CreditCard className="h-6 w-6 text-blue-600" />,
    },
    {
      id: 'cash',
      name: 'Наличными курьеру',
      description: 'При получении заказа',
      icon: <Banknote className="h-6 w-6 text-green-600" />,
    },
  ];
  
  return (
    <div className="panel">
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">Способ оплаты</h3>
        
        <RadioGroup 
          value={paymentMethod}
          onValueChange={onPaymentMethodChange}
          className="space-y-3"
        >
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className={cn(
                "relative flex items-start space-x-2 p-3 rounded-lg border cursor-pointer transition-all",
                paymentMethod === method.id ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"
              )}
            >
              <RadioGroupItem value={method.id} id={method.id} className="mt-0.5" />
              <div className="flex-1">
                <Label htmlFor={method.id} className="flex items-center gap-3 cursor-pointer">
                  {React.cloneElement(method.icon, { className: "h-5 w-5" })}
                  <div className="flex-1">
                    <div className="text-sm font-medium">{method.name}</div>
                    <div className="text-xs text-muted-foreground">{method.description}</div>
                  </div>
                </Label>
              </div>
            </div>
          ))}
        </RadioGroup>
        
        {deliveryType === 'other' && (
          <div className="space-y-1 pt-2">
            <Label htmlFor="customerPhone" className="text-sm">Ваш номер телефона *</Label>
            <PhoneInput
              id="customerPhone"
              value={customerPhone}
              onChange={onCustomerPhoneChange}
              required
            />
            <p className="text-xs text-muted-foreground">
              Для отправки ссылки на оплату и информации о заказе
            </p>
          </div>
        )}
      </div>
    </div>
  );
};