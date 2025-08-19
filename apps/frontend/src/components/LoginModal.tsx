import { useState } from 'react'
import { authApi } from '../services/api'
import type { LoginModalProps } from '../types'

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const result = await authApi.requestMagicLink(email)
      if (result.ok) {
        if (result.redirect_url) {
          // For localhost, redirect directly to the magic link
          window.location.href = result.redirect_url
          return
        } else {
          setSent(true)
          setMessage(result.message || 'Link de acesso enviado para o seu email!')
        }
      }
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Erro ao enviar email. Use um email @id.uff.br ou @uff.br')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    onClose()
    setEmail('')
    setMessage('')
    setSent(false)
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
                Entrar na sua conta
              </h3>

              <div className="mt-4">
                {!sent ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
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
                      {loading ? 'Enviando...' : 'Enviar link mágico'}
                    </button>
                  </form>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="text-green-600">
                      <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">Email enviado!</h4>
                      <p className="text-gray-600 mt-2">
                        Verifique sua caixa de entrada e clique no link para fazer login.
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        O link expira em 15 minutos.
                      </p>
                    </div>
                    <button
                      onClick={handleClose}
                      className="text-primary-600 hover:text-primary-500 text-sm font-medium"
                    >
                      Fechar
                    </button>
                  </div>
                )}

                {message && !sent && (
                  <div className={`mt-4 p-3 rounded-md text-sm ${message.includes('Erro') || message.includes('erro')
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
