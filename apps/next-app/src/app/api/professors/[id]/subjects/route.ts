import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const professorId = parseInt(params.id)

        const subjects = await prisma.subject.findMany({
            where: { professorId },
            select: {
                id: true,
                name: true
            }
        })

        return NextResponse.json({
            data: subjects
        })
    } catch (error) {
        console.error('Error fetching subjects:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
