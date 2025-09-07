'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import LoginModal from './LoginModal'
import ProfileModal from './ProfileModal'
import { Users, FileText, BookOpen, LogOut, User } from 'lucide-react'

interface LayoutWithSidebarProps {
    children: React.ReactNode
    showSearch?: boolean
    searchValue?: string
    onSearchChange?: (value: string) => void
}

export default function LayoutWithSidebar({
    children,
    showSearch = false,
    searchValue = "",
    onSearchChange
}: LayoutWithSidebarProps) {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
    const { user, isAuthenticated, logout, isLoading } = useAuth()

    const navItems = [
        { name: 'Professores', href: '/', icon: Users, active: true },
        { name: 'Provas', href: '/provas', icon: FileText, disabled: true },
        { name: 'Conteúdos', href: '/conteudos', icon: BookOpen, disabled: true }
    ]

    return (
        <>
            <div className="flex min-h-screen">
                {/* Sidebar fixa */}
                <div className="fixed top-0 left-0 w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col h-screen">
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-center h-16 bg-gradient-to-r from-blue-600 to-blue-800">
                            <h2 className="text-xl font-bold text-white">Professores da UFF</h2>
                        </div>

                        {/* User section */}
                        <div className="px-4 py-4 border-b border-gray-200">
                            {isAuthenticated ? (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <User className="h-8 w-8 text-gray-600 mr-3" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                                            <p className="text-xs text-gray-500">Usuário</p>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => setIsProfileModalOpen(true)}
                                            className="p-1 text-gray-600 hover:text-gray-900"
                                            title="Perfil"
                                        >
                                            <User className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={logout}
                                            className="p-1 text-gray-600 hover:text-gray-900"
                                            title="Sair"
                                        >
                                            <LogOut className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsLoginModalOpen(true)}
                                    className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                                >
                                    <User className="mr-3 h-5 w-5" />
                                    Entrar
                                </button>
                            )}
                        </div>

                        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                            {navItems.map((item) => (
                                <div key={item.name} className="relative">
                                    <a
                                        href={item.disabled ? '#' : item.href}
                                        className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${item.active && !item.disabled
                                            ? 'bg-blue-100 text-blue-700'
                                            : item.disabled
                                                ? 'text-gray-400 cursor-not-allowed'
                                                : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                        onClick={item.disabled ? (e) => e.preventDefault() : undefined}
                                    >
                                        <item.icon className="mr-3 h-5 w-5" />
                                        {item.name}
                                    </a>
                                    {item.disabled && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 rounded-md opacity-0 hover:opacity-100 transition-opacity">
                                            <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded shadow">Em desenvolvimento</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Main content */}
                <div className="flex-1 flex flex-col ml-64 bg-gray-50 min-h-screen">
                    {/* Page content */}
                    <div className="flex-1">
                        {children}
                    </div>
                </div>
            </div>

            <LoginModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
            />
            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
            />
        </>
    )
}
