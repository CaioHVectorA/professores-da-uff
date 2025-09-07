import { NextRequest, NextResponse } from 'next/server'

// Mock data
const mockReviews = [
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
  // Add more
]

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const professorId = parseInt(params.id)

  // In real app, filter by professorId
  const reviews = mockReviews

  return NextResponse.json({
    data: reviews,
    professor_id: professorId,
    total: reviews.length
  })
}
