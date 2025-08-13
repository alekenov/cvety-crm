import { useState, useEffect } from 'react';
import { shopAPI, type ProductAPI, type ShopInfo } from '../services/api';
import { Product } from '../types.js';

// Convert API product to UI product format
const convertProductToUI = (apiProduct: ProductAPI): Product => {
  return {
    id: apiProduct.id,
    title: apiProduct.name,
    price: `${apiProduct.price.toLocaleString()} ₸`,
    image: apiProduct.image_url || 'https://via.placeholder.com/400x400/FFE5E5/FF6B6B?text=Flower',
    delivery: 'Сегодня к 18:00', // This should come from shop info
    tag: apiProduct.in_stock === false ? 'Нет в наличии' : undefined,
    tagVariant: apiProduct.in_stock === false ? 'default' : undefined,
  };
};

export function useProducts(shopId: number) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const apiProducts = await shopAPI.getProducts(shopId);
        const uiProducts = apiProducts.map(convertProductToUI);
        
        setProducts(uiProducts);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError('Не удалось загрузить товары');
        
        // Fallback to mock data if API fails
        const { showcaseProducts, availableProducts, promoProducts, catalogProducts } = await import('../utils/data');
        setProducts([...showcaseProducts, ...availableProducts, ...promoProducts, ...catalogProducts]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [shopId]);

  return { products, loading, error };
}

export function useShopInfo(shopId: number) {
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShopInfo = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const info = await shopAPI.getShopInfo(shopId);
        setShopInfo(info);
      } catch (err) {
        console.error('Failed to fetch shop info:', err);
        setError('Не удалось загрузить информацию о магазине');
        
        // Fallback to mock data
        setShopInfo({
          id: shopId,
          name: 'Cvety.kz',
          description: 'Интернет-магазин цветов в Алматы',
          rating: 4.6,
          reviews_count: 827,
          delivery_price: 2000,
          delivery_time: '2-4 часа',
          pickup_address: 'мкр. Самал-2, 111',
          working_hours: 'Пн-Вс: 8:00 - 22:00',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchShopInfo();
  }, [shopId]);

  return { shopInfo, loading, error };
}