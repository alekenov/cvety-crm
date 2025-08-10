import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://cvety-kz-production.up.railway.app'  // В production будет URL backend сервиса

// Types for API responses
export interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerPhone: string
  status: 'pending' | 'confirmed' | 'production' | 'ready' | 'delivering' | 'completed' | 'cancelled'
  total: number
  items: OrderItem[]
  createdAt: Date
  updatedAt: Date
  deliveryAddress?: string
  deliveryWindow?: {
    from: Date
    to: Date
  }
  comment?: string
}

export interface OrderItem {
  id: string
  productId: string
  productName: string
  quantity: number
  price: number
  total: number
}

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  category: string
  images: string[]
  isActive: boolean
  isPopular?: boolean
  isNew?: boolean
  stock?: number
  createdAt: Date
  updatedAt: Date
}

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  isRead: boolean
  createdAt: Date
  orderId?: string
  actionUrl?: string
}

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page?: number
  limit?: number
}

// API Error type
export interface ApiError {
  message: string
  status: number
  code?: string
}

class ApiService {
  private api: AxiosInstance

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor - add JWT token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }

        // Add shop phone header for multi-tenancy
        const shopPhone = localStorage.getItem('shopPhone')
        if (shopPhone) {
          config.headers['X-Shop-Phone'] = shopPhone
        }

        return config
      },
      (error) => {
        return Promise.reject(this.handleError(error))
      }
    )

    // Response interceptor - handle token refresh and errors
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          await this.handleTokenExpired()
        }
        return Promise.reject(this.handleError(error))
      }
    )
  }

  private handleError(error: AxiosError): ApiError {
    const errorData = error.response?.data as any
    const message = errorData?.message || error.message || 'Произошла ошибка'
    const status = error.response?.status || 500
    const code = errorData?.code

    return {
      message,
      status,
      code,
    }
  }

  private async handleTokenExpired() {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        })
        
        const { accessToken, refreshToken: newRefreshToken } = response.data
        localStorage.setItem('authToken', accessToken)
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken)
        }
        
        return accessToken
      }
    } catch (error) {
      // Refresh failed, redirect to login
      this.logout()
    }
  }

  private logout() {
    localStorage.removeItem('authToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('shopPhone')
    
    // In Telegram Mini App, we might want to close the app or show a login screen
    // instead of redirecting to a web page
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.showAlert('Сессия истекла. Пожалуйста, авторизуйтесь заново.')
    }
  }

  // Orders API
  async getOrders(params?: {
    status?: string
    search?: string
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<Order>> {
    const response = await this.api.get<PaginatedResponse<Order>>('/orders/', {
      params,
    })
    
    // Convert date strings to Date objects
    return {
      ...response.data,
      items: response.data.items.map(order => ({
        ...order,
        createdAt: new Date(order.createdAt),
        updatedAt: new Date(order.updatedAt),
        deliveryWindow: order.deliveryWindow ? {
          from: new Date(order.deliveryWindow.from),
          to: new Date(order.deliveryWindow.to),
        } : undefined,
      })),
    }
  }

  async getOrderById(id: string): Promise<Order> {
    const response = await this.api.get<Order>(`/orders/${id}`)
    
    return {
      ...response.data,
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
      deliveryWindow: response.data.deliveryWindow ? {
        from: new Date(response.data.deliveryWindow.from),
        to: new Date(response.data.deliveryWindow.to),
      } : undefined,
    }
  }

  async updateOrderStatus(id: string, status: Order['status']): Promise<Order> {
    const response = await this.api.patch<Order>(`/orders/${id}/status`, {
      status,
    })
    
    return {
      ...response.data,
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
      deliveryWindow: response.data.deliveryWindow ? {
        from: new Date(response.data.deliveryWindow.from),
        to: new Date(response.data.deliveryWindow.to),
      } : undefined,
    }
  }

  // Products API
  async getProducts(params?: {
    category?: string
    search?: string
    isPopular?: boolean
    isNew?: boolean
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<Product>> {
    const response = await this.api.get<PaginatedResponse<Product>>('/products/', {
      params,
    })
    
    return {
      ...response.data,
      items: response.data.items.map(product => ({
        ...product,
        createdAt: new Date(product.createdAt),
        updatedAt: new Date(product.updatedAt),
      })),
    }
  }

  async getProductById(id: string): Promise<Product> {
    const response = await this.api.get<Product>(`/products/${id}`)
    
    return {
      ...response.data,
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
    }
  }

  // Notifications API
  async getNotifications(params?: {
    isRead?: boolean
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<Notification>> {
    const response = await this.api.get<PaginatedResponse<Notification>>('/notifications/', {
      params,
    })
    
    return {
      ...response.data,
      items: response.data.items.map(notification => ({
        ...notification,
        createdAt: new Date(notification.createdAt),
      })),
    }
  }

  async markNotificationAsRead(id: string): Promise<Notification> {
    const response = await this.api.patch<Notification>(`/notifications/${id}/read`)
    
    return {
      ...response.data,
      createdAt: new Date(response.data.createdAt),
    }
  }

  async markAllNotificationsAsRead(): Promise<void> {
    await this.api.post('/notifications/mark-all-read')
  }

  // Auth API
  async login(credentials: { phone: string; otpCode: string }): Promise<{
    accessToken: string
    refreshToken: string
    user: {
      id: string
      name: string
      phone: string
      shopId: string
      shopName: string
    }
  }> {
    const response = await this.api.post('/auth/verify-otp', credentials)
    
    const { access_token, refresh_token, ...userData } = response.data
    
    // Store tokens
    localStorage.setItem('authToken', access_token)
    if (refresh_token) {
      localStorage.setItem('refreshToken', refresh_token)
    }
    if (userData.shop_phone) {
      localStorage.setItem('shopPhone', userData.shop_phone)
    }
    
    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      user: {
        id: userData.id,
        name: userData.name,
        phone: userData.phone,
        shopId: userData.shop_id,
        shopName: userData.shop_name,
      },
    }
  }

  async floristLogin(data: { initData: string; phoneNumber: string }): Promise<{
    accessToken: string
    userRole: string
    userName: string
    shopId: number
    shopName: string
  }> {
    const response = await this.api.post('/auth/florist-login', data)
    
    const { access_token, user_role, user_name, shop_id, shop_name } = response.data
    
    // Store tokens and user info
    localStorage.setItem('authToken', access_token)
    localStorage.setItem('userRole', user_role)
    localStorage.setItem('userName', user_name)
    localStorage.setItem('shopId', shop_id.toString())
    localStorage.setItem('shopName', shop_name)
    
    return {
      accessToken: access_token,
      userRole: user_role,
      userName: user_name,
      shopId: shop_id,
      shopName: shop_name,
    }
  }

  async requestOtp(phone: string): Promise<{ message: string }> {
    const response = await this.api.post('/auth/request-otp', { phone })
    return response.data
  }

  async getCurrentUser(): Promise<{
    id: string
    name: string
    phone: string
    shopId: string
    shopName: string
  }> {
    const response = await this.api.get('/auth/me')
    return response.data
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await this.api.get('/health')
    return response.data
  }
}

// Export singleton instance
export const apiService = new ApiService()
export default apiService