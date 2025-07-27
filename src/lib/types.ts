export type OrderStatus = 
  | 'new' 
  | 'paid' 
  | 'assembled' 
  | 'delivery' 
  | 'self_pickup' 
  | 'issue'

export type DeliveryMethod = 'delivery' | 'self_pickup'

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

export type IssueType = 
  | 'wrong_address'
  | 'recipient_unavailable'
  | 'quality_issue'
  | 'wrong_order'
  | 'delivery_delay'
  | 'other'

export interface User {
  id: string
  name: string
  role: 'admin' | 'manager' | 'florist'
}

export interface Order {
  id: string
  createdAt: Date
  status: OrderStatus
  customerPhone: string
  recipientPhone?: string
  recipientName?: string
  address?: string
  deliveryMethod: DeliveryMethod
  deliveryWindow: {
    from: Date
    to: Date
  }
  flowerSum: number
  deliveryFee: number
  total: number
  hasPreDeliveryPhotos: boolean
  hasIssue: boolean
  issueType?: IssueType
  trackingToken: string
  updatedAt: Date
}

export interface WarehouseItem {
  id: string
  sku: string
  batchCode: string
  variety: string
  heightCm: number
  farm: string
  supplier: string
  deliveryDate: Date
  currency: string
  rate: number
  cost: number
  recommendedPrice: number
  price: number
  markupPct: number
  qty: number
  reservedQty: number
  onShowcase: boolean
  toWriteOff: boolean
  hidden: boolean
  updatedAt: Date
  updatedBy: string
}

export interface DeliveryPosition {
  variety: string
  heightCm: number
  qty: number
  costPerStem: number
}

export interface Delivery {
  id: string
  supplier: string
  farm: string
  deliveryDate: Date
  currency: string
  rate: number
  comment?: string
  positions: DeliveryPosition[]
  costTotal: number
}

export interface TrackingData {
  status: OrderStatus
  updatedAt: Date
  photos: string[]
  deliveryWindow: {
    from: Date
    to: Date
  }
  deliveryMethod: DeliveryMethod
  address: string // partially masked
  trackingToken: string
  viewsCount?: number
}

export interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  addresses: string[]
  notes?: string
  preferences?: string
  importantDates?: Array<{
    date: string
    description: string
  }>
  ordersCount: number
  totalSpent: number
  createdAt: Date
  updatedAt: Date
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed'

export interface FloristTask {
  id: string
  orderId: string
  orderNumber: string
  customerName: string
  customerPhone: string
  products: string
  status: TaskStatus
  priority: 'high' | 'medium' | 'low'
  requiredBy: Date
  assignedTo?: string
  assignedAt?: Date
  completedAt?: Date
  notes?: string
}

export interface BouquetItem {
  warehouseItemId: string
  sku: string
  variety: string
  heightCm: number
  qty: number
  price: number
  cost: number
}

export interface CompanySettings {
  name: string
  address: string
  phones: string[]
  email: string
  workingHours: {
    from: string
    to: string
  }
  deliveryZones: Array<{
    name: string
    price: number
  }>
}

export interface UserRole {
  id: string
  name: string
  permissions: string[]
}

export interface SystemUser {
  id: string
  name: string
  email: string
  phone: string
  role: UserRole
  isActive: boolean
  createdAt: Date
  lastLoginAt?: Date
}