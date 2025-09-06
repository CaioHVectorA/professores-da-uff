import { useState, useEffect, useRef, useCallback } from 'react'
import Header from '../components/Header'
import ProfessorCard from '../components/ProfessorCard'
import api from '../services/api'
import type { Professor } from '../types'

export default function Home() {
  const [professors, setProfessors] = useState<Professor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const loadProfessors = useCallback(async (query: string = '', pageNum: number = 1, append: boolean = false) => {
    if (!append) setLoading(true)
    try {
      const response = await api.get('/professors', {
        params: { q: query, page: pageNum, pageSize: 20 }
      })
      if (append) {
        setProfessors(prev => [...prev, ...response.data.data])
      } else {
        setProfessors(response.data.data)
      }
      setTotal(response.data.total || 0)
      setHasMore(response.data.data.length === 20)
    } catch (error) {
      console.error('Error loading professors:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProfessors(searchQuery, 1, false)
    setPage(1)
  }, [searchQuery, loadProfessors])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const nextPage = page + 1
          setPage(nextPage)
          loadProfessors(searchQuery, nextPage, true)
        }
      },
      { threshold: 1.0 }
    )

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, loading, page, searchQuery, loadProfessors])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="QuadroScrap - Avaliação de Professores UFF"
        showSearch
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Professores da UFF
          </h2>
          <p className="text-gray-600">
            Encontre e avalie professores da Universidade Federal Fluminense
          </p>
          {searchQuery && (
            <p className="text-sm text-gray-500 mt-2">
              {total} resultado{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''} para "{searchQuery}"
            </p>
          )}
        </div>

        {loading && professors.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-white rounded-lg p-6 shadow-sm border">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="flex space-x-2">
                      <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                      <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : professors.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {professors.map((professor) => (
                <ProfessorCard key={professor.id} professor={professor} />
              ))}
            </div>

            {hasMore && (
              <div ref={sentinelRef} className="mt-8 text-center">
                {loading && <p className="text-gray-500">Carregando mais professores...</p>}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'Nenhum professor encontrado' : 'Nenhum professor cadastrado'}
            </h3>
            <p className="text-gray-500">
              {searchQuery
                ? 'Tente buscar com outros termos.'
                : 'Ainda não há professores cadastrados no sistema.'
              }
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
