import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from 'lucide-react';
import { PhoneInput } from '@/components/checkout/PhoneInput';

interface TestRecipientInfoProps {
  deliveryType: 'other' | 'self';
  customerName: string;
  customerPhone: string;
  recipientName: string;
  recipientPhone: string;
  onCustomerNameChange: (name: string) => void;
  onCustomerPhoneChange: (phone: string) => void;
  onRecipientNameChange: (name: string) => void;
  onRecipientPhoneChange: (phone: string) => void;
}

export const TestRecipientInfo: React.FC<TestRecipientInfoProps> = ({
  deliveryType,
  customerName,
  customerPhone,
  recipientName,
  recipientPhone,
  onCustomerNameChange,
  onCustomerPhoneChange,
  onRecipientNameChange,
  onRecipientPhoneChange,
}) => {
  return (
    <div className="panel">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-700">
            {deliveryType === 'other' ? 'Получатель' : 'Ваши данные'}
          </h3>
        </div>
        
        {deliveryType === 'other' ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="recipientName" className="text-sm">Имя получателя *</Label>
              <Input
                id="recipientName"
                placeholder="Имя"
                value={recipientName}
                onChange={(e) => onRecipientNameChange(e.target.value)}
                required
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="recipientPhone" className="text-sm">Телефон получателя *</Label>
              <PhoneInput
                id="recipientPhone"
                value={recipientPhone}
                onChange={onRecipientPhoneChange}
                required
              />
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="customerName" className="text-sm">Ваше имя *</Label>
              <Input
                id="customerName"
                placeholder="Имя"
                value={customerName}
                onChange={(e) => onCustomerNameChange(e.target.value)}
                required
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="customerPhone" className="text-sm">Ваш телефон *</Label>
              <PhoneInput
                id="customerPhone"
                value={customerPhone}
                onChange={onCustomerPhoneChange}
                required
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};