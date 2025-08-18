import axios from 'axios'
import type { ApiResponse, Professor, Review } from '../types'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const professorApi = {
  // Get paginated list of professors
  getProfessors: async (query = '', page = 1, pageSize = 20): Promise<ApiResponse<Professor[]>> => {
    const response = await api.get('/professors', {
      params: { q: query, page, pageSize }
    })
    return response.data
  },

  // Get professor reviews
  getProfessorReviews: async (professorId: number): Promise<ApiResponse<Review[]>> => {
    const response = await api.get(`/professors/${professorId}/reviews`)
    return response.data
  },
}

export const authApi = {
  // Request login email
  requestLogin: async (email: string): Promise<{ ok: boolean; dev_token?: string }> => {
    const response = await api.post('/auth/request', { email })
    return response.data
  },

  // Verify login token
  verifyToken: async (token: string): Promise<{ ok: boolean; token?: string }> => {
    const response = await api.get('/auth/verify', {
      params: { token }
    })
    return response.data
  },
}

export default api
