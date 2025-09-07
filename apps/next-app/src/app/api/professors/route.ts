import { NextRequest, NextResponse } from 'next/server'
import { getUserFromSession } from '@/lib/auth'

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
  try {
    const url = new URL(request.url, 'http://localhost:3000');
    const searchParams = url.searchParams;
    const q = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // Optional: Check if user is authenticated for personalized results
    const user = await getUserFromSession(request)

    // Filter by query
    let filtered = mockProfessors;
    if (q) {
      filtered = mockProfessors.filter(p => p.name.toLowerCase().includes(q.toLowerCase()));
    }

    // Paginate
    const offset = (page - 1) * pageSize;
    const paginated = filtered.slice(offset, offset + pageSize);

    return NextResponse.json({
      data: paginated,
      page,
      pageSize,
      total: filtered.length
    });
  } catch (error) {
    console.error('Error parsing URL:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
