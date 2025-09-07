import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Header from '../components/Header'
import ReviewCard from '../components/ReviewCard'
import api from '../services/api'
import type { Professor, Review } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { StarRating } from '../components/ui/star-rating'
import { ThumbToggle } from '../components/ui/thumb-toggle'
import { InformationCircleIcon } from '@heroicons/react/24/outline'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion'
import { StaticStars } from '../components/ui/static-stars'

export default function Professor() {
  const { id } = useParams<{ id: string }>()
  const [professor, setProfessor] = useState<Professor | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const { isAuthenticated, user } = useAuth()
  const [hasReviewed, setHasReviewed] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    subject_name: '',
    review: '',
    didatic_quality: 1,
    material_quality: 1,
    exams_difficulty: 1,
    personality: 1,
    approved: false,
    requires_presence: false,
    exam_method: '',
    anonymous: true,
    recommended: null as boolean | null
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    }))
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.subject_name.trim()) errors.subject_name = 'Selecione uma disciplina'
    if (!formData.review.trim()) errors.review = 'Avaliação é obrigatória'
    if (formData.didatic_quality < 1 || formData.didatic_quality > 5) errors.didatic_quality = 'Deve ser entre 1 e 5'
    if (formData.material_quality < 1 || formData.material_quality > 5) errors.material_quality = 'Deve ser entre 1 e 5'
    if (formData.exams_difficulty < 1 || formData.exams_difficulty > 5) errors.exams_difficulty = 'Deve ser entre 1 e 5'
    if (formData.personality < 1 || formData.personality > 5) errors.personality = 'Deve ser entre 1 e 5'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    if (!isAuthenticated) {
      alert('Você precisa estar logado para enviar uma avaliação')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/reviews', {
        ...formData,
        approved: formData.recommended,
        professor_id: parseInt(id!)
      })
      // Reload reviews
      const reviewsResponse = await api.get(`/professors/${parseInt(id!)}/reviews`)
      setReviews(reviewsResponse.data.data)
      setHasReviewed(true)
      // Reset form
      setFormData({
        subject_name: '',
        review: '',
        didatic_quality: 1,
        material_quality: 1,
        exams_difficulty: 1,
        personality: 1,
        approved: false,
        requires_presence: false,
        exam_method: '',
        anonymous: true,
        recommended: null
      })
      setFormErrors({})
    } catch (error: any) {
      console.error('Error submitting review:', error)
      const errorMessage = error.response?.data?.error || 'Erro ao enviar avaliação'
      alert(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (!id) return

    const loadData = async () => {
      setLoading(true)
      try {
        // Load professor info and reviews
        const [professorsResponse, reviewsResponse] = await Promise.all([
          api.get('/professors', { params: { q: '', page: 1, pageSize: 1000 } }), // Get all professors to find this one
          api.get(`/professors/${parseInt(id)}/reviews`)
        ])

        // Find the specific professor
        const foundProfessor = professorsResponse.data.data.find((p: Professor) => p.id === parseInt(id))
        setProfessor(foundProfessor || null)
        setReviews(reviewsResponse.data.data)
        console.log('User:', user)
        console.log('Reviews:', reviewsResponse.data.data)
        // Check if user has already reviewed
        if (user) {
          const userReview = reviewsResponse.data.data.find((r: Review) => r.user_id === user.id)
          console.log('User review found:', userReview)
          setHasReviewed(!!userReview)
        }
      } catch (error) {
        console.error('Error loading professor data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id, user])

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
                  <StaticStars value={Math.round(averageRatings.didatic)} className="justify-center" />
                  <div className="text-sm text-gray-600">Didática</div>
                </div>
                <div className="text-center">
                  <StaticStars value={Math.round(averageRatings.material)} className="justify-center" />
                  <div className="text-sm text-gray-600">Material</div>
                </div>
                <div className="text-center">
                  <StaticStars value={Math.round(averageRatings.exams)} className="justify-center" />
                  <div className="text-sm text-gray-600">Provas</div>
                </div>
                <div className="text-center">
                  <StaticStars value={Math.round(averageRatings.personality)} className="justify-center" />
                  <div className="text-sm text-gray-600">Postura</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Review Form */}
        {isAuthenticated && !hasReviewed && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="review-form">
              <AccordionTrigger>Adicionar Avaliação</AccordionTrigger>
              <AccordionContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Disciplina</label>
                    <select
                      name="subject_name"
                      value={formData.subject_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Selecione uma disciplina</option>
                      {professor?.subjects.map((subject) => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                    </select>
                    {formErrors.subject_name && <p className="text-red-500 text-sm mt-1">{formErrors.subject_name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Opinião
                      <InformationCircleIcon
                        className="inline w-4 h-4 ml-1 text-gray-500 cursor-help"
                        title="Compartilhe sua experiência e opinião sobre o professor nesta disciplina."
                      />
                    </label>
                    <textarea
                      name="review"
                      value={formData.review}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Escreva sua opinião..."
                    />
                    {formErrors.review && <p className="text-red-500 text-sm mt-1">{formErrors.review}</p>}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Didática
                        <InformationCircleIcon
                          className="inline w-4 h-4 ml-1 text-gray-500 cursor-help"
                          title="Capacidade de ensinar e explicar conceitos de forma clara e eficaz."
                        />
                      </label>
                      <StarRating value={formData.didatic_quality} onChange={(value) => setFormData(prev => ({ ...prev, didatic_quality: value }))} />
                      {formErrors.didatic_quality && <p className="text-red-500 text-sm mt-1">{formErrors.didatic_quality}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Material
                        <InformationCircleIcon
                          className="inline w-4 h-4 ml-1 text-gray-500 cursor-help"
                          title="Qualidade e utilidade do material didático fornecido."
                        />
                      </label>
                      <StarRating value={formData.material_quality} onChange={(value) => setFormData(prev => ({ ...prev, material_quality: value }))} />
                      {formErrors.material_quality && <p className="text-red-500 text-sm mt-1">{formErrors.material_quality}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Provas
                        <InformationCircleIcon
                          className="inline w-4 h-4 ml-1 text-gray-500 cursor-help"
                          title="Dificuldade e justiça das avaliações e provas aplicadas."
                        />
                      </label>
                      <StarRating value={formData.exams_difficulty} onChange={(value) => setFormData(prev => ({ ...prev, exams_difficulty: value }))} />
                      {formErrors.exams_difficulty && <p className="text-red-500 text-sm mt-1">{formErrors.exams_difficulty}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Postura
                        <InformationCircleIcon
                          className="inline w-4 h-4 ml-1 text-gray-500 cursor-help"
                          title="Atitude, respeito e comportamento do professor em sala de aula."
                        />
                      </label>
                      <StarRating value={formData.personality} onChange={(value) => setFormData(prev => ({ ...prev, personality: value }))} />
                      {formErrors.personality && <p className="text-red-500 text-sm mt-1">{formErrors.personality}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col items-center space-y-2">
                      <ThumbToggle
                        value={formData.recommended}
                        onChange={(value) => setFormData(prev => ({ ...prev, recommended: value }))}
                      />
                      <label className="text-sm font-medium text-gray-700 text-center">
                        Recomendado
                      </label>
                      <p className="text-xs text-gray-500 text-center">
                        Você recomenda esse professor?
                      </p>
                    </div>

                    <div className="flex flex-col items-center space-y-2">
                      <ThumbToggle
                        value={formData.requires_presence}
                        onChange={(value) => setFormData(prev => ({ ...prev, requires_presence: value }))}
                      />
                      <label className="text-sm font-medium text-gray-700 text-center">
                        Presença Obrigatória
                      </label>
                      <p className="text-xs text-gray-500 text-center">
                        A presença era obrigatória para aprovação?
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Método de Avaliação (opcional)</label>
                    <input
                      type="text"
                      name="exam_method"
                      value={formData.exam_method}
                      onChange={handleInputChange}
                      maxLength={50}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Ex: Prova final, Trabalhos..."
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="anonymous"
                      name="anonymous"
                      checked={formData.anonymous}
                      onChange={handleInputChange}
                      className="rounded"
                    />
                    <label htmlFor="anonymous" className="text-sm text-gray-700">
                      Anônimo
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium transition-colors"
                  >
                    {submitting ? 'Enviando...' : 'Enviar Avaliação'}
                  </button>
                </form>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {/* Reviews section */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Avaliações ({reviews.length})
            </h2>
          </div>

          {reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review) => {
                const isUser = user ? review.user_id === user.id : false
                console.log('Review user_id:', review.user_id, 'User id:', user?.id, 'isUser:', isUser)
                return <ReviewCard key={review.id} review={review} isUserReview={isUser} />
              })}
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
