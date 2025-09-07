'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export default function MagicLink() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [message, setMessage] = useState('Validando seu link de acesso...')

    useEffect(() => {
        const validateToken = async () => {
            const token = searchParams.get('token')

            if (!token) {
                setStatus('error')
                setMessage('Token não encontrado na URL')
                setTimeout(() => router.push('/auth/error?error=token-missing'), 3000)
                return
            }

            try {
                setMessage('Verificando token...')

                // Validate token with backend
                const response = await fetch('/api/auth/verify-token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ token }),
                })

                if (response.ok) {
                    setStatus('success')
                    setMessage('Login realizado com sucesso! Redirecionando...')

                    // Redirect to home
                    setTimeout(() => router.push('/?login=success'), 2000)
                } else {
                    const errorData = await response.json()
                    throw new Error(errorData.error || 'Token inválido')
                }
            } catch (error: any) {
                console.error('Token validation error:', error)
                setStatus('error')
                setMessage(error.message || 'Token inválido ou expirado')
                setTimeout(() => router.push('/auth/error?error=invalid-token'), 3000)
            }
        }

        validateToken()
    }, [searchParams, router])

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                {status === 'loading' && (
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                )}

                {status === 'success' && (
                    <div className="text-green-600 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-red-600 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                )}

                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {status === 'loading' && 'Verificando...'}
                    {status === 'success' && 'Sucesso!'}
                    {status === 'error' && 'Erro'}
                </h2>

                <p className="text-gray-600">
                    {message}
                </p>
            </div>
        </div>
    )
}
