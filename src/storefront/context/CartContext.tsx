import React, { createContext, useContext, ReactNode } from 'react';
import { useCart } from '../hooks/useCart';
import type { CartItem } from '../hooks/useCart';
import type { Product } from '../types';

interface CartContextType {
  cart: { shopId: number; items: CartItem[] };
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children, shopId }: { children: ReactNode; shopId: number }) {
  const cartHook = useCart(shopId);

  return (
    <CartContext.Provider value={cartHook}>
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  return context;
}