import React, { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../services/api'
import type { User } from '../types'

interface AuthContextType {
    user: User | null
    isAuthenticated: boolean
    loading: boolean
    checkAuth: () => Promise<void>
    logout: () => Promise<void>
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
    const [loading, setLoading] = useState(true)

    const checkAuth = async () => {
        setLoading(true)
        try {
            const userData = await authApi.getCurrentUser()
            setUser(userData)
            setIsAuthenticated(true)
        } catch (error) {
            setUser(null)
            setIsAuthenticated(false)
        } finally {
            setLoading(false)
        }
    }

    const logout = async () => {
        try {
            await authApi.logout()
        } catch (error) {
            console.error('Logout error:', error)
        } finally {
            setUser(null)
            setIsAuthenticated(false)
        }
    }

    useEffect(() => {
        const handleTokenFromUrl = async () => {
            const urlParams = new URLSearchParams(window.location.search)
            const token = urlParams.get('token')

            if (token) {
                setLoading(true)
                try {
                    await authApi.verifyToken(token)
                    await checkAuth()
                    // Clean up URL
                    window.history.replaceState({}, document.title, window.location.pathname)
                } catch (error) {
                    console.error('Token verification error:', error)
                    // Clean up URL even if there's an error
                    window.history.replaceState({}, document.title, window.location.pathname)
                } finally {
                    setLoading(false)
                }
            } else {
                checkAuth()
            }
        }

        handleTokenFromUrl()
    }, [])

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, loading, checkAuth, logout }}>
            {children}
        </AuthContext.Provider>
    )
}
