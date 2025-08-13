export interface Product {
  id: number;
  image: string;
  price: string;
  title: string;
  delivery: string;
  tag?: string;
  tagVariant?: "default" | "promo" | "new";
}

export interface CartItem extends Product {
  quantity: number;
}

export interface AddonProduct {
  id: number;
  image: string;
  price: string;
  title: string;
  category: "candy" | "chocolate" | "mini_bouquet" | "other";
}

export interface CheckoutFormData {
  deliveryMethod: "delivery" | "pickup";
  // Дата и время доставки
  deliveryDate: string;
  deliveryTime: string;
  clarifyWithRecipient: boolean;
  // Заказчик (всегда)
  customerFirstName: string;
  customerPhone: string;
  // Получатель (только для доставки)
  recipientFirstName: string;
  recipientPhone: string;
  address: string;
  apartment?: string;
  paymentMethod: "cash" | "card";
  cardMessage?: string;
  comments?: string;
}

export interface OrderStatus {
  id: string;
  orderNumber: string;
  status: "preparing" | "ready" | "in_transit" | "delivered";
  orderDate: string;
  deliveryDate: string;
  deliveryTime: string;
  items: CartItem[];
  total: number;
  deliveryFee: number;
  deliveryMethod: "delivery" | "pickup";
  customerData: CheckoutFormData;
  bouquetPhoto?: string;
  photoRating?: "like" | "dislike" | null;
  estimatedTime?: string;
}