import { NextRequest, NextResponse } from 'next/server'

// Mock data
const mockProfessors = [
  {
    id: 1,
    name: "Prof. João Silva",
    subjects: ["Matemática", "Cálculo"]
  },
  {
    id: 2,
    name: "Prof. Maria Santos",
    subjects: ["Física", "Mecânica"]
  },
  // Add more
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')

  // Filter by query
  let filtered = mockProfessors
  if (q) {
    filtered = mockProfessors.filter(p => p.name.toLowerCase().includes(q.toLowerCase()))
  }

  // Paginate
  const offset = (page - 1) * pageSize
  const paginated = filtered.slice(offset, offset + pageSize)

  return NextResponse.json({
    data: paginated,
    page,
    pageSize,
    total: filtered.length
  })
}
