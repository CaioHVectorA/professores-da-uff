import Header from '../../../components/Header'
import ReviewCard from '../../../components/ReviewCard'
import type { Review } from '../../../types'

// Mock data
const mockReviews: Review[] = [
  {
    id: 1,
    review: "Excelente professor, explica muito bem os conceitos.",
    created_at: "2023-10-01T00:00:00Z",
    didatic_quality: 5,
    material_quality: 4,
    exams_difficulty: 3,
    personality: 5,
    requires_presence: false,
    exam_method: "Prova escrita",
    anonymous: false,
    subject_name: "Matemática"
  },
  // Add more mock reviews
]

export default function ProfessorPage({ params }: { params: { id: string } }) {
  const professorId = parseInt(params.id)
  // In real app, fetch professor data

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Professor {professorId}</h1>
          <p className="mt-2 text-gray-600">Avaliações e informações</p>
        </div>
        <div className="space-y-6">
          {mockReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </main>
    </div>
  )
}
