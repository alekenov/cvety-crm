import { Calendar, Clock } from 'lucide-react';

interface DaySelectorProps {
  selectedDay: string;
  onDayChange: (day: string) => void;
}

export function DaySelector({ selectedDay, onDayChange }: DaySelectorProps) {
  return (
    <div className="flex items-center gap-4">
      <Clock className="w-5 h-5 text-gray-600" />
      <div className="flex gap-2">
        <button
          onClick={() => onDayChange('today')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedDay === 'today'
              ? 'bg-gray-200 text-gray-900'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          Сегодня
        </button>
        <button
          onClick={() => onDayChange('tomorrow')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedDay === 'tomorrow'
              ? 'bg-gray-200 text-gray-900'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          Завтра
        </button>
        <button className="p-2 rounded-full border border-gray-200 hover:bg-gray-100">
          <Calendar className="w-4 h-4 text-gray-600" />
        </button>
      </div>
    </div>
  );
}