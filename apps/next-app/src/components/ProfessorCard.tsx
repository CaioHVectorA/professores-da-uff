import Link from 'next/link'
import type { Professor } from '../types'

interface ProfessorCardProps {
  professor: Professor
}

export default function ProfessorCard({ professor }: ProfessorCardProps) {
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
        <div className="flex flex-wrap gap-2">
          {professor.subjects.map((subject, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700"
            >
              {subject}
            </span>
          ))}
        </div>
      </div>
    </Link>
  )
}
