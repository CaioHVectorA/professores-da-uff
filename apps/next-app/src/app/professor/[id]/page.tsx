import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import ProfessorClient from './ProfessorClient'
import type { Professor, Review } from '@/types'

async function getProfessorData(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000')
  
  // Ensure we have a proper base URL for server-side requests
  const apiBaseUrl = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
  
  try {
    const [professorResponse, reviewsResponse, subjectsResponse] = await Promise.all([
      fetch(`${apiBaseUrl}/api/professors?id=${id}`, {
        cache: 'no-store' // or 'force-cache' for static
      }),
      fetch(`${apiBaseUrl}/api/professors/${id}/reviews`, {
        cache: 'no-store'
      }),
      fetch(`${apiBaseUrl}/api/professors/${id}/subjects`, {
        cache: 'no-store'
      })
    ])

    if (!professorResponse.ok) {
      return null
    }

    const professorData = await professorResponse.json()
    const reviewsData = reviewsResponse.ok ? await reviewsResponse.json() : { data: [] }
    const subjectsData = subjectsResponse.ok ? await subjectsResponse.json() : { data: [] }

    const professor = professorData.data && professorData.data.length > 0
      ? { ...professorData.data[0], subjects: subjectsData.data }
      : null

    return {
      professor,
      reviews: reviewsData.data || []
    }
  } catch (error) {
    console.error('Error fetching professor data:', error)
    return null
  }
}

export default async function ProfessorPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getProfessorData(id)

  if (!data || !data.professor) {
    notFound()
  }

  return (
    <Suspense fallback={<div>Loading professor...</div>}>
      <ProfessorClient
        initialProfessor={data.professor}
        initialReviews={data.reviews}
        professorId={id}
      />
    </Suspense>
  )
}
