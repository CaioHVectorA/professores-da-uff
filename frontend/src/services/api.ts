import axios from 'axios'
import type { ApiResponse, Professor, Review } from '../types'

const api = axios.create({
    baseURL: '/api',
    timeout: 10000,
    withCredentials: true, // Enable cookies
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
    // Request magic link via email
    requestMagicLink: async (email: string): Promise<{ ok: boolean; message: string; redirect_url?: string }> => {
        const response = await api.post('/auth/login', { email })
        return response.data
    },

    // Get current user info
    getCurrentUser: async () => {
        const response = await api.get('/auth/user')
        return response.data
    },

    // Verify token from URL
    verifyToken: async (token: string) => {
        const response = await api.post('/auth/verify-token', { token })
        return response.data
    },

    // Logout
    logout: async () => {
        const response = await api.post('/auth/logout')
        return response.data
    },
}

export default api
