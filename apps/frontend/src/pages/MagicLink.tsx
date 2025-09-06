import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function MagicLink() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [message, setMessage] = useState('Validando seu link de acesso...')

    useEffect(() => {
        const validateToken = async () => {
            const token = searchParams.get('token')

            if (!token) {
                setStatus('error')
                setMessage('Token não encontrado na URL')
                setTimeout(() => navigate('/auth-error?error=token-missing'), 3000)
                return
            }

            try {
                setMessage('Verificando token...')

                // Validate token with backend
                const response = await api.post('/auth/verify-token', { token })

                if (response.data.ok) {
                    setStatus('success')
                    setMessage('Login realizado com sucesso! Redirecionando...')

                    // Redirect to home with success param to trigger user fetch
                    setTimeout(() => navigate('/?login=success'), 2000)
                } else {
                    throw new Error('Token inválido')
                }
            } catch (error: any) {
                console.error('Token validation error:', error)
                setStatus('error')
                setMessage(error.response?.data?.error || 'Token inválido ou expirado')
                // setTimeout(() => navigate('/auth-error?error=invalid-token'), 3000)
            }
        }

        validateToken()
    }, [searchParams, navigate])

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                {status === 'loading' && (
                    <>
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Validando Link de Acesso
                        </h2>
                        <p className="text-gray-600">{message}</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Login Realizado!
                        </h2>
                        <p className="text-gray-600">{message}</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Erro na Validação
                        </h2>
                        <p className="text-gray-600">{message}</p>
                        <p className="text-sm text-gray-500 mt-2">
                            Redirecionando para a página inicial...
                        </p>
                    </>
                )}
            </div>
        </div>
    )
}