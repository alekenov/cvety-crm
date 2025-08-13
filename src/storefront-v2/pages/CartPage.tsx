import { useParams, useNavigate } from "react-router-dom";
import { CheckoutPage } from "./CheckoutPage";
import { useCart } from "../contexts/CartContext";
import { useOrder } from "../hooks/useOrder";

export default function CartPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  const shopIdNum = parseInt(shopId || "6", 10);
  
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useCart();
  const { createOrder, loading: orderLoading, error: orderError } = useOrder(shopIdNum);

  const backToStore = () => {
    navigate(`/shop/${shopId}`);
  };

  const handleOrderComplete = (order: any) => {
    // Clear cart after successful order
    clearCart();
    // Navigate to status page with tracking token
    navigate(`/shop/${shopId}/status/${order.orderNumber}`);
  };

  return (
    <CheckoutPage
      cartItems={cartItems}
      onBack={backToStore}
      onUpdateQuantity={updateQuantity}
      onRemoveItem={removeFromCart}
      onOrderComplete={handleOrderComplete}
      onCreateOrder={createOrder}
    />
  );
}