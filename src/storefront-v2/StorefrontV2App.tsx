import { Routes, Route, Navigate, useParams } from "react-router-dom";
import { CartProvider } from "./contexts/CartContext";
import StorePage from "./pages/StorePage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import StatusPage from "./pages/StatusPage";

export default function StorefrontV2App() {
  const { shopId } = useParams<{ shopId: string }>();
  
  console.log('StorefrontV2App rendered with shopId:', shopId);
  
  return (
    <CartProvider shopId={shopId}>
      <Routes>
        <Route path="/" element={<StorePage />} />
        <Route path="/product/:productId" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/status/:token" element={<StatusPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </CartProvider>
  );
}