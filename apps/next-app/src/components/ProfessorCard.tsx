import Link from 'next/link'
import type { Professor } from '../types'

interface ProfessorCardProps {
  professor: Professor
}

export default function ProfessorCard({ professor }: ProfessorCardProps) {
  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <span
        key={i}
        className={`w-4 h-4 ${i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        ★
      </span>
    ))
  }

  return (
    <Link
      href={`/professor/${professor.id}`}
      className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200 p-6"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{professor.name}</h3>
      <div className="space-y-2">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Disciplinas:</span>
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {Array.isArray(professor.subjects) && professor.subjects.length > 0 && (
            typeof professor.subjects[0] === 'string'
              ? (professor.subjects as string[]).slice(0, 3).map((subject, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                >
                  {subject}
                </span>
              ))
              : (professor.subjects as { id: number; name: string }[]).slice(0, 3).map((subject) => (
                <span
                  key={subject.id}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                >
                  {subject.name}
                </span>
              ))
          )}
          {Array.isArray(professor.subjects) && professor.subjects.length > 3 && (
            <span className="text-xs text-gray-500">+{professor.subjects.length - 3} mais</span>
          )}
        </div>

        {professor.averages && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Médias das avaliações:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-600">Didática:</span>
                <div className="flex items-center">
                  {renderStars(professor.averages.didatic)}
                  <span className="ml-1 text-gray-500">({professor.averages.didatic.toFixed(1)})</span>
                </div>
              </div>
              <div>
                <span className="text-gray-600">Material:</span>
                <div className="flex items-center">
                  {renderStars(professor.averages.material)}
                  <span className="ml-1 text-gray-500">({professor.averages.material.toFixed(1)})</span>
                </div>
              </div>
              <div>
                <span className="text-gray-600">Dificuldade:</span>
                <div className="flex items-center">
                  {renderStars(professor.averages.difficulty)}
                  <span className="ml-1 text-gray-500">({professor.averages.difficulty.toFixed(1)})</span>
                </div>
              </div>
              <div>
                <span className="text-gray-600">Personalidade:</span>
                <div className="flex items-center">
                  {renderStars(professor.averages.personality)}
                  <span className="ml-1 text-gray-500">({professor.averages.personality.toFixed(1)})</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500">{professor.reviewCount} avaliações</p>
          </div>
        )}
      </div>
    </Link>
  )
}
