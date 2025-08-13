import { Store, Plus } from 'lucide-react';
import { DaySelector } from './DaySelector';
import { TimeSlotButton } from './TimeSlotButton';
import { StoreCard } from './StoreCard';

interface Store {
  id: string;
  name: string;
  address: string;
  workingHours: string;
  readyTime: string;
}

interface PickupFormProps {
  selectedStore: string;
  selectedDay: string;
  selectedTimeSlot: string;
  onStoreChange: (id: string) => void;
  onDayChange: (day: string) => void;
  onTimeSlotChange: (slot: string) => void;
}

const stores: Store[] = [
  {
    id: 'store1',
    name: 'Магазин на Тверской',
    address: 'ул. Тверская, 12',
    workingHours: 'Сегодня до 22:00',
    readyTime: 'Заберете сегодня в 14:30'
  },
  {
    id: 'store2', 
    name: 'Магазин на Арбате',
    address: 'ул. Арбат, 25',
    workingHours: 'Сегодня до 21:00',
    readyTime: 'Заберете сегодня в 15:00'
  },
  {
    id: 'store3',
    name: 'Магазин в ТЦ Европейский',
    address: 'пл. Киевского Вокзала, 2',
    workingHours: 'Сегодня до 23:00', 
    readyTime: 'Заберете завтра в 12:00'
  }
];

const timeSlots = ['12:30', '12-15', '15-18'];

export function PickupForm({
  selectedStore,
  selectedDay,
  selectedTimeSlot,
  onStoreChange,
  onDayChange,
  onTimeSlotChange
}: PickupFormProps) {
  return (
    <div className="px-6 pb-6">
      {/* Store Selection */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Store className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Выберите магазин для самовывоза</h2>
        </div>

        <div className="space-y-3">
          {stores.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              isSelected={selectedStore === store.id}
              onSelect={onStoreChange}
            />
          ))}
        </div>
      </div>

      {/* Time selection */}
      {selectedStore && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Когда заберете?</h3>
          
          <div className="mb-4">
            <DaySelector selectedDay={selectedDay} onDayChange={onDayChange} />
          </div>

          <div className="flex gap-2 flex-wrap">
            {timeSlots.map((slot) => (
              <TimeSlotButton
                key={slot}
                time={slot}
                isSelected={selectedTimeSlot === slot}
                onClick={() => onTimeSlotChange(slot)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Comment Section */}
      <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
        <Plus className="w-4 h-4" />
        <span>Добавить комментарий</span>
      </button>
    </div>
  );
}