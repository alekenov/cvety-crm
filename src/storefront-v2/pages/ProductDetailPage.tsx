import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ProductPage } from "./ProductPage";
import { useCart } from "../contexts/CartContext";
import { useProducts } from "../hooks/useProducts";
import { Product } from "../types.js";
import { showcaseProducts, availableProducts, promoProducts, catalogProducts } from "../utils/data";

export default function ProductDetailPage() {
  const { shopId, productId } = useParams<{ shopId: string; productId: string }>();
  const navigate = useNavigate();
  const shopIdNum = parseInt(shopId || "6", 10);
  const productIdNum = parseInt(productId || "0", 10);
  
  const { products, loading: productsLoading } = useProducts(shopIdNum);
  const { cartItems, addToCart } = useCart();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const backToStore = () => {
    navigate(`/shop/${shopId}`);
  };

  const proceedToCheckout = () => {
    navigate(`/shop/${shopId}/cart`);
  };

  useEffect(() => {
    // Use API products if available, otherwise fallback to static data
    const displayProducts = products.length > 0 ? products : [...showcaseProducts, ...availableProducts, ...promoProducts, ...catalogProducts];
    
    const product = displayProducts.find(p => p.id === productIdNum);
    if (product) {
      setSelectedProduct(product);
    } else if (!productsLoading) {
      // Product not found and loading is complete
      navigate(`/shop/${shopId}`);
    }
  }, [products, productIdNum, productsLoading, navigate, shopId]);

  // Show loading state
  if (productsLoading || !selectedProduct) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загружаем товар...</p>
        </div>
      </div>
    );
  }

  return (
    <ProductPage
      product={selectedProduct}
      onBack={backToStore}
      onAddToCart={addToCart}
      onProceedToCheckout={proceedToCheckout}
      cartItems={cartItems}
    />
  );
}