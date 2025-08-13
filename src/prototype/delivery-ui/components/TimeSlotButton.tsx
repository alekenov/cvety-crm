import { Clock } from 'lucide-react';

interface TimeSlotButtonProps {
  time: string;
  isSelected: boolean;
  onClick: () => void;
  showIcon?: boolean;
}

export function TimeSlotButton({ time, isSelected, onClick, showIcon = false }: TimeSlotButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
        isSelected
          ? 'bg-gray-200 text-gray-900'
          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
      }`}
    >
      {showIcon && <Clock className="w-4 h-4" />}
      {time}
    </button>
  );
}