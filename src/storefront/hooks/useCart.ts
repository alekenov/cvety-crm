import { useState, useEffect } from 'react';
import type { Product } from '../types';

export interface CartItem extends Product {
  quantity: number;
}

export interface Cart {
  shopId: number;
  items: CartItem[];
}

const CART_STORAGE_KEY = 'storefront_cart';

export function useCart(shopId: number) {
  // Initialize cart state from localStorage if available
  const [cart, setCart] = useState<Cart>(() => {
    try {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (storedCart) {
        const parsed = JSON.parse(storedCart) as Cart;
        // Only load cart if it's for the same shop
        if (parsed.shopId === shopId) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse cart from localStorage:', e);
    }
    // Default to empty cart
    return { shopId, items: [] };
  });

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.items.find(item => item.id === product.id);
      
      if (existingItem) {
        // Increase quantity if item already in cart
        return {
          ...prevCart,
          items: prevCart.items.map(item =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        };
      } else {
        // Add new item to cart
        return {
          ...prevCart,
          items: [...prevCart.items, { ...product, quantity: 1 }]
        };
      }
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prevCart => ({
      ...prevCart,
      items: prevCart.items.filter(item => item.id !== productId)
    }));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prevCart => ({
      ...prevCart,
      items: prevCart.items.map(item =>
        item.id === productId
          ? { ...item, quantity }
          : item
      )
    }));
  };

  const clearCart = () => {
    setCart({ shopId, items: [] });
  };

  const getTotalPrice = () => {
    return cart.items.reduce((sum, item) => {
      const price = item.sale_price || item.retail_price || 0;
      return sum + price * item.quantity;
    }, 0);
  };

  const getTotalItems = () => {
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems
  };
}