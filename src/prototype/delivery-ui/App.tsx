import { useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { DeliveryForm } from './components/DeliveryForm';
import { PickupForm } from './components/PickupForm';

type DeliveryType = 'delivery' | 'pickup';

interface DeliveryState {
  selectedDay: string;
  selectedTimeSlot: string;
  clarifyWithRecipient: boolean;
  clarifyAddressByPhone: boolean;
  recipientName: string;
  recipientPhone: string;
  address: string;
  apartment: string;
  floor: string;
}

interface PickupState {
  selectedStore: string;
  selectedDay: string;
  selectedTimeSlot: string;
}

export default function App() {
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('delivery');
  
  const [deliveryState, setDeliveryState] = useState<DeliveryState>({
    selectedDay: 'today',
    selectedTimeSlot: '12:30',
    clarifyWithRecipient: false,
    clarifyAddressByPhone: false,
    recipientName: '',
    recipientPhone: '',
    address: '',
    apartment: '',
    floor: ''
  });

  const [pickupState, setPickupState] = useState<PickupState>({
    selectedStore: '',
    selectedDay: 'today',
    selectedTimeSlot: '12:30'
  });

  const deliveryOptions = [
    { id: 'delivery' as const, title: 'Доставка' },
    { id: 'pickup' as const, title: 'Самовывоз' }
  ];

  const updateDeliveryState = (updates: Partial<DeliveryState>) => {
    setDeliveryState(prev => ({ ...prev, ...updates }));
  };

  const updatePickupState = (updates: Partial<PickupState>) => {
    setPickupState(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto bg-white">
        {/* Header */}
        <div className="flex items-center gap-4 p-6 pb-4">
          <button className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Доставка</h1>
        </div>

        {/* Delivery Type Selection */}
        <div className="px-6 pb-6">
          <div className="grid grid-cols-2 gap-3">
            {deliveryOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setDeliveryType(option.id)}
                className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  deliveryType === option.id
                    ? 'border-gray-900 bg-gray-200'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {deliveryType === option.id && (
                  <div className="absolute top-3 right-3 w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
                <h3 className="font-semibold mb-1 text-gray-900">
                  {option.title}
                </h3>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Content */}
        {deliveryType === 'delivery' ? (
          <DeliveryForm
            selectedDay={deliveryState.selectedDay}
            selectedTimeSlot={deliveryState.selectedTimeSlot}
            clarifyWithRecipient={deliveryState.clarifyWithRecipient}
            clarifyAddressByPhone={deliveryState.clarifyAddressByPhone}
            recipientName={deliveryState.recipientName}
            recipientPhone={deliveryState.recipientPhone}
            address={deliveryState.address}
            apartment={deliveryState.apartment}
            floor={deliveryState.floor}
            onDayChange={(day) => updateDeliveryState({ selectedDay: day })}
            onTimeSlotChange={(slot) => updateDeliveryState({ selectedTimeSlot: slot })}
            onClarifyWithRecipientChange={(checked) => updateDeliveryState({ clarifyWithRecipient: checked })}
            onClarifyAddressByPhoneChange={(checked) => updateDeliveryState({ clarifyAddressByPhone: checked })}
            onRecipientNameChange={(name) => updateDeliveryState({ recipientName: name })}
            onRecipientPhoneChange={(phone) => updateDeliveryState({ recipientPhone: phone })}
            onAddressChange={(address) => updateDeliveryState({ address })}
            onApartmentChange={(apartment) => updateDeliveryState({ apartment })}
            onFloorChange={(floor) => updateDeliveryState({ floor })}
          />
        ) : (
          <PickupForm
            selectedStore={pickupState.selectedStore}
            selectedDay={pickupState.selectedDay}
            selectedTimeSlot={pickupState.selectedTimeSlot}
            onStoreChange={(id) => updatePickupState({ selectedStore: id })}
            onDayChange={(day) => updatePickupState({ selectedDay: day })}
            onTimeSlotChange={(slot) => updatePickupState({ selectedTimeSlot: slot })}
          />
        )}
      </div>
    </div>
  );
}