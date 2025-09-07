'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import ReviewForm from '@/components/ReviewForm'
import type { Professor, Review } from '@/types'

export default function ProfessorPage() {
  const params = useParams()
  const id = params.id as string
  const [professor, setProfessor] = useState<Professor | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [hasUserReviewed, setHasUserReviewed] = useState(false)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (!id) return

    const loadData = async () => {
      setLoading(true)
      try {
        // Load professor info and reviews
        const [professorResponse, reviewsResponse] = await Promise.all([
          fetch(`/api/professors?id=${id}`),
          fetch(`/api/professors/${id}/reviews`)
        ])

        if (professorResponse.ok && reviewsResponse.ok) {
          const professorData = await professorResponse.json()
          const reviewsData = await reviewsResponse.json()

          // Load subjects for this professor
          const subjectsResponse = await fetch(`/api/professors/${id}/subjects`)
          let subjects = []
          if (subjectsResponse.ok) {
            const subjectsData = await subjectsResponse.json()
            subjects = subjectsData.data
          }

          setProfessor(professorData.data && professorData.data.length > 0 ? { ...professorData.data[0], subjects } : null)
          setReviews(reviewsData.data)

          // Check if user has already reviewed
          setHasUserReviewed(user ? reviewsData.data.some((r: Review) => r.user_id === user.id) : false)
        }
      } catch (error) {
        console.error('Error loading professor data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id, user?.id])

  if (loading) {
    return (
      <div className="bg-gray-50 flex-1">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="h-20 bg-gray-200 rounded mb-4"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!professor) {
    return (
      <div className="bg-gray-50 flex-1">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Professor não encontrado</h2>
            <p className="text-gray-600">O professor que você está procurando não existe.</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 flex-1">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-3xl font-bold text-gray-900">{professor.name}</h2>
                {!hasUserReviewed && (
                  <button
                    onClick={() => setIsReviewModalOpen(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap"
                  >
                    {reviews.length === 0 ? 'Seja o primeiro a avaliar!' : 'FAÇA SUA AVALIAÇÃO'}
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {Array.isArray(professor.subjects) && professor.subjects.length > 0 && (
                  typeof professor.subjects[0] === 'string'
                    ? (professor.subjects as string[]).map((subject, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700"
                      >
                        {subject}
                      </span>
                    ))
                    : (professor.subjects as { id: number; name: string }[]).map((subject) => (
                      <span
                        key={subject.id}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700"
                      >
                        {subject.name}
                      </span>
                    ))
                )}
              </div>
              <div className="mb-4">
                <span className="text-lg font-semibold text-gray-900">Total de Avaliações: {reviews.length}</span>
              </div>
              {reviews.length > 0 && professor.averages && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-700 mb-2">Didática</div>
                    <div className="flex justify-center mb-1">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`w-6 h-6 ${i < Math.round(professor.averages?.didatic || 0)
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
                          className={`w-6 h-6 ${i < Math.round(professor.averages?.material || 0)
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
                          className={`w-6 h-6 ${i < Math.round(professor.averages?.difficulty || 0)
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
                          className={`w-6 h-6 ${i < Math.round(professor.averages?.personality || 0)
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
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Avaliações ({reviews.length})</h3>

          {reviews.length === 0 ? (
            <p className="text-gray-600">Ainda não há avaliações para este professor.</p>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0">
                  <div className="mb-4">
                    <p className="text-gray-900 mb-3 leading-relaxed">{review.review}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span><strong>Disciplina:</strong> {review.subject_name}</span>
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Criar Avaliação</h2>
                  <button
                    onClick={() => setIsReviewModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                  >
                    ×
                  </button>
                </div>
                <ReviewForm
                  professorId={professor.id}
                  subjects={professor.subjects as { id: number; name: string }[]}
                  onReviewCreated={() => {
                    setIsReviewModalOpen(false)
                    window.location.reload()
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
