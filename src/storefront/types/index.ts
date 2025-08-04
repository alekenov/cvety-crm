export interface Shop {
  id: number;
  name: string;
  phone: string;
  whatsapp_number?: string;
  address?: string;
  city: string;
  description?: string;
  business_hours?: Record<string, string[]>;
  shop_logo_url?: string;
}

export interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  category: 'bouquet' | 'composition' | 'potted' | 'gift' | 'other';
  description?: string;
  image_url?: string;
  retail_price: number;
  sale_price?: number;
  is_active: boolean;
  is_popular: boolean;
  is_new: boolean;
  images?: ProductImage[];
}

export interface ProductListResponse {
  items: Product[];
  total: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}