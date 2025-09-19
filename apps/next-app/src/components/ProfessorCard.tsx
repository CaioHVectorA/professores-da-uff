import Link from 'next/link'
import type { Professor } from '../types'
import { formatSemester } from '../lib/utils'

interface ProfessorCardProps {
  professor: Professor
}

export default function ProfessorCard({ professor }: ProfessorCardProps) {
  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <span
        key={i}
        className={`text-2xl ${i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        ★
      </span>
    ))
  }

  // Group subjects by name and collect semesters
  const subjectGroups = Array.isArray(professor.subjects) && typeof professor.subjects[0] === 'object'
    ? (professor.subjects as { id: number; name: string; semester?: string }[]).reduce((acc, subj) => {
        if (!acc[subj.name]) {
          acc[subj.name] = { semesters: [] }
        }
        if (subj.semester && !acc[subj.name].semesters.includes(subj.semester)) {
          acc[subj.name].semesters.push(subj.semester)
        }
        return acc
      }, {} as Record<string, { semesters: string[] }>)
    : {}

  // Get unique subjects with semester info
  const uniqueSubjects = Object.keys(subjectGroups).map(name => ({
    name,
    semesters: subjectGroups[name].semesters.sort()
  }))

  // Check if total semesters across all subjects is more than 3
  const totalSemesters = uniqueSubjects.reduce((sum, subj) => sum + subj.semesters.length, 0)
  const showSemesters = totalSemesters <= 3

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
          {uniqueSubjects.slice(0, 3).map((subject, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
            >
              {subject.name}
              {showSemesters && subject.semesters.length > 0 && (
                <span className="text-[10px] ml-1">
                  ({subject.semesters.map(s => formatSemester(s)).join('/')})
                </span>
              )}
            </span>
          ))}
          {uniqueSubjects.length > 3 && (
            <span className="text-xs text-gray-500">+{uniqueSubjects.length - 3} mais</span>
          )}
        </div>

        {professor.averages && professor.reviewCount && professor.reviewCount > 0 ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-gray-600 mb-1">Didática</p>
                <div className="flex items-center">
                  {renderStars(professor.averages.didatic)}
                </div>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Material</p>
                <div className="flex items-center">
                  {renderStars(professor.averages.material)}
                </div>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Dificuldade</p>
                <div className="flex items-center">
                  {renderStars(professor.averages.difficulty)}
                </div>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Personalidade</p>
                <div className="flex items-center">
                  {renderStars(professor.averages.personality)}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Não tem avaliações</p>
        )}
      </div>
    </Link>
  )
}
