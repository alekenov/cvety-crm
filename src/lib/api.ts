import axios from 'axios'
import type { Order, WarehouseItem, Delivery, TrackingData } from './types'

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

  updateItem: async (id: string, updates: Partial<WarehouseItem>) => {
    const { data } = await api.patch<WarehouseItem>(`/warehouse/${id}`, updates)
    return data
  },

  createDelivery: async (delivery: Omit<Delivery, 'id' | 'costTotal'>) => {
    const { data } = await api.post<Delivery>('/warehouse/deliveries', delivery)
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