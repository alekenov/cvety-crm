import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TestCartItem } from '@/storefront/test-components/TestCartItem';
import { TestOrderSummary } from '@/storefront/test-components/TestOrderSummary';
import { CartProvider, useCartContext } from '@/storefront/context/CartContext';
import { toast } from 'sonner';

function TestCartContent() {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  const { cart, updateQuantity, clearCart, getTotalPrice } = useCartContext();
  
  const handleQuantityChange = (productId: number, quantity: number) => {
    if (quantity === 0) {
      toast.success("Товар удален из корзины");
    }
    updateQuantity(productId, quantity);
  };
  
  const clearActiveCart = () => {
    clearCart();
    toast.success("Корзина очищена");
  };
  
  // Calculate order summary
  const subtotal = getTotalPrice();
  const deliveryFee = 0; // Free delivery
  const serviceFee = 990;
  const total = subtotal + deliveryFee + serviceFee;

  const handleCheckout = () => {
    navigate(`/shop/${shopId}/testcheckout`);
  };
  
  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-2">Корзина пуста</h2>
          <p className="text-gray-500 mb-6">Добавьте товары, чтобы сделать заказ</p>
          <Button onClick={() => navigate(`/shop/${shopId}`)}>
            Перейти к покупкам
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <header className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">Корзина</h1>
            <button
              onClick={clearActiveCart}
              className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm"
            >
              <Trash2 size={14} />
              Очистить
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-3xl mx-auto px-4 py-4 pb-24">
        <div className="panel mb-4">
          <div className="divide-y divide-[#F0F0F0]">
            {cart.items.map((item) => (
              <TestCartItem
                key={item.id}
                id={item.id}
                name={item.name}
                description={item.description}
                price={item.sale_price || item.retail_price}
                oldPrice={item.sale_price ? item.retail_price : undefined}
                quantity={item.quantity}
                image={item.image_url}
                onQuantityChange={handleQuantityChange}
              />
            ))}
          </div>
        </div>
        
        <TestOrderSummary
          subtotal={subtotal}
          deliveryFee={deliveryFee}
          serviceFee={serviceFee}
          total={total}
          onSubmit={handleCheckout}
          buttonText="Перейти к оформлению"
        />
      </main>
    </div>
  );
}

export function TestCartPage() {
  const { shopId } = useParams<{ shopId: string }>();
  
  if (!shopId) {
    return <div>Shop ID is required</div>;
  }

  return (
    <CartProvider shopId={Number(shopId)}>
      <TestCartContent />
    </CartProvider>
  );
}