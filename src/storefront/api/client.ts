import axios from 'axios';

// Create axios instance for public API
const apiClient = axios.create({
  baseURL: '/api/public',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Shop API
export const shopApi = {
  getInfo: async (shopId: number) => {
    const response = await apiClient.get(`/shops/${shopId}`);
    return response.data;
  },
};

// Products API
export const productsApi = {
  getAll: async (params: {
    shop_id: number;
    skip?: number;
    limit?: number;
    category?: string;
    min_price?: number;
    max_price?: number;
  }) => {
    const response = await apiClient.get('/products', { params });
    return response.data;
  },
};

// Orders API (for public/storefront)
export const ordersApi = {
  createPublic: async (orderData: any) => {
    const response = await apiClient.post('/orders', orderData);
    return response.data;
  },
  trackByToken: async (trackingToken: string) => {
    const response = await apiClient.get(`/tracking/${trackingToken}`);
    return response.data;
  },
};

export default apiClient;