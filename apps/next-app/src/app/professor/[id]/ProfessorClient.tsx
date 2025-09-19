'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import ReviewForm from '@/components/ReviewForm'
import type { Professor, Review } from '@/types'
import { formatSemester } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'

interface ProfessorClientProps {
    initialProfessor: Professor
    initialReviews: Review[]
    professorId: string
}

export default function ProfessorClient({
    initialProfessor,
    initialReviews,
    professorId
}: ProfessorClientProps) {
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
    const { user } = useAuth()

    // Use React Query for reviews with initial data
    const { data: reviews = initialReviews } = useQuery({
        queryKey: ['professor-reviews', professorId],
        queryFn: async () => {
            const response = await fetch(`/api/professors/${professorId}/reviews`)
            if (!response.ok) throw new Error('Failed to fetch reviews')
            const data = await response.json()
            return data.data
        },
        initialData: initialReviews,
        staleTime: 1000 * 60 * 10, // 10 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
    })

    // Check if user has reviewed
    const hasUserReviewed = user ? reviews.some((r: Review) => r.user_id === user.id) : false

    const handleReviewCreated = () => {
        setIsReviewModalOpen(false)
        // React Query will automatically refetch due to invalidation
        // Also revalidate the page data
        window.location.reload()
    }

    return (
        <div className="bg-gray-50 flex-1">
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                            <a
                                href="/"
                                className="text-blue-600 hover:text-blue-800 font-medium text-sm sm:text-base"
                            >
                                ← Voltar para Home
                            </a>
                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">{initialProfessor.name}</h2>
                        </div>
                        {!hasUserReviewed && (
                            <button
                                onClick={() => setIsReviewModalOpen(true)}
                                className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm sm:text-base whitespace-nowrap w-full sm:w-auto"
                            >
                                {reviews.length === 0 ? 'Seja o primeiro a avaliar!' : 'FAÇA SUA AVALIAÇÃO'}
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {Array.isArray(initialProfessor.subjects) && initialProfessor.subjects.length > 0 && (
                            typeof initialProfessor.subjects[0] === 'string'
                                ? (initialProfessor.subjects as string[]).map((subject, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700"
                                    >
                                        {subject}
                                    </span>
                                ))
                                : (initialProfessor.subjects as { id: number; name: string; semester?: string }[]).map((subject) => (
                                    <span
                                        key={subject.id}
                                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700"
                                    >
                                        {subject.name}{subject.semester ? <span className="text-[10px] ml-1"> ({formatSemester(subject.semester)})</span> : ''}
                                    </span>
                                ))
                        )}
                    </div>
                    <div className="mb-4">
                        <span className="text-lg font-semibold text-gray-900">Total de Avaliações: {reviews.length}</span>
                    </div>
                    {reviews.length > 0 && initialProfessor.averages && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-sm font-medium text-gray-700 mb-2">Didática</div>
                                <div className="flex justify-center mb-1">
                                    {[...Array(5)].map((_, i) => (
                                        <span
                                            key={i}
                                            className={`w-6 h-6 ${i < Math.round(initialProfessor.averages?.didatic || 0)
                                                ? 'text-yellow-400'
                                                : 'text-gray-300'
                                                }`}
                                        >
                                            ★
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-sm font-medium text-gray-700 mb-2">Material</div>
                                <div className="flex justify-center mb-1">
                                    {[...Array(5)].map((_, i) => (
                                        <span
                                            key={i}
                                            className={`w-6 h-6 ${i < Math.round(initialProfessor.averages?.material || 0)
                                                ? 'text-yellow-400'
                                                : 'text-gray-300'
                                                }`}
                                        >
                                            ★
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-sm font-medium text-gray-700 mb-2">Dificuldade</div>
                                <div className="flex justify-center mb-1">
                                    {[...Array(5)].map((_, i) => (
                                        <span
                                            key={i}
                                            className={`w-6 h-6 ${i < Math.round(initialProfessor.averages?.difficulty || 0)
                                                ? 'text-yellow-400'
                                                : 'text-gray-300'
                                                }`}
                                        >
                                            ★
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-sm font-medium text-gray-700 mb-2">Personalidade</div>
                                <div className="flex justify-center mb-1">
                                    {[...Array(5)].map((_, i) => (
                                        <span
                                            key={i}
                                            className={`w-6 h-6 ${i < Math.round(initialProfessor.averages?.personality || 0)
                                                ? 'text-yellow-400'
                                                : 'text-gray-300'
                                                }`}
                                        >
                                            ★
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Avaliações ({reviews.length})</h3>

                    {reviews.length === 0 ? (
                        <p className="text-gray-600">Ainda não há avaliações para este professor.</p>
                    ) : (
                        <div className="space-y-6">
                            {reviews.map((review: Review) => (
                                <div key={review.id} className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0">
                                    <div className="mb-4">
                                        <p className="text-gray-900 mb-3 leading-relaxed">{review.review}</p>
                                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                            <span><strong>Disciplina:</strong> {review.subject_name} <span className="text-[10px]">({formatSemester(review.semester)})</span></span>
                                            <span><strong>Por:</strong> {review.user_id === user?.id ? 'Você' : review.anonymous ? 'Anônimo' : (review.user_name || 'Usuário')}</span>
                                            <span className="text-gray-500">{new Date(review.created_at).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="text-center">
                                            <div className="text-xs font-medium text-gray-700 mb-1">Didática</div>
                                            <div className="flex justify-center">
                                                {[...Array(5)].map((_, i) => (
                                                    <span
                                                        key={i}
                                                        className={`w-6 h-6 ${i < (review.didatic_quality || 0)
                                                            ? 'text-yellow-400'
                                                            : 'text-gray-300'
                                                            }`}
                                                    >
                                                        ★
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xs font-medium text-gray-700 mb-1">Material</div>
                                            <div className="flex justify-center">
                                                {[...Array(5)].map((_, i) => (
                                                    <span
                                                        key={i}
                                                        className={`w-6 h-6 ${i < (review.material_quality || 0)
                                                            ? 'text-yellow-400'
                                                            : 'text-gray-300'
                                                            }`}
                                                    >
                                                        ★
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xs font-medium text-gray-700 mb-1">Dificuldade</div>
                                            <div className="flex justify-center">
                                                {[...Array(5)].map((_, i) => (
                                                    <span
                                                        key={i}
                                                        className={`w-6 h-6 ${i < (review.exams_difficulty || 0)
                                                            ? 'text-yellow-400'
                                                            : 'text-gray-300'
                                                            }`}
                                                    >
                                                        ★
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xs font-medium text-gray-700 mb-1">Personalidade</div>
                                            <div className="flex justify-center">
                                                {[...Array(5)].map((_, i) => (
                                                    <span
                                                        key={i}
                                                        className={`w-6 h-6 ${i < (review.personality || 0)
                                                            ? 'text-yellow-400'
                                                            : 'text-gray-300'
                                                            }`}
                                                    >
                                                        ★
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {hasUserReviewed && user && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                        <p className="text-blue-800 text-sm">Você já avaliou este professor.</p>
                    </div>
                )}

                {/* Review Modal */}
                {isReviewModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
                        <div className="bg-white rounded-lg w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
                            <div className="p-4 sm:p-6">
                                <div className="flex justify-between items-center mb-4 sm:mb-6">
                                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Criar Avaliação</h2>
                                    <button
                                        onClick={() => setIsReviewModalOpen(false)}
                                        className="text-gray-400 hover:text-gray-600 text-xl sm:text-2xl leading-none"
                                    >
                                        ×
                                    </button>
                                </div>
                                <ReviewForm
                                    professorId={parseInt(professorId)}
                                    subjects={initialProfessor.subjects as { id: number; name: string; semester: string }[]}
                                    onReviewCreated={handleReviewCreated}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
