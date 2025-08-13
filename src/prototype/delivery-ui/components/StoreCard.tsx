import { Check } from 'lucide-react';

interface Store {
  id: string;
  name: string;
  address: string;
  workingHours: string;
  readyTime: string;
}

interface StoreCardProps {
  store: Store;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function StoreCard({ store, isSelected, onSelect }: StoreCardProps) {
  return (
    <div
      onClick={() => onSelect(store.id)}
      className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all ${
        isSelected
          ? 'border-gray-900 bg-gray-200'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      {isSelected && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}
      
      <div className="pr-8">
        <h3 className="font-semibold text-gray-900 mb-1">{store.name}</h3>
        <p className="text-sm text-gray-600 mb-2">{store.address}</p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">{store.workingHours}</span>
          <span className="text-sm font-medium text-gray-900">{store.readyTime}</span>
        </div>
      </div>
    </div>
  );
}