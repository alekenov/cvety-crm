import { Product, CartItem } from "../../types";

// Product Tag Component
export function ProductTag({ 
  children, 
  variant = "default" 
}: { 
  children: React.ReactNode;
  variant?: "hot" | "promo" | "new" | "default";
}) {
  const variants = {
    hot: "bg-red-500 text-white",
    promo: "bg-orange-500 text-white", 
    new: "bg-blue-500 text-white",
    default: "bg-gray-900 text-white"
  };

  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}

// Favorite Button Component
export function FavoriteButton({ 
  isFavorite, 
  onClick 
}: { 
  isFavorite: boolean; 
  onClick: () => void; 
}) {
  return (
    <button
      onClick={onClick}
      className={`w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center transition-colors ${
        isFavorite 
          ? 'bg-red-500 text-white' 
          : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-500'
      }`}
    >
      <svg className="w-4 h-4" fill={isFavorite ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
      </svg>
    </button>
  );
}

// Add to Cart Button Component
export function AddToCartButton({ 
  onClick, 
  quantity = 0 
}: { 
  onClick: () => void; 
  quantity?: number; 
}) {
  if (quantity > 0) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-gray-600">×{quantity}</span>
        <button
          onClick={onClick}
          className="w-7 h-7 lg:w-8 lg:h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
          </svg>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className="w-7 h-7 lg:w-8 lg:h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
      </svg>
    </button>
  );
}

// Main Product Card Component
export function ProductCard({ 
  product, 
  onAddToCart, 
  cartItems,
  onQuickView 
}: { 
  product: Product; 
  onAddToCart: (product: Product) => void;
  cartItems: CartItem[];
  onQuickView: (product: Product) => void;
}) {
  const cartItem = cartItems.find(item => item.id === product.id);
  const cartQuantity = cartItem?.quantity || 0;

  return (
    <div className="flex flex-col gap-2 lg:gap-3">
      {/* Product Image */}
      <div
        className="relative w-full aspect-[3/4] bg-gray-100 rounded-lg bg-cover bg-center cursor-pointer hover:scale-[1.02] transition-transform group"
        style={{ backgroundImage: `url('${product.image}')` }}
        onClick={() => onQuickView(product)}
      >
        {/* Overlay Controls */}
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
          {product.tag && (
            <ProductTag variant={product.tagVariant}>{product.tag}</ProductTag>
          )}
          <FavoriteButton 
            isFavorite={false} 
            onClick={() => {}} 
          />
        </div>

        {/* Quick view overlay - Desktop only */}
        <div className="hidden lg:flex absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="bg-white text-gray-900 px-3 py-1.5 rounded-full text-sm font-medium">
            Быстрый просмотр
          </div>
        </div>
      </div>
      
      {/* Product Info */}
      <div className="flex flex-col gap-1.5 lg:gap-2">
        {/* Price and Cart */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-900 font-medium">
              {product.price}
            </span>
            {product.tagVariant === "promo" && (
              <span className="text-xs text-gray-400 line-through">
                {product.id === 6 ? "6 900 ₸" : "5 000 ₸"}
              </span>
            )}
          </div>
          <AddToCartButton 
            onClick={() => onAddToCart(product)} 
            quantity={cartQuantity}
          />
        </div>
        
        {/* Title */}
        <div>
          <p className="text-sm lg:text-base text-gray-900 line-clamp-2 leading-tight">
            {product.title}
          </p>
        </div>
        
        {/* Delivery */}
        {product.delivery && (
          <div className="text-xs text-gray-500">
            {product.delivery}
          </div>
        )}
      </div>
    </div>
  );
}