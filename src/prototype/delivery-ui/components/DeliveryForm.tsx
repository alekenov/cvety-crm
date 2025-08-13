import { MapPin, User, Plus } from 'lucide-react';
import { DaySelector } from './DaySelector';
import { TimeSlotButton } from './TimeSlotButton';
import { CheckboxOption } from './CheckboxOption';
import { Input } from './ui/input';

interface DeliveryFormProps {
  selectedDay: string;
  selectedTimeSlot: string;
  clarifyWithRecipient: boolean;
  clarifyAddressByPhone: boolean;
  recipientName: string;
  recipientPhone: string;
  address: string;
  apartment: string;
  floor: string;
  onDayChange: (day: string) => void;
  onTimeSlotChange: (slot: string) => void;
  onClarifyWithRecipientChange: (checked: boolean) => void;
  onClarifyAddressByPhoneChange: (checked: boolean) => void;
  onRecipientNameChange: (name: string) => void;
  onRecipientPhoneChange: (phone: string) => void;
  onAddressChange: (address: string) => void;
  onApartmentChange: (apartment: string) => void;
  onFloorChange: (floor: string) => void;
}

const timeSlots = ['12:30', '12-15', '15-18'];

export function DeliveryForm({
  selectedDay,
  selectedTimeSlot,
  clarifyWithRecipient,
  clarifyAddressByPhone,
  recipientName,
  recipientPhone,
  address,
  apartment,
  floor,
  onDayChange,
  onTimeSlotChange,
  onClarifyWithRecipientChange,
  onClarifyAddressByPhoneChange,
  onRecipientNameChange,
  onRecipientPhoneChange,
  onAddressChange,
  onApartmentChange,
  onFloorChange
}: DeliveryFormProps) {
  return (
    <div className="px-6 pb-6">
      {/* Date and Time Section */}
      <div className="mb-6">
        <div className="mb-4">
          <DaySelector selectedDay={selectedDay} onDayChange={onDayChange} />
        </div>

        <div className="flex gap-2 flex-wrap mb-6">
          <TimeSlotButton
            time="12:30"
            isSelected={selectedTimeSlot === '12:30'}
            onClick={() => onTimeSlotChange('12:30')}
            showIcon
          />
          {timeSlots.slice(1).map((slot) => (
            <TimeSlotButton
              key={slot}
              time={slot}
              isSelected={selectedTimeSlot === slot}
              onClick={() => onTimeSlotChange(slot)}
            />
          ))}
        </div>

        <div className="mb-6">
          <CheckboxOption
            checked={clarifyWithRecipient}
            onChange={onClarifyWithRecipientChange}
            title="Уточнить время у получателя"
            description="Мы сами свяжемся и согласуем доставку"
          />
        </div>
      </div>

      {/* Recipient Information */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <User className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Информация о получателе</h2>
        </div>

        <div className="space-y-3">
          <Input
            placeholder="Имя получателя"
            value={recipientName}
            onChange={(e) => onRecipientNameChange(e.target.value)}
          />
          <Input
            placeholder="Телефон получателя"
            value={recipientPhone}
            onChange={(e) => onRecipientPhoneChange(e.target.value)}
          />
        </div>
      </div>

      {/* Address Section */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <MapPin className="w-5 h-5 text-gray-600" />
          <span className="text-lg font-semibold text-gray-900">Адрес доставки</span>
        </div>

        <div className="mb-4">
          <CheckboxOption
            checked={clarifyAddressByPhone}
            onChange={onClarifyAddressByPhoneChange}
            title="Уточнить адрес у получателя по телефону"
          />
        </div>

        <div className="space-y-3">
          <Input
            placeholder="Улица и номер дома"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
          />
          
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Квартира/офис"
              value={apartment}
              onChange={(e) => onApartmentChange(e.target.value)}
            />
            <Input
              placeholder="Этаж"
              value={floor}
              onChange={(e) => onFloorChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Comment Section */}
      <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
        <Plus className="w-4 h-4" />
        <span>Добавить комментарий для курьера</span>
      </button>
    </div>
  );
}