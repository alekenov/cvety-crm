export interface Product {
  id: string
  name: string
  category: 'bouquet' | 'composition' | 'potted' | 'other'
  description?: string
  imageUrl?: string
  costPrice: number
  retailPrice: number
  salePrice?: number
  isActive: boolean
  isPopular?: boolean
  isNew?: boolean
  createdAt: Date
  updatedAt: Date
}

export interface OrderItem {
  productId: string
  product?: Product
  quantity: number
  price: number
  total: number
}