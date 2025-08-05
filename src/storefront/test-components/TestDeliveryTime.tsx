import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock } from 'lucide-react';
import { format, addDays, isToday, isTomorrow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TestDeliveryTimeProps {
  deliveryTime: 'today' | 'tomorrow' | 'custom';
  selectedDate: Date;
  selectedTimeSlot: string;
  clarifyTimeWithRecipient: boolean;
  onDeliveryTimeChange: (time: 'today' | 'tomorrow' | 'custom') => void;
  onSelectedDateChange: (date: Date) => void;
  onSelectedTimeSlotChange: (slot: string) => void;
  onClarifyTimeChange: (clarify: boolean) => void;
}

export const TestDeliveryTime: React.FC<TestDeliveryTimeProps> = ({
  deliveryTime,
  selectedDate,
  selectedTimeSlot,
  clarifyTimeWithRecipient,
  onDeliveryTimeChange,
  onSelectedDateChange,
  onSelectedTimeSlotChange,
  onClarifyTimeChange,
}) => {
  const timeSlots = [
    '09:00 - 11:00',
    '11:00 - 13:00',
    '13:00 - 15:00',
    '15:00 - 17:00',
    '17:00 - 19:00',
    '19:00 - 21:00',
  ];
  
  const currentHour = new Date().getHours();
  const isDateToday = isToday(selectedDate);
  
  const availableTimeSlots = timeSlots.filter(slot => {
    if (!isDateToday) return true;
    const slotHour = parseInt(slot.split(':')[0]);
    return slotHour > currentHour + 2;
  });
  
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onSelectedDateChange(date);
      if (isToday(date)) {
        onDeliveryTimeChange('today');
      } else if (isTomorrow(date)) {
        onDeliveryTimeChange('tomorrow');
      } else {
        onDeliveryTimeChange('custom');
      }
    }
  };
  
  return (
    <div className="panel">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-700">Когда доставить?</h3>
        </div>
        
        {/* Date Selection */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant={deliveryTime === 'today' ? "default" : "outline"}
            size="sm"
            onClick={() => {
              onDeliveryTimeChange('today');
              onSelectedDateChange(new Date());
            }}
            className="flex-1"
          >
            Сегодня
          </Button>
          <Button
            type="button"
            variant={deliveryTime === 'tomorrow' ? "default" : "outline"}
            size="sm"
            onClick={() => {
              onDeliveryTimeChange('tomorrow');
              onSelectedDateChange(addDays(new Date(), 1));
            }}
            className="flex-1"
          >
            Завтра
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={deliveryTime === 'custom' ? "default" : "outline"}
                size="sm"
                className={cn(
                  "w-auto",
                  deliveryTime === 'custom' && "text-left font-normal"
                )}
              >
                <CalendarIcon className="h-4 w-4" />
                {deliveryTime === 'custom' && (
                  <span className="ml-2">{format(selectedDate, 'dd MMM', { locale: ru })}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => date < new Date() || date > addDays(new Date(), 30)}
                initialFocus
                locale={ru}
              />
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Time Slots */}
        {!clarifyTimeWithRecipient && (
          <div className="grid grid-cols-3 gap-2">
            {availableTimeSlots.length > 0 ? (
              availableTimeSlots.map((slot) => (
                <Button
                  key={slot}
                  type="button"
                  variant={selectedTimeSlot === slot ? "default" : "outline"}
                  size="sm"
                  onClick={() => onSelectedTimeSlotChange(slot)}
                >
                  {slot}
                </Button>
              ))
            ) : (
              <div className="col-span-3 text-sm text-muted-foreground text-center py-2">
                На сегодня доставка уже недоступна
              </div>
            )}
          </div>
        )}
        
        {/* Clarify with recipient */}
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="clarifyTime"
            checked={clarifyTimeWithRecipient}
            onCheckedChange={(checked) => onClarifyTimeChange(checked as boolean)}
          />
          <Label htmlFor="clarifyTime" className="text-sm cursor-pointer">
            Уточнить время у получателя
          </Label>
        </div>
      </div>
    </div>
  );
};