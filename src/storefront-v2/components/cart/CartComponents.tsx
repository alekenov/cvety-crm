import { CartItem, AddonProduct } from "../../types.js";
import { addonProducts } from "../../utils/data";

// Addon Product Card Component
function AddonProductCard({ 
  product, 
  onAddToCart,
  cartItems 
}: { 
  product: AddonProduct; 
  onAddToCart: (product: AddonProduct) => void;
  cartItems: CartItem[];
}) {
  const cartItem = cartItems.find(item => item.id === product.id);
  const cartQuantity = cartItem?.quantity || 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-2 lg:p-3">
      <div
        className="w-full aspect-square bg-gray-100 rounded-md bg-cover bg-center mb-2"
        style={{ backgroundImage: `url('${product.image}')` }}
      />
      
      <div className="space-y-1.5">
        <h4 className="text-xs lg:text-sm font-medium text-gray-900 line-clamp-2 leading-tight">
          {product.title}
        </h4>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">{product.price}</span>
          
          {cartQuantity > 0 ? (
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-600">×{cartQuantity}</span>
              <button
                onClick={() => onAddToCart(product)}
                className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors"
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={() => onAddToCart(product)}
              className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Addon Products Section Component
function AddonProductsSection({ 
  onAddToCart,
  cartItems 
}: { 
  onAddToCart: (product: AddonProduct) => void;
  cartItems: CartItem[];
}) {
  return (
    <div className="border-t border-gray-200 pt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900">Дополнить заказ</h4>
        <span className="text-xs text-gray-500">Конфеты, шоколад</span>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {addonProducts.slice(0, 6).map((product) => (
          <AddonProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
            cartItems={cartItems}
          />
        ))}
      </div>
    </div>
  );
}

export function CartPanel({ 
  cartItems, 
  isOpen, 
  onClose, 
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  onAddAddon
}: {
  cartItems: CartItem[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemoveItem: (id: number) => void;
  onProceedToCheckout: () => void;
  onAddAddon?: (product: AddonProduct) => void;
}) {
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => {
    const price = parseInt(item.price.replace(/[^\d]/g, ''));
    return sum + (price * item.quantity);
  }, 0);

  // Calculate total savings from promo items
  const totalSavings = cartItems.reduce((sum, item) => {
    if (item.tagVariant === "promo") {
      const currentPrice = parseInt(item.price.replace(/[^\d]/g, ''));
      const originalPrice = item.id === 6 ? 6900 : 5000; // Mock original prices
      return sum + ((originalPrice - currentPrice) * item.quantity);
    }
    return sum;
  }, 0);

  const handleAddAddon = (product: AddonProduct) => {
    if (onAddAddon) {
      onAddAddon(product);
    }
  };

  if (!isOpen || cartItems.length === 0) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Cart Panel */}
      <div className="fixed bottom-0 left-0 right-0 lg:right-4 lg:left-auto lg:bottom-4 lg:w-96 lg:max-h-[600px] bg-white lg:rounded-2xl rounded-t-2xl shadow-2xl z-50 flex flex-col max-h-[80vh] lg:max-h-[600px]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-gray-900 font-medium">Корзина ({totalItems})</h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Savings banner */}
        {totalSavings > 0 && (
          <div className="mx-4 mt-3 p-2.5 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
              </svg>
              <span className="text-sm text-green-800 font-medium">
                Экономия: {totalSavings.toLocaleString()} ₸
              </span>
            </div>
          </div>
        )}

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Main Cart Items */}
          <div className="space-y-3">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                <div
                  className="w-12 h-12 lg:w-14 lg:h-14 bg-gray-200 rounded-lg bg-cover bg-center shrink-0"
                  style={{ backgroundImage: `url('${item.image}')` }}
                />
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">{item.title}</h4>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-gray-600">{item.price}</div>
                    {item.tagVariant === "promo" && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">
                        -{Math.round(((item.id === 6 ? 6900 : 5000) - parseInt(item.price.replace(/[^\d]/g, ''))) / (item.id === 6 ? 6900 : 5000) * 100)}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                    className="w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 12H4"/>
                    </svg>
                  </button>
                  
                  <span className="text-sm font-medium min-w-[1.5ch] text-center">{item.quantity}</span>
                  
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4"/>
                    </svg>
                  </button>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Addon Products Section */}
          {onAddAddon && (
            <AddonProductsSection 
              onAddToCart={handleAddAddon}
              cartItems={cartItems}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900">Итого:</span>
            <span className="font-medium text-gray-900">{totalPrice.toLocaleString()} ₸</span>
          </div>
          
          <button 
            onClick={onProceedToCheckout}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium transition-colors"
          >
            Оформить заказ
          </button>
        </div>
      </div>
    </>
  );
}

export function FloatingCartButton({ 
  cartItems, 
  onClick 
}: { 
  cartItems: CartItem[]; 
  onClick: () => void; 
}) {
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  
  if (cartCount === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-30">
      <button 
        onClick={onClick}
        className="relative flex items-center gap-2 lg:gap-3 bg-red-500 hover:bg-red-600 text-white px-3 py-2.5 lg:px-4 lg:py-3 rounded-full shadow-lg hover:shadow-xl transition-all"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l-2.5-5M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z"/>
        </svg>
        <span className="text-sm font-medium hidden lg:inline">Корзина</span>
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-white text-red-500 text-xs font-medium rounded-full flex items-center justify-center animate-bounce">
          {cartCount}
        </div>
      </button>
    </div>
  );
}