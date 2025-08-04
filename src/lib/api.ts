import axios from 'axios'
import type { Order, WarehouseItem, Delivery, TrackingData, CompanySettings, Customer, FloristTask, TaskStatus, ProductionQueueStats, Product, ProductWithStats, ProductCreate, ProductUpdate, ProductIngredient, ProductIngredientWithDetails, ProductIngredientCreate, ProductIngredientUpdate, FlowerCategory, Supply, SupplyCreate, SupplyImportPreview } from './types'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  maxRedirects: 5, // Follow redirects
})

// Add auth token interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Add shop phone header (required for multi-tenancy)
    // In test mode, use a fixed phone number
    config.headers['X-Shop-Phone'] = '+77007893838'
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Calculator API
export const calculatorApi = {
  getMaterials: async () => {
    const { data } = await api.get('/calculator/materials')
    return data
  },
  
  getSettings: async () => {
    const { data } = await api.get('/calculator/settings')
    return data
  },
  
  updateSettings: async (settings: any) => {
    const { data } = await api.patch('/calculator/settings', settings)
    return data
  },
  
  createMaterial: async (material: any) => {
    const { data } = await api.post('/calculator/materials', material)
    return data
  },
  
  updateMaterial: async (id: number, material: any) => {
    const { data } = await api.patch(`/calculator/materials/${id}`, material)
    return data
  },
  
  deleteMaterial: async (id: number) => {
    await api.delete(`/calculator/materials/${id}`)
  }
}

// Orders API
export const ordersApi = {
  getAll: async (params?: { 
    status?: string
    dateFrom?: string
    dateTo?: string
    search?: string
    page?: number
    limit?: number
  }) => {
    const { data } = await api.get<{ items: Order[]; total: number }>('/orders/', { params })
    return data
  },

  getById: async (id: string) => {
    const { data } = await api.get<Order>(`/orders/${id}`)
    return data
  },

  updateStatus: async (id: string, status: Order['status']) => {
    const { data } = await api.patch<Order>(`/orders/${id}/status`, { status })
    return data
  },

  markIssue: async (id: string, issueType: Order['issueType'], comment: string) => {
    const { data } = await api.patch<Order>(`/orders/${id}/issue`, { issueType, comment })
    return data
  },

  update: async (id: string, updates: Partial<Order>) => {
    const { data } = await api.patch<Order>(`/orders/${id}`, updates)
    return data
  },
  rollbackStatus: async (id: number, targetStatus: string, reason: string) => {
    const { data } = await api.post<Order>(`/orders/${id}/rollback-status`, {
      target_status: targetStatus,
      reason
    })
    return data
  },

  create: async (orderData: {
    customerPhone: string
    recipientPhone?: string
    recipientName?: string
    address?: string
    deliveryMethod: 'delivery' | 'self_pickup'
    deliveryWindow?: {
      from: string
      to: string
    }
    comment?: string
    items: Array<{
      productId: string
      quantity: number
      price: number
    }>
  }) => {
    // Convert camelCase to snake_case for API
    // Also remove spaces from phone numbers (backend expects format: +7XXXXXXXXXX)
    const apiData = {
      customer_phone: orderData.customerPhone.replace(/\s/g, ''),
      recipient_phone: orderData.recipientPhone?.replace(/\s/g, ''),
      recipient_name: orderData.recipientName,
      address: orderData.address,
      delivery_method: orderData.deliveryMethod,
      delivery_window: orderData.deliveryWindow ? {
        from_time: orderData.deliveryWindow.from,
        to_time: orderData.deliveryWindow.to
      } : undefined,
      comment: orderData.comment,
      items: orderData.items.map(item => ({
        product_id: parseInt(item.productId),
        quantity: item.quantity,
        price: item.price
      }))
    }
    
    console.log('Sending order data to API:', apiData)
    
    const { data } = await api.post<Order>('/orders/with-items', apiData)
    return data
  },
  
  cancelOrder: async (id: number, reason: string) => {
    const { data } = await api.post<Order>(`/orders/${id}/cancel`, {
      cancellation_reason: reason
    })
    return data
  },
  
  updateDeliveryWindow: async (id: number, deliveryWindow: { from: string; to: string }) => {
    const { data } = await api.patch<Order>(`/orders/${id}`, {
      delivery_window: deliveryWindow
    })
    return data
  },
}

// Warehouse API
export const warehouseApi = {
  getItems: async (params?: {
    variety?: string
    heightCm?: number
    farm?: string
    supplier?: string
    onShowcase?: boolean
    toWriteOff?: boolean
    search?: string
    page?: number
    limit?: number
  }) => {
    const { data } = await api.get<{ items: any[]; total: number }>('/warehouse/', { params })
    return {
      items: data.items.map(item => convertKeysToCamelCase(item)) as WarehouseItem[],
      total: data.total
    }
  },

  getById: async (id: string) => {
    const { data } = await api.get<any>(`/warehouse/${id}`)
    
    // Convert snake_case API response to camelCase
    return {
      id: data.id.toString(),
      sku: data.sku,
      batchCode: data.batch_code,
      variety: data.variety,
      heightCm: data.height_cm,
      farm: data.farm,
      supplier: data.supplier,
      deliveryDate: new Date(data.delivery_date),
      currency: data.currency,
      rate: data.rate,
      cost: data.cost,
      recommendedPrice: data.recommended_price,
      price: data.price,
      markupPct: data.markup_pct,
      qty: data.qty,
      reservedQty: data.reserved_qty,
      onShowcase: data.on_showcase,
      toWriteOff: data.to_write_off,
      hidden: data.hidden,
      updatedAt: new Date(data.updated_at),
      updatedBy: data.updated_by
    } as WarehouseItem
  },

  updateItem: async (id: string, updates: Partial<WarehouseItem>) => {
    const { data } = await api.patch<WarehouseItem>(`/warehouse/${id}`, updates)
    return data
  },

  getStats: async () => {
    const { data } = await api.get<{
      total_items: number
      total_value: number
      critical_items: number
      showcase_items: number
      writeoff_items: number
      by_variety: Record<string, number>
      by_supplier: Record<string, number>
    }>('/warehouse/stats')
    return data
  },

  createDelivery: async (delivery: Omit<Delivery, 'id' | 'costTotal'>) => {
    const { data } = await api.post<Delivery>('/warehouse/deliveries/', delivery)
    return data
  },

  getDeliveries: async (params?: { skip?: number; limit?: number }) => {
    const { data } = await api.get<{ items: Delivery[]; total: number }>('/warehouse/deliveries', { params })
    return data
  },

  // Movement methods
  getMovements: async (itemId: string, params?: { skip?: number; limit?: number }) => {
    const { data } = await api.get<{
      items: Array<{
        id: number
        warehouse_item_id: number
        type: 'in' | 'out' | 'adjustment'
        quantity: number
        description: string
        reference_type?: string
        reference_id?: string
        created_at: string
        created_by: string
        qty_before: number
        qty_after: number
      }>
      total: number
    }>(`/warehouse/${itemId}/movements`, { params })
    
    // Convert to frontend format
    return {
      items: data.items.map(movement => ({
        id: movement.id.toString(),
        type: movement.type,
        quantity: movement.quantity,
        description: movement.description,
        orderId: movement.reference_type === 'order' ? movement.reference_id : undefined,
        createdAt: new Date(movement.created_at),
        createdBy: movement.created_by
      })),
      total: data.total
    }
  },

  adjustStock: async (itemId: string, adjustment: { adjustment: number; reason: string; created_by?: string }) => {
    const { data } = await api.post(`/warehouse/${itemId}/adjust-stock`, {
      adjustment: adjustment.adjustment,
      reason: adjustment.reason,
      created_by: adjustment.created_by || 'user'
    })
    return data
  },
}

// Tracking API
export const trackingApi = {
  getByToken: async (token: string) => {
    const { data } = await api.get<TrackingData>(`/tracking/${token}`)
    return data
  },
}


// Settings API
export const settingsApi = {
  get: async () => {
    const { data } = await api.get<any>('/settings/')
    
    // Convert response from snake_case to camelCase
    return convertKeysToCamelCase({
      ...data,
      createdAt: data.created_at ? new Date(data.created_at) : undefined,
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
    }) as CompanySettings
  },

  update: async (updates: Partial<CompanySettings>) => {
    // Convert camelCase to snake_case for backend
    const updateData = convertKeysToSnakeCase(updates)
    
    const { data } = await api.patch<any>('/settings/', updateData)
    
    // Convert response from snake_case to camelCase
    return convertKeysToCamelCase({
      ...data,
      createdAt: data.created_at ? new Date(data.created_at) : undefined,
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
    }) as CompanySettings
  },
}

// Customers API
export const customersApi = {
  getAll: async (params?: {
    search?: string
    hasActiveOrders?: boolean
    page?: number
    limit?: number
    skip?: number
  }) => {
    // Convert page-based pagination to skip-based for backend
    const apiParams: any = { ...params }
    if (params?.page && params?.limit) {
      apiParams.skip = (params.page - 1) * params.limit
      delete apiParams.page
    }
    
    const { data } = await api.get<{ items: any[]; total: number }>('/customers/', { params: apiParams })
    
    // Convert dates from ISO strings
    return {
      items: data.items.map(customer => ({
        ...customer,
        createdAt: new Date(customer.created_at || customer.createdAt),
        updatedAt: new Date(customer.updated_at || customer.updatedAt),
        lastOrderDate: customer.last_order_date ? new Date(customer.last_order_date) : undefined,
        ordersCount: customer.orders_count || customer.ordersCount || 0,
        totalSpent: customer.total_spent || customer.totalSpent || 0,
        importantDates: customer.important_dates || customer.importantDates || [],
        // Convert addresses from array of objects to array of strings
        addresses: (customer.addresses || []).map((addr: any) => addr.address)
      })) as Customer[],
      total: data.total
    }
  },

  getById: async (id: string) => {
    const { data } = await api.get<any>(`/customers/${id}`)
    
    // Convert dates and handle snake_case fields
    return {
      ...data,
      createdAt: new Date(data.created_at || data.createdAt),
      updatedAt: new Date(data.updated_at || data.updatedAt),
      lastOrderDate: data.last_order_date ? new Date(data.last_order_date) : undefined,
      ordersCount: data.orders_count || data.ordersCount || 0,
      totalSpent: data.total_spent || data.totalSpent || 0,
      importantDates: data.important_dates || data.importantDates || [],
      // Convert addresses from array of objects to array of strings
      addresses: (data.addresses || []).map((addr: any) => addr.address)
    } as Customer
  },

  create: async (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'ordersCount' | 'totalSpent'>) => {
    const { data } = await api.post<any>('/customers/', customer)
    
    // Convert dates from ISO strings
    return {
      ...data,
      createdAt: new Date(data.created_at || data.createdAt),
      updatedAt: new Date(data.updated_at || data.updatedAt),
      lastOrderDate: data.last_order_date ? new Date(data.last_order_date) : undefined,
      ordersCount: data.orders_count || data.ordersCount || 0,
      totalSpent: data.total_spent || data.totalSpent || 0,
      importantDates: data.important_dates || data.importantDates || [],
      // Convert addresses from array of objects to array of strings
      addresses: (data.addresses || []).map((addr: any) => addr.address)
    } as Customer
  },

  update: async (id: string, updates: Partial<Customer>) => {
    const { data } = await api.put<any>(`/customers/${id}`, updates)
    
    // Convert dates from ISO strings
    return {
      ...data,
      createdAt: new Date(data.created_at || data.createdAt),
      updatedAt: new Date(data.updated_at || data.updatedAt),
      lastOrderDate: data.last_order_date ? new Date(data.last_order_date) : undefined,
      ordersCount: data.orders_count || data.ordersCount || 0,
      totalSpent: data.total_spent || data.totalSpent || 0,
      importantDates: data.important_dates || data.importantDates || [],
      // Convert addresses from array of objects to array of strings
      addresses: (data.addresses || []).map((addr: any) => addr.address)
    } as Customer
  },

  getOrders: async (customerId: string, params?: { skip?: number; limit?: number }) => {
    const { data } = await api.get<any[]>(`/customers/${customerId}/orders`, { params })
    
    // Backend returns array directly, not {items, total}
    // Convert dates from ISO strings
    const orders = (data || []).map(order => ({
      ...order,
      createdAt: new Date(order.created_at || order.createdAt),
      updatedAt: new Date(order.updated_at || order.updatedAt),
      deliveryWindow: order.delivery_window ? {
        from: new Date(order.delivery_window.from),
        to: new Date(order.delivery_window.to)
      } : order.deliveryWindow
    })) as Order[]
    
    return {
      items: orders,
      total: orders.length
    }
  },

  addAddress: async (customerId: string, address: { address: string; label?: string }) => {
    const { data } = await api.post<any>(`/customers/${customerId}/addresses`, address)
    return data
  },

  addImportantDate: async (customerId: string, importantDate: { date: string; description: string }) => {
    const { data } = await api.post<any>(`/customers/${customerId}/important-dates`, importantDate)
    return data
  },

  merge: async (keepCustomerId: string, mergeCustomerId: string) => {
    const { data } = await api.post<Customer>('/customers/merge', {
      keep_customer_id: keepCustomerId,
      merge_customer_id: mergeCustomerId
    })
    return data
  },

  updateStats: async (customerId: string) => {
    const { data } = await api.post<Customer>(`/customers/${customerId}/update-stats`)
    return data
  },

  search: async (query: string, limit: number = 10) => {
    const { data } = await api.get<{ items: Customer[]; total: number }>('/customers', {
      params: { search: query, limit }
    })
    return data
  },
}


// Product Ingredients API
export const productIngredientsApi = {
  getAll: async (productId: number) => {
    const { data } = await api.get<any[]>(`/products/${productId}/ingredients`)
    return data.map(item => convertKeysToCamelCase(item)) as ProductIngredientWithDetails[]
  },

  add: async (productId: number, ingredient: ProductIngredientCreate) => {
    const { data } = await api.post<any>(`/products/${productId}/ingredients`, ingredient)
    return convertKeysToCamelCase(data) as ProductIngredient
  },

  update: async (productId: number, ingredientId: number, updates: ProductIngredientUpdate) => {
    const { data } = await api.put<any>(`/products/${productId}/ingredients/${ingredientId}`, updates)
    return convertKeysToCamelCase(data) as ProductIngredient
  },

  delete: async (productId: number, ingredientId: number) => {
    await api.delete(`/products/${productId}/ingredients/${ingredientId}`)
  }
}

// Products API
export const productsApi = {
  getAll: async (params?: {
    category?: string
    search?: string
    isPopular?: boolean
    isNew?: boolean
    minPrice?: number
    maxPrice?: number
    onSale?: boolean
    skip?: number
    limit?: number
  }) => {
    // Convert camelCase params to snake_case for backend
    const apiParams: any = {}
    if (params?.category) apiParams.category = params.category
    if (params?.search) apiParams.search = params.search
    if (params?.isPopular !== undefined) apiParams.is_popular = params.isPopular
    if (params?.isNew !== undefined) apiParams.is_new = params.isNew
    if (params?.minPrice !== undefined) apiParams.min_price = params.minPrice
    if (params?.maxPrice !== undefined) apiParams.max_price = params.maxPrice
    if (params?.onSale !== undefined) apiParams.on_sale = params.onSale
    if (params?.skip !== undefined) apiParams.skip = params.skip
    if (params?.limit !== undefined) apiParams.limit = params.limit

    const { data } = await api.get<{ items: any[]; total: number }>('/products/', { params: apiParams })
    
    // Convert response from snake_case to camelCase
    return {
      items: data.items.map(product => convertKeysToCamelCase({
        ...product,
        // Ensure dates are converted to Date objects
        createdAt: new Date(product.created_at),
        updatedAt: new Date(product.updated_at),
        // Convert nested images array
        images: (product.images || []).map((img: any) => convertKeysToCamelCase({
          ...img,
          createdAt: new Date(img.created_at)
        }))
      })) as Product[],
      total: data.total
    }
  },

  getById: async (id: number) => {
    const { data } = await api.get<any>(`/products/${id}`)
    
    // Convert response from snake_case to camelCase
    return convertKeysToCamelCase(data) as ProductWithStats
  },

  create: async (product: ProductCreate) => {
    // Convert camelCase to snake_case for backend
    const productData = convertKeysToSnakeCase(product)
    
    const { data } = await api.post<any>('/products/', productData)
    
    // Convert response from snake_case to camelCase
    return convertKeysToCamelCase({
      ...data,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      images: (data.images || []).map((img: any) => convertKeysToCamelCase({
        ...img,
        createdAt: new Date(img.created_at)
      }))
    }) as Product
  },

  update: async (id: number, updates: ProductUpdate) => {
    // Convert camelCase to snake_case for backend
    const updateData = convertKeysToSnakeCase(updates)
    
    const { data } = await api.put<any>(`/products/${id}`, updateData)
    
    // Convert response from snake_case to camelCase
    return convertKeysToCamelCase(data) as Product
  },

  toggleActive: async (id: number) => {
    const { data } = await api.post<any>(`/products/${id}/toggle-active`)
    
    // Convert response from snake_case to camelCase
    return convertKeysToCamelCase({
      ...data,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      images: (data.images || []).map((img: any) => convertKeysToCamelCase({
        ...img,
        createdAt: new Date(img.created_at)
      }))
    }) as Product
  },

  updateImages: async (id: number, imageUrls: string[]) => {
    const { data } = await api.put<any>(`/products/${id}/images`, imageUrls)
    
    // Convert response from snake_case to camelCase
    return convertKeysToCamelCase(data) as Product
  },

  delete: async (id: number) => {
    const { data } = await api.delete<any>(`/products/${id}`)
    
    // Convert response from snake_case to camelCase
    return convertKeysToCamelCase({
      ...data,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      images: (data.images || []).map((img: any) => convertKeysToCamelCase({
        ...img,
        createdAt: new Date(img.created_at)
      }))
    }) as Product
  },
}

// Helper function to convert snake_case to camelCase for nested objects
const toCamelCase = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

const convertKeysToCamelCase = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') return obj
  
  if (Array.isArray(obj)) {
    return obj.map(convertKeysToCamelCase)
  }
  
  const converted: any = {}
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = toCamelCase(key)
    converted[camelKey] = convertKeysToCamelCase(value)
  }
  
  // Special handling for warehouse items - map price to priceKzt
  if (converted.price !== undefined && !converted.priceKzt) {
    converted.priceKzt = converted.price
  }
  
  // Convert date strings to Date objects
  const dateFields = ['createdAt', 'updatedAt', 'deliveryDate', 'created_at', 'updated_at', 'delivery_date']
  dateFields.forEach(field => {
    if (converted[field] && typeof converted[field] === 'string') {
      try {
        converted[field] = new Date(converted[field])
      } catch (e) {
        // Keep original value if date parsing fails
      }
    }
  })
  
  return converted
}

const convertKeysToSnakeCase = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') return obj
  
  if (Array.isArray(obj)) {
    return obj.map(convertKeysToSnakeCase)
  }
  
  const converted: any = {}
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
    converted[snakeKey] = convertKeysToSnakeCase(value)
  }
  return converted
}

// Auth API
export const authApi = {
  requestOtp: async (phone: string) => {
    const { data } = await api.post<{ message: string; otp?: string; delivery_method: string }>('/auth/request-otp', { phone })
    return data
  },

  verifyOtp: async (phone: string, otpCode: string) => {
    const { data } = await api.post<{ access_token: string; token_type: string }>('/auth/verify-otp', { 
      phone, 
      otp_code: otpCode 
    })
    return data
  },

  getMe: async () => {
    const { data } = await api.get<{
      id: number
      name: string
      phone: string
      telegram_id?: number
      telegram_username?: string
      city: string
      plan: string
      created_at: string
      updated_at: string
    }>('/auth/me')
    
    return {
      ...data,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  },

  logout: () => {
    localStorage.removeItem('authToken')
    window.location.href = '/login'
  }
}

// Production API
export const productionApi = {
  getAllTasks: async (params?: {
    status?: TaskStatus | 'assigned' | 'quality_check' | 'cancelled'
    priority?: 'urgent' | 'high' | 'normal' | 'low'
    floristId?: number
    taskType?: string
    page?: number
    limit?: number
  }) => {
    // Convert camelCase params to snake_case for backend
    const apiParams: any = {}
    if (params?.status) apiParams.status = params.status
    if (params?.priority) apiParams.priority = params.priority
    if (params?.floristId) apiParams.florist_id = params.floristId
    if (params?.taskType) apiParams.task_type = params.taskType
    if (params?.page) apiParams.skip = ((params.page - 1) * (params.limit || 20))
    if (params?.limit) apiParams.limit = params.limit

    const { data } = await api.get<{ items: any[]; total: number }>('/production/tasks/', { params: apiParams })
    
    // Convert response from snake_case to camelCase
    return {
      items: data.items.map(task => ({
        ...convertKeysToCamelCase(task),
        // Ensure dates are converted to Date objects
        createdAt: new Date(task.created_at),
        assignedAt: task.assigned_at ? new Date(task.assigned_at) : undefined,
        startedAt: task.started_at ? new Date(task.started_at) : undefined,
        completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
        deadline: task.deadline ? new Date(task.deadline) : undefined,
        requiredBy: task.deadline ? new Date(task.deadline) : new Date(),
        // Map backend fields to frontend fields for compatibility
        customerName: task.order?.customer_name || 'Не указано',
        customerPhone: task.order?.customer_phone || '',
        products: task.order?.products || 'Не указано',
        orderNumber: `#${task.order_id}`,
        notes: task.instructions || task.florist_notes
      })) as FloristTask[],
      total: data.total
    }
  },

  getPendingTasks: async () => {
    const { data } = await api.get<{ items: any[]; total: number }>('/production/tasks/pending')
    
    return {
      items: data.items.map(task => ({
        ...convertKeysToCamelCase(task),
        id: task.id.toString(),
        orderId: task.order_id.toString(),
        createdAt: new Date(task.created_at),
        assignedAt: task.assigned_at ? new Date(task.assigned_at) : undefined,
        startedAt: task.started_at ? new Date(task.started_at) : undefined,
        completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
        deadline: task.deadline ? new Date(task.deadline) : undefined,
        requiredBy: task.deadline ? new Date(task.deadline) : new Date(),
        customerName: `Заказ #${task.order_id}`,
        customerPhone: '+7 XXX XXX XX XX',
        products: task.task_type === 'bouquet' ? 'Букет' : 'Композиция',
        orderNumber: `#${task.order_id}`,
        notes: task.instructions || task.florist_notes,
        assignedTo: task.florist_id === 1 ? 'Марина' : task.florist_id === 2 ? 'Алия' : task.florist_id === 3 ? 'Светлана' : task.florist_id === 4 ? 'Гульнара' : undefined,
        priority: task.priority === 'urgent' ? 'high' : task.priority === 'normal' ? 'medium' : 'low'
      })) as FloristTask[],
      total: data.total
    }
  },

  getTaskById: async (id: string) => {
    const { data } = await api.get<any>(`/production/tasks/${id}`)
    
    return {
      ...convertKeysToCamelCase(data),
      createdAt: new Date(data.created_at),
      assignedAt: data.assigned_at ? new Date(data.assigned_at) : undefined,
      startedAt: data.started_at ? new Date(data.started_at) : undefined,
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
      requiredBy: data.deadline ? new Date(data.deadline) : new Date(),
      customerName: data.order?.customer_name || 'Не указано',
      customerPhone: data.order?.customer_phone || '',
      products: data.order?.products || 'Не указано',
      orderNumber: `#${data.order_id}`,
      notes: data.instructions || data.florist_notes
    } as FloristTask
  },

  assignTask: async (id: string, floristId: number) => {
    const { data } = await api.post<any>(`/production/tasks/${id}/assign`, {
      florist_id: floristId
    })
    
    return {
      ...convertKeysToCamelCase(data),
      createdAt: new Date(data.created_at),
      assignedAt: data.assigned_at ? new Date(data.assigned_at) : undefined,
      startedAt: data.started_at ? new Date(data.started_at) : undefined,
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
      requiredBy: data.deadline ? new Date(data.deadline) : new Date(),
      customerName: data.order?.customer_name || 'Не указано',
      customerPhone: data.order?.customer_phone || '',
      products: data.order?.products || 'Не указано',
      orderNumber: `#${data.order_id}`,
      notes: data.instructions || data.florist_notes
    } as FloristTask
  },

  startTask: async (id: string, floristNotes?: string) => {
    const { data } = await api.post<any>(`/production/tasks/${id}/start`, {
      florist_notes: floristNotes
    })
    
    return {
      ...convertKeysToCamelCase(data),
      createdAt: new Date(data.created_at),
      assignedAt: data.assigned_at ? new Date(data.assigned_at) : undefined,
      startedAt: data.started_at ? new Date(data.started_at) : undefined,
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
      requiredBy: data.deadline ? new Date(data.deadline) : new Date(),
      customerName: data.order?.customer_name || 'Не указано',
      customerPhone: data.order?.customer_phone || '',
      products: data.order?.products || 'Не указано',
      orderNumber: `#${data.order_id}`,
      notes: data.instructions || data.florist_notes
    } as FloristTask
  },

  completeTask: async (id: string, params?: {
    actualMinutes?: number
    floristNotes?: string
    resultPhotos?: string[]
  }) => {
    const requestData: any = {}
    if (params?.actualMinutes) requestData.actual_minutes = params.actualMinutes
    if (params?.floristNotes) requestData.florist_notes = params.floristNotes
    if (params?.resultPhotos) requestData.result_photos = params.resultPhotos

    const { data } = await api.post<any>(`/production/tasks/${id}/complete`, requestData)
    
    return {
      ...convertKeysToCamelCase(data),
      createdAt: new Date(data.created_at),
      assignedAt: data.assigned_at ? new Date(data.assigned_at) : undefined,
      startedAt: data.started_at ? new Date(data.started_at) : undefined,
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
      requiredBy: data.deadline ? new Date(data.deadline) : new Date(),
      customerName: data.order?.customer_name || 'Не указано',
      customerPhone: data.order?.customer_phone || '',
      products: data.order?.products || 'Не указано',
      orderNumber: `#${data.order_id}`,
      notes: data.instructions || data.florist_notes
    } as FloristTask
  },

  qualityCheck: async (id: string, params: {
    qualityScore: number
    qualityApproved: boolean
    qualityNotes?: string
  }) => {
    const { data } = await api.post<any>(`/production/tasks/${id}/quality-check`, {
      quality_score: params.qualityScore,
      quality_approved: params.qualityApproved,
      quality_notes: params.qualityNotes
    })
    
    return {
      ...convertKeysToCamelCase(data),
      createdAt: new Date(data.created_at),
      assignedAt: data.assigned_at ? new Date(data.assigned_at) : undefined,
      startedAt: data.started_at ? new Date(data.started_at) : undefined,
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
      requiredBy: data.deadline ? new Date(data.deadline) : new Date(),
      customerName: data.order?.customer_name || 'Не указано',
      customerPhone: data.order?.customer_phone || '',
      products: data.order?.products || 'Не указано',
      orderNumber: `#${data.order_id}`,
      notes: data.instructions || data.florist_notes
    } as FloristTask
  },

  getQueueStats: async (): Promise<ProductionQueueStats> => {
    const { data } = await api.get<{
      pending_tasks: number
      assigned_tasks: number
      in_progress_tasks: number
      overdue_tasks: number
      urgent_tasks: number
      tasks_by_type: Record<string, number>
      tasks_by_priority: Record<string, number>
    }>('/production/queue/stats')
    
    return {
      pendingTasks: data.pending_tasks,
      assignedTasks: data.assigned_tasks,
      inProgressTasks: data.in_progress_tasks,
      overdueTasks: data.overdue_tasks,
      urgentTasks: data.urgent_tasks,
      tasksByType: data.tasks_by_type,
      tasksByPriority: data.tasks_by_priority
    } as ProductionQueueStats
  },

  updateTask: async (id: string, updates: {
    floristId?: number
    status?: TaskStatus | 'assigned' | 'quality_check' | 'cancelled'
    priority?: 'urgent' | 'high' | 'normal' | 'low'
    deadline?: Date
    instructions?: string
    floristNotes?: string
    qualityNotes?: string
    qualityScore?: number
    actualMinutes?: number
    workPhotos?: string[]
    resultPhotos?: string[]
  }) => {
    // Convert camelCase updates to snake_case
    const requestData = convertKeysToSnakeCase(updates)
    
    // Handle date conversion
    if (updates.deadline) {
      requestData.deadline = updates.deadline.toISOString()
    }

    const { data } = await api.patch<any>(`/production/tasks/${id}`, requestData)
    
    return {
      ...convertKeysToCamelCase(data),
      createdAt: new Date(data.created_at),
      assignedAt: data.assigned_at ? new Date(data.assigned_at) : undefined,
      startedAt: data.started_at ? new Date(data.started_at) : undefined,
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
      requiredBy: data.deadline ? new Date(data.deadline) : new Date(),
      customerName: data.order?.customer_name || 'Не указано',
      customerPhone: data.order?.customer_phone || '',
      products: data.order?.products || 'Не указано',
      orderNumber: `#${data.order_id}`,
      notes: data.instructions || data.florist_notes
    } as FloristTask
  },
}

// Supplies API
export const suppliesApi = {
  // Categories
  getCategories: async (): Promise<FlowerCategory[]> => {
    const { data } = await api.get<any[]>('/supplies/categories')
    return data.map(item => ({
      ...convertKeysToCamelCase(item),
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at)
    }))
  },

  createCategory: async (category: { name: string; markupPercentage: number; keywords?: string }): Promise<FlowerCategory> => {
    const { data } = await api.post<any>('/supplies/categories', convertKeysToSnakeCase(category))
    return {
      ...convertKeysToCamelCase(data),
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  },

  updateCategory: async (id: number, updates: { name?: string; markupPercentage?: number; keywords?: string }): Promise<FlowerCategory> => {
    const { data } = await api.put<any>(`/supplies/categories/${id}`, convertKeysToSnakeCase(updates))
    return {
      ...convertKeysToCamelCase(data),
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  },

  // Supply import
  parseSupplyText: async (text: string, supplier?: string): Promise<SupplyImportPreview> => {
    const { data } = await api.post<any>('/supplies/parse', { text, supplier })
    return {
      supplier: data.supplier,
      items: data.items.map((item: any) => convertKeysToCamelCase(item)),
      totalCost: data.total_cost,
      errors: data.errors
    }
  },

  importSupply: async (supply: SupplyCreate): Promise<Supply> => {
    const { data } = await api.post<any>('/supplies/import', convertKeysToSnakeCase(supply))
    return {
      ...convertKeysToCamelCase(data),
      createdAt: new Date(data.created_at),
      items: data.items.map((item: any) => ({
        ...convertKeysToCamelCase(item),
        createdAt: new Date(item.created_at),
        category: item.category ? {
          ...convertKeysToCamelCase(item.category),
          createdAt: new Date(item.category.created_at),
          updatedAt: new Date(item.category.updated_at)
        } : undefined
      }))
    }
  },

  // Supplies list
  getSupplies: async (params?: { skip?: number; limit?: number; status?: string }): Promise<{ items: Supply[]; total: number }> => {
    const { data } = await api.get<any>('/supplies/', { params })
    return {
      items: data.items.map((supply: any) => ({
        ...convertKeysToCamelCase(supply),
        createdAt: new Date(supply.created_at),
        items: supply.items.map((item: any) => ({
          ...convertKeysToCamelCase(item),
          createdAt: new Date(item.created_at),
          category: item.category ? {
            ...convertKeysToCamelCase(item.category),
            createdAt: new Date(item.category.created_at),
            updatedAt: new Date(item.category.updated_at)
          } : undefined
        }))
      })),
      total: data.total
    }
  },

  getSupply: async (id: number): Promise<Supply> => {
    const { data } = await api.get<any>(`/supplies/${id}`)
    return {
      ...convertKeysToCamelCase(data),
      createdAt: new Date(data.created_at),
      items: data.items.map((item: any) => ({
        ...convertKeysToCamelCase(item),
        createdAt: new Date(item.created_at),
        category: item.category ? {
          ...convertKeysToCamelCase(item.category),
          createdAt: new Date(item.category.created_at),
          updatedAt: new Date(item.category.updated_at)
        } : undefined
      }))
    }
  },

  archiveSupply: async (id: number): Promise<Supply> => {
    const { data } = await api.put<any>(`/supplies/${id}/archive`)
    return {
      ...convertKeysToCamelCase(data),
      createdAt: new Date(data.created_at),
      items: data.items.map((item: any) => ({
        ...convertKeysToCamelCase(item),
        createdAt: new Date(item.created_at),
        category: item.category ? {
          ...convertKeysToCamelCase(item.category),
          createdAt: new Date(item.category.created_at),
          updatedAt: new Date(item.category.updated_at)
        } : undefined
      }))
    }
  }
}