import { api } from '../api'

export interface Comment {
  id: number
  text: string
  created_at: string
  user: {
    id: number
    name: string
  }
}

export interface CommentCreate {
  text: string
}

export interface CommentUpdate {
  text: string
}

export const commentsApi = {
  // Get all comments for an order
  getByOrder: async (orderId: number) => {
    const response = await api.get<{ items: Comment[], total: number }>(`/orders/${orderId}/comments`)
    return response.data
  },

  // Create a new comment
  create: async (orderId: number, data: CommentCreate) => {
    const response = await api.post<Comment>(`/orders/${orderId}/comments`, data)
    return response.data
  },

  // Update a comment
  update: async (commentId: number, data: CommentUpdate) => {
    const response = await api.patch<Comment>(`/comments/${commentId}`, data)
    return response.data
  },

  // Delete a comment
  delete: async (commentId: number) => {
    await api.delete(`/comments/${commentId}`)
  }
}