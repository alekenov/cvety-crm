import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "../components/store/Header";
import { StoreSections } from "../components/sections/StoreSections";
import { CartPanel, FloatingCartButton } from "../components/cart/CartComponents";
import { useProducts, useShopInfo } from "../hooks/useProducts";
import { useCart } from "../contexts/CartContext";
import { Product } from "../types.js";
import { showcaseProducts, availableProducts, promoProducts, catalogProducts } from "../utils/data";

export default function StorePage() {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  const shopIdNum = parseInt(shopId || "6", 10);
  
  const { products, loading: productsLoading, error: productsError } = useProducts(shopIdNum);
  const { shopInfo, loading: shopLoading, error: shopError } = useShopInfo(shopIdNum);
  const { cartItems, addToCart, addAddonToCart, updateQuantity, removeFromCart } = useCart();
  
  const [isCartOpen, setIsCartOpen] = useState(false);

  const handleProductView = (product: Product) => {
    navigate(`/shop/${shopId}/product/${product.id}`);
  };

  const proceedToCheckout = () => {
    setIsCartOpen(false);
    navigate(`/shop/${shopId}/cart`);
  };

  // Show loading state
  if (productsLoading || shopLoading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загружаем магазин...</p>
        </div>
      </div>
    );
  }

  // Use API products if available, otherwise fallback to static data
  const displayProducts = products.length > 0 ? products : [...showcaseProducts, ...availableProducts, ...promoProducts, ...catalogProducts];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="flex flex-col gap-5">
        <Header shopInfo={shopInfo} />
        <StoreSections 
          products={displayProducts}
          onAddToCart={addToCart} 
          cartItems={cartItems}
          onQuickView={handleProductView}
        />
        <FloatingCartButton 
          cartItems={cartItems}
          onClick={() => setIsCartOpen(true)}
        />
        <CartPanel
          cartItems={cartItems}
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeFromCart}
          onProceedToCheckout={proceedToCheckout}
          onAddAddon={addAddonToCart}
        />
      </div>
    </div>
  );
}