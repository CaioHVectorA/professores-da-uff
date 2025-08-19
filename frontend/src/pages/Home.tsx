import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Header from '../components/Header'
import ProfessorCard from '../components/ProfessorCard'
import { professorApi } from '../services/api'
import type { Professor } from '../types'

export default function Home() {
    const [professors, setProfessors] = useState<Professor[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const [searchParams, setSearchParams] = useSearchParams()
    const error = searchParams.get('error')
    const login = searchParams.get('login')

    const loadProfessors = async (query: string = '', pageNum: number = 1) => {
        setLoading(true)
        try {
            const response = await professorApi.getProfessors(query, pageNum, 20)
            if (pageNum === 1) {
                setProfessors(response.data)
            } else {
                setProfessors(prev => [...prev, ...response.data])
            }
            setTotal(response.total || 0)
            setHasMore(response.data.length === 20)
        } catch (error) {
            console.error('Error loading professors:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadProfessors(searchQuery, 1)
        setPage(1)
    }, [searchQuery])

    useEffect(() => {
        if (error) {
            let message = ''
            switch (error) {
                case 'token-missing':
                    message = 'Link inválido. Tente fazer login novamente.'
                    break
                case 'invalid-token':
                    message = 'Link expirado ou inválido. Tente fazer login novamente.'
                    break
                default:
                    message = 'Erro no login. Tente novamente.'
            }
            alert(message)
            setSearchParams({})
        } else if (login === 'success') {
            alert('Login realizado com sucesso!')
            setSearchParams({})
        }
    }, [error, login, setSearchParams])

    const handleLoadMore = () => {
        const nextPage = page + 1
        setPage(nextPage)
        loadProfessors(searchQuery, nextPage)
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header
                title="QuadroScrap - Avaliação de Professores UFF"
                showSearch
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        Professores da UFF
                    </h2>
                    <p className="text-gray-600">
                        Encontre e avalie professores da Universidade Federal Fluminense
                    </p>
                    {searchQuery && (
                        <p className="text-sm text-gray-500 mt-2">
                            {total} resultado{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''} para "{searchQuery}"
                        </p>
                    )}
                </div>

                {loading && professors.length === 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                                <div className="bg-white rounded-lg p-6 shadow-sm border">
                                    <div className="h-6 bg-gray-200 rounded mb-4"></div>
                                    <div className="space-y-2">
                                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                        <div className="flex space-x-2">
                                            <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                                            <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : professors.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {professors.map((professor) => (
                                <ProfessorCard key={professor.id} professor={professor} />
                            ))}
                        </div>

                        {hasMore && (
                            <div className="mt-8 text-center">
                                <button
                                    onClick={handleLoadMore}
                                    disabled={loading}
                                    className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-6 py-3 rounded-md font-medium transition-colors"
                                >
                                    {loading ? 'Carregando...' : 'Carregar mais'}
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-12">
                        <div className="text-gray-400 mb-4">
                            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {searchQuery ? 'Nenhum professor encontrado' : 'Nenhum professor cadastrado'}
                        </h3>
                        <p className="text-gray-500">
                            {searchQuery
                                ? 'Tente buscar com outros termos.'
                                : 'Ainda não há professores cadastrados no sistema.'
                            }
                        </p>
                    </div>
                )}
            </main>
        </div>
    )
}
