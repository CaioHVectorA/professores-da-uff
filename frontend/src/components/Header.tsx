import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import LoginModal from '../components/LoginModal'

interface HeaderProps {
  title?: string
  showSearch?: boolean
  searchValue?: string
  onSearchChange?: (value: string) => void
}

export default function Header({ 
  title = "QuadroScrap", 
  showSearch = false, 
  searchValue = "", 
  onSearchChange 
}: HeaderProps) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const { user, logout, isAuthenticated } = useAuth()

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">{title}</h1>
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
                      value={searchValue}
                      onChange={(e) => onSearchChange?.(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700">Olá, {user?.email}</span>
                  <button
                    onClick={logout}
                    className="text-sm text-red-600 hover:text-red-500 font-medium"
                  >
                    Sair
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Entrar
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </>
  )
}
