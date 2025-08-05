import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Gift, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TestDeliveryOptionsProps {
  deliveryType: 'other' | 'self';
  onDeliveryTypeChange: (type: 'other' | 'self') => void;
}

export const TestDeliveryOptions: React.FC<TestDeliveryOptionsProps> = ({
  deliveryType,
  onDeliveryTypeChange,
}) => {
  return (
    <div className="panel">
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">Кому доставляем?</h3>
        <RadioGroup 
          value={deliveryType} 
          onValueChange={(value: 'other' | 'self') => onDeliveryTypeChange(value)}
          className="grid grid-cols-2 gap-3"
        >
          <div className={cn(
            "relative flex items-center p-3 rounded-lg border cursor-pointer transition-all",
            deliveryType === 'other' ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"
          )}>
            <RadioGroupItem value="other" id="other" className="sr-only" />
            <Label htmlFor="other" className="cursor-pointer flex items-center gap-2 flex-1">
              <Gift className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Другому человеку</span>
            </Label>
          </div>
          
          <div className={cn(
            "relative flex items-center p-3 rounded-lg border cursor-pointer transition-all",
            deliveryType === 'self' ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"
          )}>
            <RadioGroupItem value="self" id="self" className="sr-only" />
            <Label htmlFor="self" className="cursor-pointer flex items-center gap-2 flex-1">
              <User className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Себе</span>
            </Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
};