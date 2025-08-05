import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TestCartItemProps {
  id: number;
  name: string;
  description?: string;
  price: number;
  oldPrice?: number;
  quantity: number;
  unit?: string;
  image?: string;
  onQuantityChange: (id: number, quantity: number) => void;
}

export const TestCartItem: React.FC<TestCartItemProps> = ({
  id,
  name,
  description,
  price,
  oldPrice,
  quantity,
  unit = "шт",
  image,
  onQuantityChange,
}) => {
  return (
    <div className="flex py-3 px-3 group hover:bg-gray-50 transition-colors duration-200">
      <div className="flex-shrink-0 w-16 h-16 mr-3 bg-gray-100 rounded overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover rounded transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex-grow min-w-0">
        <div className="flex flex-col">
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-black transition-colors">{name}</h3>
          {description && (
            <p className="text-xs text-gray-500">{description}</p>
          )}
          <div className="flex items-center mt-1">
            <span className="font-medium text-sm mr-1">
              {price.toLocaleString('ru-RU')} ₸
            </span>
            {oldPrice && (
              <span className="text-gray-400 text-xs line-through ml-1">
                {oldPrice.toLocaleString('ru-RU')} ₸
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end ml-2">
        <div className={cn(
          "flex items-center bg-[#F8F8F8] rounded-full h-6 transition-all duration-200",
          "hover:shadow-sm"
        )}>
          <button
            onClick={() => onQuantityChange(id, Math.max(0, quantity - 1))}
            className={cn(
              "w-6 h-6 flex items-center justify-center text-gray-500 rounded-full",
              "hover:bg-gray-200 hover:text-gray-700 transition-colors"
            )}
            aria-label="Decrease quantity"
          >
            <Minus size={12} strokeWidth={2.5} />
          </button>
          <span className="w-6 text-center font-medium text-xs">
            {quantity}
          </span>
          <button
            onClick={() => onQuantityChange(id, quantity + 1)}
            className={cn(
              "w-6 h-6 flex items-center justify-center text-gray-500 rounded-full",
              "hover:bg-gray-200 hover:text-gray-700 transition-colors"
            )}
            aria-label="Increase quantity"
          >
            <Plus size={12} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
};