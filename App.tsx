import { useState } from "react";
import { Header } from "./components/store/Header";
import { ProductCard } from "./components/product/ProductComponents";
import { CartPanel, FloatingCartButton } from "./components/cart/CartComponents";
import { StoreSections } from "./components/sections/StoreSections";
import { CheckoutPage } from "./pages/CheckoutPage";
import { OrderStatusPage } from "./pages/OrderStatusPage";
import { ProductPage } from "./pages/ProductPage";
import { showcaseProducts, availableProducts, promoProducts, catalogProducts } from "./utils/data";
import { Product, CartItem, OrderStatus, AddonProduct } from "./types";

export default function App() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [currentView, setCurrentView] = useState<"store" | "checkout" | "order_status" | "product_details">("store");
  const [currentOrder, setCurrentOrder] = useState<OrderStatus | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      if (existingItem) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { ...product, quantity: 1 }];
      }
    });
  };

  const addAddonToCart = (addonProduct: AddonProduct) => {
    // Convert AddonProduct to CartItem format
    const cartItem: CartItem = {
      ...addonProduct,
      delivery: "С основным заказом", // Default delivery for addon products
      tag: undefined,
      tagVariant: undefined
    };

    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === addonProduct.id);
      if (existingItem) {
        return prev.map(item =>
          item.id === addonProduct.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { ...cartItem, quantity: 1 }];
      }
    });
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity === 0) {
      removeFromCart(id);
    } else {
      setCartItems(prev =>
        prev.map(item =>
          item.id === id ? { ...item, quantity } : item
        )
      );
    }
  };

  const removeFromCart = (id: number) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const proceedToCheckout = () => {
    setIsCartOpen(false);
    setCurrentView("checkout");
  };

  const handleOrderComplete = (order: OrderStatus) => {
    setCurrentOrder(order);
    setCurrentView("order_status");
    setCartItems([]); // Clear cart after order
  };

  const backToStore = () => {
    setCurrentView("store");
    setSelectedProduct(null);
  };

  const handleProductView = (product: Product) => {
    setSelectedProduct(product);
    setCurrentView("product_details");
  };

  if (currentView === "checkout") {
    return (
      <CheckoutPage
        cartItems={cartItems}
        onBack={backToStore}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onOrderComplete={handleOrderComplete}
      />
    );
  }

  if (currentView === "order_status" && currentOrder) {
    return (
      <OrderStatusPage
        order={currentOrder}
        onBack={backToStore}
      />
    );
  }

  if (currentView === "product_details") {
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

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="flex flex-col gap-5">
        <Header />
        <StoreSections 
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