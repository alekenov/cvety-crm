import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TestCheckoutContainer } from '@/storefront/test-components/TestCheckoutContainer';
import { CartProvider, useCartContext } from '@/storefront/context/CartContext';
import { ordersApi } from '@/storefront/api/client';

export interface DeliveryType {
  type: 'other' | 'self';
}

export interface DeliveryTime {
  type: 'today' | 'tomorrow' | 'date';
  date?: Date;
  timeSlot?: string;
}

function TestCheckoutContent() {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  const { cart, clearCart, getTotalPrice } = useCartContext();
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (formData: any) => {
    if (!shopId) return;
    
    setLoading(true);
    try {
      const orderData = {
        customer_phone: formData.customerPhone.replace(/\D/g, ''),
        recipient_name: formData.deliveryType === 'self' ? formData.customerName : formData.recipientName,
        recipient_phone: formData.deliveryType === 'self' 
          ? formData.customerPhone.replace(/\D/g, '') 
          : formData.recipientPhone.replace(/\D/g, ''),
        address: formData.address,
        delivery_method: formData.deliveryMethod,
        delivery_fee: formData.deliveryMethod === 'delivery' ? 2000 : 0,
        shop_id: Number(shopId),
        card_text: formData.cardMessage,
        delivery_time_text: formData.deliveryTimeText,
        items: cart.items.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.sale_price || item.retail_price
        }))
      };

      const response = await ordersApi.createPublic(orderData);
      clearCart();
      navigate(`/shop/${shopId}/order-success/${response.tracking_token}`);
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Произошла ошибка при оформлении заказа. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleClearCart = () => {
    clearCart();
    navigate(`/shop/${shopId}/testcart`);
  };
  
  if (cart.items.length === 0) {
    navigate(`/shop/${shopId}/testcart`);
    return null;
  }
  
  return (
    <TestCheckoutContainer
      products={cart.items}
      onSubmit={handleSubmit}
      onClearCart={handleClearCart}
      isLoading={loading}
    />
  );
}

export function TestCheckoutPage() {
  const { shopId } = useParams<{ shopId: string }>();
  
  if (!shopId) {
    return <div>Shop ID is required</div>;
  }

  return (
    <CartProvider shopId={Number(shopId)}>
      <TestCheckoutContent />
    </CartProvider>
  );
}