'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface User {
    id: number
    email: string
    verifiedAt: string | null
    isAdmin: boolean
}

interface AuthContextType {
    user: User | null
    login: () => void
    logout: () => void
    isAuthenticated: boolean
    isLoading: boolean
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
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
        const initAuth = async () => {
            // Check for login success from magic link redirect
            const loginSuccess = searchParams.get('login')
            if (loginSuccess === 'success') {
                // Remove success param from URL
                const newSearchParams = new URLSearchParams(searchParams.toString())
                newSearchParams.delete('login')
                const newUrl = `${window.location.pathname}${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ''}`
                window.history.replaceState({}, '', newUrl)
            }

            // Always check for existing session
            try {
                const response = await fetch('/api/auth/user')
                if (response.ok) {
                    const userData = await response.json()
                    setUser(userData)
                    setIsAuthenticated(true)
                } else {
                    setIsAuthenticated(false)
                    setUser(null)
                }
            } catch (error) {
                console.error('Auth check error:', error)
                setIsAuthenticated(false)
                setUser(null)
            } finally {
                setIsLoading(false)
            }
        }

        initAuth()
    }, [searchParams])

    const login = () => {
        // This will be handled by the LoginModal component
    }

    const logout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' })
            setUser(null)
            setIsAuthenticated(false)
            window.location.href = '/'
        } catch (error) {
            console.error('Logout error:', error)
        }
    }

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            isAuthenticated,
            isLoading
        }}>
            {children}
        </AuthContext.Provider>
    )
}
