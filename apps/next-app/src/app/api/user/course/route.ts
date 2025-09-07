import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getUserFromSession } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromSession(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userWithCourse = await prisma.user.findUnique({
            where: { id: user.id },
            include: { course: true }
        })

        return NextResponse.json({ data: userWithCourse })
    } catch (error) {
        console.error('Error fetching user course:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const user = await getUserFromSession(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { courseId } = await request.json()

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { courseId }
        })

        return NextResponse.json({ data: updatedUser })
    } catch (error) {
        console.error('Error updating user course:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
