import React, { createContext, useContext, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../services/api'
import type { User } from '../types'

interface AuthContextType {
  user: User | null
  login: () => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    const initAuth = async () => {
      // Check for login success from magic link redirect
      const loginSuccess = searchParams.get('login')
      if (loginSuccess === 'success') {
        try {
          // Remove success param from URL
          searchParams.delete('login')
          setSearchParams(searchParams, { replace: true })

          // Get user info from current session
          const userInfo = await api.get('/auth/user')
          setUser(userInfo.data)
          setIsAuthenticated(true)
        } catch (error) {
          console.error('Session validation failed:', error)
        }
      }
      // Removed automatic login check - only login via magic link
    }

    initAuth()
  }, [searchParams, setSearchParams])

  const login = () => {
    // Login is now session-based only
    setIsAuthenticated(true)
    setUser({
      id: 1,
      email: 'user@id.uff.br',
      verified: true
    })
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    setIsAuthenticated(false)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}
