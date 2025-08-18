import { useState } from 'react'
import { authApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import type { LoginModalProps } from '../types'

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'email' | 'token'>('email')
  const [message, setMessage] = useState('')
  const [token, setToken] = useState('')
  const [devToken, setDevToken] = useState('')
  const { login } = useAuth()

  if (!isOpen) return null

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const result = await authApi.requestLogin(email)
      if (result.ok) {
        if (result.dev_token) {
          setDevToken(result.dev_token)
          setMessage('Token de desenvolvimento gerado. Use-o para fazer login.')
        } else {
          setMessage('Email enviado! Verifique sua caixa de entrada.')
        }
        setStep('token')
      }
    } catch (error) {
      setMessage('Erro ao enviar email. Use um email @id.uff.br ou @uff.br')
    } finally {
      setLoading(false)
    }
  }

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const result = await authApi.verifyToken(token)
      if (result.ok && result.token) {
        login(result.token)
        onClose()
        setStep('email')
        setEmail('')
        setToken('')
        setMessage('')
      }
    } catch (error) {
      setMessage('Token inválido ou expirado')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    onClose()
    setStep('email')
    setEmail('')
    setToken('')
    setMessage('')
    setDevToken('')
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />
        
        {/* Modal panel */}
        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
          <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
            <button
              type="button"
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              onClick={handleClose}
            >
              <span className="sr-only">Fechar</span>
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
              <h3 className="text-lg font-semibold leading-6 text-gray-900">
                {step === 'email' ? 'Entrar na sua conta' : 'Verificar token'}
              </h3>

              <div className="mt-4">
                {step === 'email' ? (
                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email UFF
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu.email@id.uff.br"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                    >
                      {loading ? 'Enviando...' : 'Enviar link de acesso'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleTokenSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="token" className="block text-sm font-medium text-gray-700">
                        Token de verificação
                      </label>
                      <input
                        type="text"
                        id="token"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder={devToken || "Cole o token do email aqui"}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                        required
                      />
                      {devToken && (
                        <button
                          type="button"
                          onClick={() => setToken(devToken)}
                          className="mt-2 text-sm text-primary-600 hover:text-primary-500"
                        >
                          Usar token de desenvolvimento
                        </button>
                      )}
                    </div>
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => setStep('email')}
                        className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        Voltar
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                      >
                        {loading ? 'Verificando...' : 'Entrar'}
                      </button>
                    </div>
                  </form>
                )}

                {message && (
                  <div className={`mt-4 p-3 rounded-md text-sm ${
                    message.includes('Erro') || message.includes('inválido') 
                      ? 'bg-red-50 text-red-700' 
                      : 'bg-green-50 text-green-700'
                  }`}>
                    {message}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
