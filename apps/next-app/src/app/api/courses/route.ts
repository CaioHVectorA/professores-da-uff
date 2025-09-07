import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
    try {
        const courses = await prisma.course.findMany({
            select: {
                id: true,
                name: true
            },
            orderBy: {
                name: 'asc'
            }
        })

        return NextResponse.json({
            data: courses
        })
    } catch (error) {
        console.error('Error fetching courses:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
