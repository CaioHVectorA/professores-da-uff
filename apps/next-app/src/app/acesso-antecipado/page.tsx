'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function AcessoAntecipadoPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()
    const otpRefs = useRef<(HTMLInputElement | null)[]>([])

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) return // Only allow single digit
        const newPassword = password.split('')
        newPassword[index] = value
        setPassword(newPassword.join(''))

        // Auto-focus next input
        if (value && index < 7) {
            otpRefs.current[index + 1]?.focus()
        }
    }

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !password[index] && index > 0) {
            otpRefs.current[index - 1]?.focus()
        }
    }

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        e.preventDefault()
        const pasteData = e.clipboardData.getData('text').replace(/\D/g, '') // Only keep digits
        if (pasteData.length > 0) {
            const digits = pasteData.slice(0, 8).split('')
            const newPassword = digits.join('')
            setPassword(newPassword)

            // Focus the next empty input or the last input
            const nextIndex = Math.min(digits.length, 7)
            otpRefs.current[nextIndex]?.focus()
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password.length !== 8) {
            setError('A senha deve ter 8 dígitos')
            return
        }
        setLoading(true)
        setError('')

        try {
            const response = await fetch('/api/early-access/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            })

            if (response.ok) {
                router.push('/')
            } else {
                const data = await response.json()
                setError(data.error || 'Credenciais inválidas')
            }
        } catch (err) {
            setError('Erro ao verificar credenciais')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                <div className="text-center mb-8">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Acesso Antecipado!</h1>
                    <p className="text-gray-600">Digite seu email e a senha de 8 dígitos</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Senha de Acesso (8 dígitos)
                        </label>
                        <div className="flex gap-2 justify-center">
                            {Array.from({ length: 8 }, (_, index) => (
                                <input
                                    key={index}
                                    ref={(el) => { otpRefs.current[index] = el }}
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]"
                                    maxLength={1}
                                    className="w-10 h-10 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                                    value={password[index] || ''}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                    onPaste={index === 0 ? handleOtpPaste : undefined}
                                />
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || password.length !== 8}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Verificando...
                            </div>
                        ) : (
                            'Acessar'
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-500">
                        Acesso exclusivo para usuários selecionados
                    </p>
                </div>
            </div>
        </div>
    )
}
