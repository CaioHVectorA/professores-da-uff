import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const professorId = parseInt(id)

        const professor = await prisma.professor.findUnique({
            where: { id: professorId },
            include: {
                professorSubjects: {
                    include: {
                        subject: true,
                        reviews: {
                            select: {
                                didaticQuality: true,
                                materialQuality: true,
                                examsDifficulty: true,
                                personality: true
                            }
                        }
                    }
                }
            }
        })

        if (!professor) {
            return NextResponse.json({ error: 'Professor not found' }, { status: 404 })
        }

        // Transform data to match the expected format
        const allReviews = professor.professorSubjects.flatMap(ps => ps.reviews);
        const averages = {
            didatic: allReviews.length > 0 ? allReviews.reduce((sum, r) => sum + (r.didaticQuality || 0), 0) / allReviews.length : 0,
            material: allReviews.length > 0 ? allReviews.reduce((sum, r) => sum + (r.materialQuality || 0), 0) / allReviews.length : 0,
            difficulty: allReviews.length > 0 ? allReviews.reduce((sum, r) => sum + (r.examsDifficulty || 0), 0) / allReviews.length : 0,
            personality: allReviews.length > 0 ? allReviews.reduce((sum, r) => sum + (r.personality || 0), 0) / allReviews.length : 0
        };

        const subjects = professor.professorSubjects.map(ps => ({ id: ps.subject.id, name: ps.subject.name }));

        const transformedProfessor = {
            id: professor.id,
            name: professor.name,
            subjects,
            reviewCount: allReviews.length,
            averages
        };

        return NextResponse.json({ data: transformedProfessor })
    } catch (error) {
        console.error('Error fetching professor:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
