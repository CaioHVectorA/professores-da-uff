import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Header from '../components/Header'
import ReviewCard from '../components/ReviewCard'
import { professorApi } from '../services/api'
import type { Professor, Review } from '../types'

export default function Professor() {
  const { id } = useParams<{ id: string }>()
  const [professor, setProfessor] = useState<Professor | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewsLoading, setReviewsLoading] = useState(false)

  useEffect(() => {
    if (!id) return

    const loadData = async () => {
      setLoading(true)
      try {
        // Load professor info and reviews
        const [professorsResponse, reviewsResponse] = await Promise.all([
          professorApi.getProfessors('', 1, 1000), // Get all professors to find this one
          professorApi.getProfessorReviews(parseInt(id))
        ])

        // Find the specific professor
        const foundProfessor = professorsResponse.data.find(p => p.id === parseInt(id))
        setProfessor(foundProfessor || null)
        setReviews(reviewsResponse.data)
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
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-6 shadow-sm border">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="h-20 bg-gray-200 rounded mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
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
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Professor não encontrado
            </h3>
            <p className="text-gray-500 mb-4">
              O professor que você está procurando não existe ou foi removido.
            </p>
            <Link
              to="/"
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              Voltar para início
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const averageRatings = reviews.length > 0 ? {
    didatic: reviews.reduce((sum, r) => sum + r.didatic_quality, 0) / reviews.length,
    material: reviews.reduce((sum, r) => sum + r.material_quality, 0) / reviews.length,
    exams: reviews.reduce((sum, r) => sum + r.exams_difficulty, 0) / reviews.length,
    personality: reviews.reduce((sum, r) => sum + r.personality, 0) / reviews.length,
  } : null

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center text-primary-600 hover:text-primary-500 font-medium"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar para professores
          </Link>
        </div>

        {/* Professor info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{professor.name}</h1>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Disciplinas</h3>
            <div className="flex flex-wrap gap-2">
              {professor.subjects.map((subject, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-50 text-primary-700"
                >
                  {subject}
                </span>
              ))}
            </div>
          </div>

          {averageRatings && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Avaliações Médias</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">
                    {averageRatings.didatic.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Didática</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">
                    {averageRatings.material.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Material</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">
                    {averageRatings.exams.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Provas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">
                    {averageRatings.personality.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Postura</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Reviews section */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Avaliações ({reviews.length})
            </h2>
          </div>

          {reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1.586l-4 4z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma avaliação ainda
              </h3>
              <p className="text-gray-500">
                Este professor ainda não possui avaliações.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
