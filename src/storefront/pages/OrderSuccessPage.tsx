import { Navigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';

export function OrderSuccessPage() {
  const { token } = useParams<{ shopId: string; token: string }>();

  // Redirect to the unified tracking page
  if (!token) {
    return <Navigate to="/shop/1" replace />;
  }
  
  return <Navigate to={`/status/${token}`} replace />;
}