import React, { createContext, useContext, useState, useEffect } from 'react'
import type { User } from '../types'

interface AuthContextType {
  user: User | null
  login: (token: string) => void
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

  useEffect(() => {
    // Check if user is logged in on app start
    const token = localStorage.getItem('auth_token')
    if (token) {
      // In a real app, you'd verify the token with the server
      setIsAuthenticated(true)
      // For now, we'll create a mock user
      setUser({
        id: 1,
        email: 'user@id.uff.br',
        verified: true
      })
    }
  }, [])

  const login = (token: string) => {
    localStorage.setItem('auth_token', token)
    setIsAuthenticated(true)
    // In a real app, you'd decode the token or fetch user info
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
