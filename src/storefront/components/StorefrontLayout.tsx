import { useParams, Outlet } from 'react-router-dom';
import { CartProvider } from '../context/CartContext';

export function StorefrontLayout() {
  const { shopId } = useParams<{ shopId: string }>();
  
  if (!shopId) {
    return <div>Shop ID is required</div>;
  }

  // Only allow numeric shop IDs
  const numericShopId = Number(shopId);
  if (isNaN(numericShopId) || numericShopId <= 0) {
    return <div>Invalid shop ID: {shopId}</div>;
  }

  return (
    <CartProvider shopId={numericShopId}>
      <Outlet />
    </CartProvider>
  );
}