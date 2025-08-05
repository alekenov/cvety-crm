import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartContext } from '../../context/CartContext';
import type { CartItem } from '../../hooks/useCart';

interface CartItemCardProps {
  item: CartItem;
}

export function CartItemCard({ item }: CartItemCardProps) {
  const { updateQuantity, removeFromCart } = useCartContext();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const currentPrice = item.sale_price || item.retail_price || 0;
  const originalPrice = item.sale_price ? item.retail_price : null;
  const discount = originalPrice && item.sale_price 
    ? Math.round((1 - item.sale_price / originalPrice) * 100)
    : 0;

  return (
    <div className="flex gap-4 p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow">
      {/* Product Image */}
      <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
        {item.image_url ? (
          <img 
            src={item.image_url} 
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <ShoppingCart className="h-8 w-8" />
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-base leading-tight mb-1">{item.name}</h3>
        {item.description && (
          <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
            {item.description}
          </p>
        )}
        
        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-lg">{formatPrice(currentPrice)}</span>
          {originalPrice && (
            <>
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(originalPrice)}
              </span>
              {discount > 0 && (
                <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded">
                  -{discount}%
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center gap-2">
        <div className="flex items-center border rounded-lg">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 rounded-r-none"
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-10 text-center text-sm font-medium">
            {item.quantity}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 rounded-l-none"
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          onClick={() => removeFromCart(item.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Import missing icon
import { ShoppingCart } from 'lucide-react';