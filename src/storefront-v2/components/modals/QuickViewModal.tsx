import { Product, CartItem } from "../../types.js";

export function QuickViewModal({ 
  product, 
  isOpen, 
  onClose,
  onAddToCart,
  cartItems
}: {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  cartItems: CartItem[];
}) {
  if (!isOpen || !product) return null;

  const cartItem = cartItems.find(item => item.id === product.id);
  const cartQuantity = cartItem?.quantity || 0;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />
      
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-50 max-w-md mx-auto max-h-[80vh] overflow-y-auto">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Быстрый просмотр</h3>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Product Image */}
          <div
            className="w-full aspect-square bg-gray-100 rounded-lg bg-cover bg-center mb-4"
            style={{ backgroundImage: `url('${product.image}')` }}
          />

          {/* Product Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-medium text-gray-900">{product.title}</h4>
              {product.tag && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  product.tagVariant === "promo" ? "bg-orange-100 text-orange-700" :
                  product.tagVariant === "available" ? "bg-emerald-100 text-emerald-700" :
                  product.tagVariant === "new" ? "bg-gray-100 text-gray-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {product.tag}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-900">{product.price}</span>
              <span className="text-sm text-gray-500">{product.delivery}</span>
            </div>

            {/* Mock detailed info */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <h5 className="font-medium text-gray-900 mb-2">Описание</h5>
              <p className="text-sm text-gray-600">
                Прекрасный букет из свежих цветов высочайшего качества. 
                Идеально подходит для особых случаев и выражения ваших чувств.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span className="text-gray-600">Свежие цветы</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span className="text-gray-600">Быстрая доставка</span>
              </div>
            </div>

            <button
              onClick={() => {
                onAddToCart(product);
                onClose();
              }}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l-2.5-5M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z"/>
              </svg>
              {cartQuantity > 0 ? `Добавить еще (${cartQuantity} в корзине)` : "Добавить в корзину"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}