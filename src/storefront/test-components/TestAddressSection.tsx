import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { MapPin, Truck, Store, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TestAddressSectionProps {
  deliveryMethod: 'delivery' | 'self_pickup';
  address: string;
  clarifyAddressWithRecipient: boolean;
  courierComment: string;
  showCourierComment: boolean;
  onDeliveryMethodChange: (method: 'delivery' | 'self_pickup') => void;
  onAddressChange: (address: string) => void;
  onClarifyAddressChange: (clarify: boolean) => void;
  onCourierCommentChange: (comment: string) => void;
  setShowCourierComment: (show: boolean) => void;
}

export const TestAddressSection: React.FC<TestAddressSectionProps> = ({
  deliveryMethod,
  address,
  clarifyAddressWithRecipient,
  courierComment,
  showCourierComment,
  onDeliveryMethodChange,
  onAddressChange,
  onClarifyAddressChange,
  onCourierCommentChange,
  setShowCourierComment,
}) => {
  return (
    <div className="panel">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-700">Адрес доставки</h3>
        </div>
        
        <RadioGroup 
          value={deliveryMethod}
          onValueChange={(value: 'delivery' | 'self_pickup') => onDeliveryMethodChange(value)}
          className="space-y-3"
        >
          <div className={cn(
            "relative flex items-start space-x-2 p-3 rounded-lg border cursor-pointer transition-all",
            deliveryMethod === 'delivery' ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"
          )}>
            <RadioGroupItem value="delivery" id="delivery" className="mt-0.5" />
            <Label htmlFor="delivery" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                <span className="text-sm font-medium">Доставка курьером</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                По городу: 2 000 ₸
              </p>
            </Label>
          </div>
          
          <div className={cn(
            "relative flex items-start space-x-2 p-3 rounded-lg border cursor-pointer transition-all",
            deliveryMethod === 'self_pickup' ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"
          )}>
            <RadioGroupItem value="self_pickup" id="self_pickup" className="mt-0.5" />
            <Label htmlFor="self_pickup" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                <span className="text-sm font-medium">Самовывоз</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Бесплатно • ул. Абая 150, с 9:00 до 21:00
              </p>
            </Label>
          </div>
        </RadioGroup>
        
        {deliveryMethod === 'delivery' && (
          <>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="clarifyAddress"
                checked={clarifyAddressWithRecipient}
                onCheckedChange={(checked) => onClarifyAddressChange(checked as boolean)}
              />
              <Label htmlFor="clarifyAddress" className="text-sm cursor-pointer">
                Уточнить адрес у получателя по телефону
              </Label>
            </div>
            
            {!clarifyAddressWithRecipient && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="address" className="text-sm">Адрес доставки *</Label>
                  <Textarea
                    id="address"
                    placeholder="Город, улица, дом, квартира"
                    value={address}
                    onChange={(e) => onAddressChange(e.target.value)}
                    required={deliveryMethod === 'delivery' && !clarifyAddressWithRecipient}
                    className="min-h-[60px] text-sm"
                  />
                </div>
                
                {!showCourierComment ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCourierComment(true)}
                    className="text-primary hover:text-primary/80"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Добавить комментарий для курьера
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="courierComment">Комментарий для курьера</Label>
                    <Textarea
                      id="courierComment"
                      placeholder="Код домофона, этаж, как найти..."
                      value={courierComment}
                      onChange={(e) => onCourierCommentChange(e.target.value)}
                      className="min-h-[60px]"
                    />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};