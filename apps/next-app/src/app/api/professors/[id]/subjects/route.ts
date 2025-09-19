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

        const subjects = await prisma.professor_Subject.findMany({
            where: { professorId },
            include: {
                subject: true
            }
        })

        const transformedSubjects = subjects.map(ps => ({
            id: ps.subject.id,
            name: ps.subject.name,
            semester: ps.semester
        }))

        return NextResponse.json({
            data: transformedSubjects
        })
    } catch (error) {
        console.error('Error fetching subjects:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
