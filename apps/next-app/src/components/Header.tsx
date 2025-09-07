'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import LoginModal from './LoginModal'
import { Menu, X, Users, FileText, BookOpen } from 'lucide-react'

interface HeaderProps {
  title?: string
  showSearch?: boolean
  searchValue?: string
  onSearchChange?: (value: string) => void
}

export default function Header({
  title = "Professores da UFF",
  showSearch = false,
  searchValue = "",
  onSearchChange
}: HeaderProps) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { user, isAuthenticated, logout, isLoading } = useAuth()

  const navItems = [
    { name: 'Professores', href: '/', icon: Users, active: true },
    { name: 'Provas', href: '/provas', icon: FileText, disabled: true },
    { name: 'Conteúdos', href: '/conteudos', icon: BookOpen, disabled: true }
  ]

  return (
    <>
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg border-b border-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="mr-4 p-2 rounded-md text-white hover:bg-blue-700 transition-colors"
              >
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <h1 className="text-2xl font-bold text-white">{title}</h1>
              {showSearch && (
                <div className="ml-8 flex-1 max-w-lg">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar professores..."
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={searchValue}
                      onChange={(e) => onSearchChange?.(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {isLoading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : isAuthenticated && user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-white">
                    Olá, {user.email?.split('@')[0]}
                  </span>
                  <button
                    onClick={logout}
                    className="bg-white text-blue-600 hover:bg-gray-100 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Sair
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="bg-white text-blue-600 hover:bg-gray-100 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-16 bg-gradient-to-r from-blue-600 to-blue-800">
            <h2 className="text-xl font-bold text-white">Menu</h2>
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
        </div>
      </div>

      {/* Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  )
}
