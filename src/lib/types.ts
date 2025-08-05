export type OrderStatus = 
  | 'new' 
  | 'paid' 
  | 'assembled' 
  | 'delivery' 
  | 'self_pickup' 
  | 'issue'

export type DeliveryMethod = 'delivery' | 'self_pickup'

export interface ProductImage {
  id: number
  productId: number
  imageUrl: string
  isPrimary: boolean
  sortOrder: number
  createdAt: Date
}

export interface Product {
  id: number
  name: string
  category: 'bouquet' | 'composition' | 'potted' | 'other'
  description?: string
  imageUrl?: string
  costPrice: number
  retailPrice: number
  salePrice?: number
  isActive: boolean
  isPopular: boolean
  isNew: boolean
  createdAt: Date
  updatedAt: Date
  images: ProductImage[]
  currentPrice: number
  discountPercentage: number
  ingredients?: ProductIngredientWithDetails[]
}

export interface ProductWithStats extends Product {
  totalOrders: number
  totalRevenue: number
}

export interface ProductCreate {
  name: string
  category: 'bouquet' | 'composition' | 'potted' | 'other'
  description?: string
  imageUrl?: string
  costPrice: number
  retailPrice: number
  salePrice?: number
  isActive?: boolean
  isPopular?: boolean
  isNew?: boolean
}

export interface ProductUpdate {
  name?: string
  category?: 'bouquet' | 'composition' | 'potted' | 'other'
  description?: string
  imageUrl?: string
  costPrice?: number
  retailPrice?: number
  salePrice?: number
  isActive?: boolean
  isPopular?: boolean
  isNew?: boolean
}

export interface OrderItem {
  id: string
  productId: string
  productName: string
  product?: Product
  quantity: number
  price: number
  total?: number
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
  addressNeedsClarification?: boolean
  deliveryMethod: DeliveryMethod
  deliveryWindow?: {
    from: Date
    to: Date
  }
  flowerSum: number
  deliveryFee: number
  total: number
  totalAmount?: number
  hasPreDeliveryPhotos: boolean
  hasIssue: boolean
  issueType?: IssueType
  trackingToken: string
  updatedAt: Date
  assignedTo?: User
  assignedToId?: string
  items?: OrderItem[]
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

export interface MovementHistory {
  id: string
  type: 'in' | 'out' | 'adjustment'
  quantity: number
  description: string
  orderId?: string
  createdAt: Date
  createdBy: string
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
  id: number
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

// Extended task statuses that backend supports (for production API)
export type ExtendedTaskStatus = TaskStatus | 'assigned' | 'quality_check' | 'cancelled'

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
  startedAt?: Date
  notes?: string
  floristId?: number
  floristNotes?: string
  actualMinutes?: number
  qualityScore?: number
  qualityNotes?: string
  isOverdue?: boolean
  timeSpent?: number
}

export interface ProductionQueueStats {
  pendingTasks: number
  assignedTasks: number
  inProgressTasks: number
  overdueTasks: number
  urgentTasks: number
  tasksByType: Record<string, number>
  tasksByPriority: Record<string, number>
}

export interface ProductIngredient {
  id: number
  productId: number
  warehouseItemId: number
  quantity: number
  notes?: string
}

export interface ProductIngredientWithDetails extends ProductIngredient {
  variety: string
  heightCm: number
  supplier: string
  farm: string
  availableQty: number
  price: number
}

export interface ProductIngredientCreate {
  warehouseItemId: number
  quantity: number
  notes?: string
}

export type ComponentType = 'flower' | 'material' | 'service'

export interface ProductComponent {
  id: number
  productId: number
  componentType: ComponentType
  name: string
  description?: string
  quantity: number
  unit: string
  unitCost: number
  unitPrice: number
}

export interface ProductComponentCreate {
  componentType: ComponentType
  name: string
  description?: string
  quantity: number
  unit: string
  unitCost: number
  unitPrice: number
}

export interface ProductIngredientUpdate {
  quantity?: number
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
  id?: number
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
  createdAt?: string
  updatedAt?: string | null
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

// Supply Management Types
export interface FlowerCategory {
  id: number
  name: string
  markupPercentage: number
  keywords?: string
  createdAt: Date
  updatedAt: Date
}

export interface SupplyItem {
  id: number
  supplyId: number
  categoryId?: number
  flowerName: string
  heightCm: number
  purchasePrice: number
  quantity: number
  remainingQuantity: number
  retailPrice: number
  totalCost: number
  createdAt: Date
  category?: FlowerCategory
}

export interface Supply {
  id: number
  supplier: string
  farm?: string
  deliveryDate: Date
  currency: string
  rate: number
  status: string
  totalCost: number
  notes?: string
  comment?: string
  createdAt: Date
  createdBy?: string
  items: SupplyItem[]
}

export interface SupplyItemImport {
  flowerName: string
  heightCm: number
  purchasePrice: number
  quantity: number
  categoryId?: number
  categoryName?: string
  retailPrice?: number
}

export interface SupplyImportPreview {
  supplier?: string
  items: SupplyItemImport[]
  totalCost: number
  errors: string[]
}

export interface SupplyCreate {
  supplier: string
  farm?: string
  deliveryDate?: Date
  currency?: string
  rate?: number
  notes?: string
  comment?: string
  items: {
    flowerName: string
    heightCm: number
    purchasePrice: number
    quantity: number
    categoryId?: number
  }[]
}

// User management types
export type UserRole = 'admin' | 'manager' | 'florist' | 'courier'

export interface UserPermissions {
  orders: boolean
  warehouse: boolean
  customers: boolean
  production: boolean
  settings: boolean
  users: boolean
}

export interface User {
  id: number
  phone: string
  name: string
  email?: string
  role: UserRole
  isActive: boolean
  telegramId?: string
  permissions: UserPermissions
  shopId: number
  createdAt: Date
  updatedAt: Date
}

export interface UserCreate {
  phone: string
  name: string
  email?: string
  role: UserRole
  isActive?: boolean
}

export interface UserUpdate {
  name?: string
  email?: string
  role?: UserRole
  isActive?: boolean
}