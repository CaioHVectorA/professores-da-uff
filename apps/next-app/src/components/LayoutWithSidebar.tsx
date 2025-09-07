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
                {/* Sidebar sempre aberta */}
                <div className="w-64 bg-white shadow-lg border-r border-gray-200">
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-center h-16 bg-gradient-to-r from-blue-600 to-blue-800">
                            <h2 className="text-xl font-bold text-white">Professores da UFF</h2>
                        </div>
                        <nav className="flex-1 px-4 py-6 space-y-2">
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
                        {isAuthenticated && user && (
                            <div className="px-4 py-4 border-t border-gray-200">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700">
                                        Olá, {user.email?.split('@')[0]}
                                    </span>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => setIsProfileModalOpen(true)}
                                            className="p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                                            title="Perfil"
                                        >
                                            <User size={20} />
                                        </button>
                                        <button
                                            onClick={logout}
                                            className="p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                                            title="Sair"
                                        >
                                            <LogOut size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main content */}
                <div className="flex-1 flex flex-col">
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
