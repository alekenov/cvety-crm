import axios from 'axios'
import type { Order, WarehouseItem, Delivery, TrackingData, CompanySettings, Customer, FloristTask, TaskStatus, ProductionQueueStats, Product, ProductWithStats, ProductCreate, ProductUpdate } from './types'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

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
    const { data } = await api.get<{ items: Order[]; total: number }>('/orders', { params })
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
    const { data } = await api.get<{ items: WarehouseItem[]; total: number }>('/warehouse', { params })
    return data
  },

  getById: async (id: string) => {
    const { data } = await api.get<WarehouseItem>(`/warehouse/${id}`)
    return data
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
    const { data } = await api.post<Delivery>('/warehouse/deliveries', delivery)
    return data
  },

  getDeliveries: async (params?: { skip?: number; limit?: number }) => {
    const { data } = await api.get<{ items: Delivery[]; total: number }>('/warehouse/deliveries', { params })
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
    const { data } = await api.get<CompanySettings>('/settings/')
    return data
  },

  update: async (updates: Partial<CompanySettings>) => {
    const { data } = await api.patch<CompanySettings>('/settings/', updates)
    return data
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
    
    const { data } = await api.get<{ items: Customer[]; total: number }>('/customers', { params: apiParams })
    return data
  },

  getById: async (id: string) => {
    const { data } = await api.get<Customer>(`/customers/${id}`)
    return data
  },

  create: async (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'ordersCount' | 'totalSpent'>) => {
    const { data } = await api.post<Customer>('/customers', customer)
    return data
  },

  update: async (id: string, updates: Partial<Customer>) => {
    const { data } = await api.put<Customer>(`/customers/${id}`, updates)
    return data
  },

  getOrders: async (customerId: string, params?: { skip?: number; limit?: number }) => {
    const { data } = await api.get<{ items: Order[]; total: number }>(`/customers/${customerId}/orders`, { params })
    return data
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

    const { data } = await api.get<any[]>('/products', { params: apiParams })
    
    // Convert response from snake_case to camelCase
    return {
      items: data.map(product => convertKeysToCamelCase({
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
      total: data.length
    }
  },

  getById: async (id: number) => {
    const { data } = await api.get<any>(`/products/${id}`)
    
    // Convert response from snake_case to camelCase
    return convertKeysToCamelCase({
      ...data,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      images: (data.images || []).map((img: any) => convertKeysToCamelCase({
        ...img,
        createdAt: new Date(img.created_at)
      }))
    }) as ProductWithStats
  },

  create: async (product: ProductCreate) => {
    // Convert camelCase to snake_case for backend
    const productData = convertKeysToSnakeCase(product)
    
    const { data } = await api.post<any>('/products', productData)
    
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

    const { data } = await api.get<{ items: any[]; total: number }>('/production/tasks', { params: apiParams })
    
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
        createdAt: new Date(task.created_at),
        assignedAt: task.assigned_at ? new Date(task.assigned_at) : undefined,
        startedAt: task.started_at ? new Date(task.started_at) : undefined,
        completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
        deadline: task.deadline ? new Date(task.deadline) : undefined,
        requiredBy: task.deadline ? new Date(task.deadline) : new Date(),
        customerName: task.order?.customer_name || 'Не указано',
        customerPhone: task.order?.customer_phone || '',
        products: task.order?.products || 'Не указано',
        orderNumber: `#${task.order_id}`,
        notes: task.instructions || task.florist_notes
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