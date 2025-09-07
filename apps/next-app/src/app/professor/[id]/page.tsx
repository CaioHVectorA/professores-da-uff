'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Header from '../../../components/Header'
import type { Professor, Review } from '../../../types'

export default function ProfessorPage() {
  const params = useParams()
  const id = params.id as string
  const [professor, setProfessor] = useState<Professor | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    const loadData = async () => {
      setLoading(true)
      try {
        // Load professor info and reviews
        const [professorsResponse, reviewsResponse] = await Promise.all([
          fetch('/api/professors?q=&page=1&pageSize=1000'),
          fetch(`/api/professors/${id}/reviews`)
        ])

        if (professorsResponse.ok && reviewsResponse.ok) {
          const professorsData = await professorsResponse.json()
          const reviewsData = await reviewsResponse.json()

          // Find the specific professor
          const foundProfessor = professorsData.data.find((p: Professor) => p.id === parseInt(id))
          setProfessor(foundProfessor || null)
          setReviews(reviewsData.data)
        }
      } catch (error) {
        console.error('Error loading professor data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
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
      <div className="min-h-screen bg-gray-50">
        <Header />
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
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{professor.name}</h2>
          <div className="flex flex-wrap gap-2">
            {professor.subjects.map((subject, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700"
              >
                {subject}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Avaliações</h3>

          {reviews.length === 0 ? (
            <p className="text-gray-600">Nenhuma avaliação ainda.</p>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <p className="text-gray-900 mb-2">{review.review}</p>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Disciplina:</span> {review.subject_name}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Didática:</span>
                      <div className="flex items-center mt-1">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`w-4 h-4 ${i < (review.didatic_quality || 0)
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                              }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Material:</span>
                      <div className="flex items-center mt-1">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`w-4 h-4 ${i < (review.material_quality || 0)
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                              }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Dificuldade:</span>
                      <div className="flex items-center mt-1">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`w-4 h-4 ${i < (review.exams_difficulty || 0)
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                              }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Personalidade:</span>
                      <div className="flex items-center mt-1">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`w-4 h-4 ${i < (review.personality || 0)
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

                  <div className="mt-4 text-xs text-gray-500">
                    {new Date(review.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
