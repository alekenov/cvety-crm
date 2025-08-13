import axios from 'axios';

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API Types
export interface ShopInfo {
  id: number;
  name: string;
  description?: string;
  phone?: string;
  address?: string;
  rating?: number;
  reviews_count?: number;
  delivery_price?: number;
  delivery_time?: string;
  pickup_address?: string;
  working_hours?: string;
  instagram?: string;
  whatsapp?: string;
}

export interface ProductAPI {
  id: number;
  name: string;
  description?: string;
  price: number;
  category?: string;
  image_url?: string;
  in_stock?: boolean;
  shop_id: number;
}

export interface OrderItemAPI {
  product_id: number;
  quantity: number;
  price: number;
  product_name?: string;
}

export interface CreateOrderRequest {
  customer_name: string;
  customer_phone: string;
  delivery_type: 'delivery' | 'pickup';
  delivery_address?: string;
  delivery_date?: string;
  delivery_time?: string;
  recipient_name?: string;
  recipient_phone?: string;
  card_text?: string;
  payment_method: 'cash' | 'card';
  special_requests?: string;
  items: OrderItemAPI[];
  total_amount: number;
}

export interface OrderResponse {
  id: number;
  tracking_token: string;
  status: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  created_at: string;
}

// API Methods
export const shopAPI = {
  // Get shop information
  getShopInfo: async (shopId: number): Promise<ShopInfo> => {
    const { data } = await api.get(`/api/public/shops/${shopId}`);
    return data;
  },

  // Get products for a shop
  getProducts: async (shopId: number): Promise<ProductAPI[]> => {
    const { data } = await api.get(`/api/public/shops/${shopId}/products`);
    // The response has a products array and total count
    return data.products || [];
  },

  // Get categories for a shop
  getCategories: async (shopId: number): Promise<{ name: string; count: number }[]> => {
    const { data } = await api.get(`/api/public/shops/${shopId}/categories`);
    return data.categories || [];
  },

  // Get single product
  getProduct: async (shopId: number, productId: number): Promise<ProductAPI> => {
    const { data } = await api.get(`/api/shops/${shopId}/products/${productId}`);
    return data;
  },

  // Create order
  createOrder: async (shopId: number, orderData: CreateOrderRequest): Promise<OrderResponse> => {
    const { data } = await api.post(`/api/public/shops/${shopId}/orders`, orderData);
    return data;
  },

  // Track order by token
  trackOrder: async (trackingToken: string): Promise<any> => {
    const { data } = await api.get(`/api/public/orders/${trackingToken}`);
    return data;
  },

  // Send OTP
  sendOTP: async (phone: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await api.post('/api/telegram/send-otp', { phone });
    return data;
  },

  // Verify OTP
  verifyOTP: async (phone: string, otp: string): Promise<{ success: boolean; token?: string }> => {
    const { data } = await api.post('/api/telegram/verify-otp', { phone, otp });
    return data;
  }
};

export default api;