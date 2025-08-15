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

// API Response Types (from backend)
export interface ApiOrderStatus {
  order_number: string;
  status: string;
  created_at: string;
  updated_at: string;
  delivery_method: 'delivery' | 'pickup';
  delivery_window?: any;
  delivery_fee: number;
  total: number;
  recipient_name?: string;
  recipient_phone?: string;
  address?: string;
  items: Array<{
    product_name: string;
    quantity: number;
    price: number;
  }>;
  tracking_token: string;
}

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
  retail_price: number;
  sale_price?: number;
  category?: string;
  image_url?: string;
  is_active?: boolean;
  is_popular?: boolean;
  is_new?: boolean;
  shop_id?: number;
  images?: Array<{
    id: number;
    image_url: string;
    is_primary: boolean;
    sort_order: number;
  }>;
}

export interface OrderItemAPI {
  product_id: number;
  quantity: number;
  price?: number;
}

export interface CreateOrderRequest {
  customer_phone: string;
  recipient_phone?: string;
  recipient_name?: string;
  address?: string;
  delivery_method: 'delivery' | 'pickup';
  delivery_fee: number;
  items: OrderItemAPI[];
  card_text?: string;
  delivery_time_text?: string;
  shop_id: number;
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

// Transform API response to frontend OrderStatus type
const transformApiOrderToOrderStatus = (apiOrder: ApiOrderStatus): any => {
  // Format dates
  const createdDate = new Date(apiOrder.created_at);
  const orderDate = createdDate.toLocaleDateString('ru-RU');
  const deliveryDate = orderDate; // Use same date for now
  const deliveryTime = '12:00-18:00'; // Default delivery time
  
  // Transform items to CartItem format
  const items = apiOrder.items.map((item, index) => ({
    id: index + 1, // Generate IDs since API doesn't provide them
    title: item.product_name,
    price: `${item.price.toLocaleString()} ₸`,
    image: 'https://via.placeholder.com/64x64/FFE5E5/FF6B6B?text=Flower',
    delivery: 'Сегодня к 18:00',
    quantity: item.quantity
  }));
  
  // Create customer data structure
  const customerData = {
    deliveryMethod: apiOrder.delivery_method,
    deliveryDate,
    deliveryTime,
    clarifyWithRecipient: false,
    customerFirstName: apiOrder.recipient_name || 'Получатель',
    customerPhone: apiOrder.recipient_phone || '',
    recipientFirstName: apiOrder.recipient_name || 'Получатель',
    recipientPhone: apiOrder.recipient_phone || '',
    address: apiOrder.address || '',
    apartment: '',
    paymentMethod: 'cash' as const,
    cardMessage: '',
    comments: ''
  };
  
  const orderStatus = {
    id: apiOrder.tracking_token,
    orderNumber: apiOrder.order_number,
    status: apiOrder.status,
    orderDate,
    deliveryDate,
    deliveryTime,
    items,
    total: apiOrder.total,
    deliveryFee: apiOrder.delivery_fee,
    deliveryMethod: apiOrder.delivery_method,
    customerData
  };
  
  return orderStatus;
};

// API Methods
export const shopAPI = {
  // Get shop information
  getShopInfo: async (shopId: number): Promise<ShopInfo> => {
    const { data } = await api.get(`/api/public/shops/${shopId}`);
    return data;
  },

  // Get products for a shop
  getProducts: async (shopId: number): Promise<ProductAPI[]> => {
    const { data } = await api.get(`/api/public/products?shop_id=${shopId}`);
    // The response has items array and total count
    return data.items || [];
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
    const orderDataWithShopId = { ...orderData, shop_id: shopId };
    const { data } = await api.post(`/api/public/orders`, orderDataWithShopId);
    return data;
  },

  // Track order by token
  trackOrder: async (trackingToken: string): Promise<any> => {
    const { data } = await api.get(`/api/public/status/${trackingToken}`);
    return transformApiOrderToOrderStatus(data);
  },

  // Send OTP
  sendOTP: async (phone: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await api.post('/api/auth/request-otp', { phone });
    return { success: true, message: data.message };
  },

  // Verify OTP
  verifyOTP: async (phone: string, otp: string): Promise<{ success: boolean; token?: string }> => {
    const { data } = await api.post('/api/auth/verify-otp', { phone, otp_code: otp });
    return { success: true, token: data.access_token };
  }
};

export default api;