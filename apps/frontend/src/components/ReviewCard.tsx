import type { Review } from '../types'

interface ReviewCardProps {
  review: Review
  isUserReview?: boolean
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const StarRating = ({ rating, label }: { rating: number; label: string }) => {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-gray-700 w-20">{label}:</span>
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-2 text-sm text-gray-600">({rating}/5)</span>
      </div>
    </div>
  )
}

export default function ReviewCard({ review, isUserReview = false }: ReviewCardProps) {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm border p-6 ${
        isUserReview ? 'border-blue-500 border-2' : 'border-gray-200'
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="text-lg font-medium text-gray-900">{review.subject_name}</h4>
          <p className="text-sm text-gray-500">{formatDate(review.created_at)}</p>
        </div>
        {review.anonymous && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Anônimo
          </span>
        )}
      </div>

      <div className="mb-4">
        <p className="text-gray-700 leading-relaxed">{review.review}</p>
      </div>

      <div className="space-y-2 mb-4">
        <StarRating rating={review.didatic_quality} label="Didática" />
        <StarRating rating={review.material_quality} label="Material" />
        <StarRating rating={review.exams_difficulty} label="Provas" />
        <StarRating rating={review.personality} label="Postura" />
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
        <div className="flex items-center">
          <span className="font-medium">Presença:</span>
          <span className={`ml-1 ${review.requires_presence ? 'text-red-600' : 'text-green-600'}`}>
            {review.requires_presence ? 'Obrigatória' : 'Não obrigatória'}
          </span>
        </div>
        {review.exam_method && (
          <div className="flex items-center">
            <span className="font-medium">Método de avaliação:</span>
            <span className="ml-1">{review.exam_method}</span>
          </div>
        )}
      </div>
    </div>
  )
}
