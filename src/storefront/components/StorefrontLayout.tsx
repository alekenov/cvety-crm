import { useParams, Outlet } from 'react-router-dom';
import { CartProvider } from '../context/CartContext';

export function StorefrontLayout() {
  const { shopId } = useParams<{ shopId: string }>();
  
  if (!shopId) {
    return <div>Shop ID is required</div>;
  }

  return (
    <CartProvider shopId={Number(shopId)}>
      <Outlet />
    </CartProvider>
  );
}