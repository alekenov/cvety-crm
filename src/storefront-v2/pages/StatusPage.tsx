import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { OrderStatusPage } from "./OrderStatusPage";
import { shopAPI } from "../services/api";
import { OrderStatus } from "../types.js";

export default function StatusPage() {
  const { shopId, token } = useParams<{ shopId: string; token: string }>();
  const navigate = useNavigate();
  const shopIdNum = parseInt(shopId || "6", 10);
  
  const [orderData, setOrderData] = useState<OrderStatus | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const hasLoadedRef = useRef(false);
  
  console.log('StatusPage rendered with params:', { shopId, token, shopIdNum, hasOrderData: !!orderData, hasLoaded: hasLoadedRef.current });

  const backToStore = () => {
    navigate(`/shop/${shopId}`);
  };

  useEffect(() => {
    if (token && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      
      const loadOrder = async () => {
        try {
          setIsLoading(true);
          setTrackingError(null);
          console.log('Loading order:', token);
          const data = await shopAPI.trackOrder(token);
          setOrderData(data);
          console.log('Order loaded:', data);
        } catch (err) {
          console.error('Error tracking order:', err);
          setTrackingError('Заказ не найден. Проверьте правильность номера заказа.');
          hasLoadedRef.current = false; // Reset on error to allow retry
        } finally {
          setIsLoading(false);
        }
      };
      
      loadOrder();
    }
  }, [token]); // Убрали trackOrder - теперь прямой API вызов

  // Show loading state
  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загружаем информацию о заказе...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (trackingError) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto p-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Заказ не найден</h2>
            <p className="text-gray-600 mb-6">
              {trackingError || 'Проверьте правильность номера заказа'}
            </p>
            <button
              onClick={backToStore}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Вернуться в магазин
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show order status if data is loaded
  if (orderData) {
    return (
      <OrderStatusPage
        order={orderData}
        onBack={backToStore}
      />
    );
  }

  return null;
}