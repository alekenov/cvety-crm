import { useState, useCallback } from 'react';
import { shopAPI, type CreateOrderRequest, type OrderResponse } from '../services/api';
import { CartItem } from '../types.js';

export interface CheckoutFormData {
  deliveryType: 'delivery' | 'pickup';
  deliveryDate: string;
  deliveryTime: string;
  customerName: string;
  customerPhone: string;
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: string;
  city: string;
  apartment: string;
  cardText: string;
  paymentMethod: 'cash' | 'card';
  specialRequests: string;
}

export function useOrder(shopId: number) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrder = async (
    formData: CheckoutFormData,
    cartItems: CartItem[]
  ): Promise<OrderResponse | null> => {
    try {
      setLoading(true);
      setError(null);

      // Calculate total amount
      const itemsTotal = cartItems.reduce((sum, item) => {
        const price = parseInt(item.price.replace(/[^\d]/g, ''));
        return sum + (price * item.quantity);
      }, 0);
      
      const deliveryPrice = formData.deliveryType === 'delivery' ? 2000 : 0;
      const totalAmount = itemsTotal + deliveryPrice;

      // Prepare order data
      const orderData: CreateOrderRequest = {
        customer_phone: formData.customerPhone,
        recipient_phone: formData.recipientPhone || formData.customerPhone,
        recipient_name: formData.recipientName || formData.customerName,
        address: formData.deliveryType === 'delivery' 
          ? `${formData.deliveryAddress}, кв. ${formData.apartment}` 
          : undefined,
        delivery_method: formData.deliveryType,
        delivery_fee: deliveryPrice,
        card_text: formData.cardText,
        delivery_time_text: `${formData.deliveryDate} ${formData.deliveryTime}`,
        items: cartItems.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          price: parseInt(item.price.replace(/[^\d]/g, '')),
        })),
        shop_id: shopId,
      };

      // Create order via API
      const response = await shopAPI.createOrder(shopId, orderData);
      return response;
    } catch (err: any) {
      console.error('Failed to create order:', err);
      setError(err.response?.data?.detail || 'Не удалось создать заказ');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const trackOrder = useCallback(async (trackingToken: string): Promise<OrderResponse | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await shopAPI.trackOrder(trackingToken);
      return response;
    } catch (err: any) {
      console.error('Failed to track order:', err);
      setError(err.response?.data?.detail || 'Заказ не найден');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createOrder,
    trackOrder,
    loading,
    error,
  };
}