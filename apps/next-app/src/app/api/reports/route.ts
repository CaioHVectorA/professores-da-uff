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

        const reports = await prisma.report.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 1 // Get the latest report
        })

        return NextResponse.json({ data: reports[0] || null }, { status: 200 })
    } catch (error) {
        console.error('Error fetching reports:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromSession(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { experience, suggestion } = await request.json()

        const report = await prisma.report.create({
            data: {
                userId: user.id,
                experience,
                suggestion
            }
        })

        return NextResponse.json({ data: report }, { status: 201 })
    } catch (error) {
        console.error('Error creating report:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
