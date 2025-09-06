import { Link, useSearchParams } from 'react-router-dom'

export default function AuthError() {
    const [searchParams] = useSearchParams()
    const error = searchParams.get('error')

    const getErrorMessage = (error: string | null) => {
        switch (error) {
            case 'token-missing':
                return {
                    title: 'Link Inválido',
                    message: 'O link de acesso não contém um token válido.',
                    suggestion: 'Solicite um novo link de acesso.'
                }
            case 'invalid-token':
                return {
                    title: 'Token Expirado ou Inválido',
                    message: 'O link de acesso expirou ou não é válido.',
                    suggestion: 'Solicite um novo link de acesso.'
                }
            default:
                return {
                    title: 'Erro de Autenticação',
                    message: 'Ocorreu um erro durante o processo de autenticação.',
                    suggestion: 'Tente novamente ou entre em contato com o suporte.'
                }
        }
    }

    const errorInfo = getErrorMessage(error)

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </div>

                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {errorInfo.title}
                </h2>

                <p className="text-gray-600 mb-4">
                    {errorInfo.message}
                </p>

                <p className="text-sm text-gray-500 mb-6">
                    {errorInfo.suggestion}
                </p>

                <Link
                    to="/"
                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                >
                    Voltar ao Início
                </Link>
            </div>
        </div>
    )
}