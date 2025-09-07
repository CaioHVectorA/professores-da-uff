import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'
import { cookies } from 'next/headers'

const prisma = new PrismaClient()

async function getUserFromSession(request: NextRequest) {
    try {
        const cookieStore = await cookies()
        const sessionToken = cookieStore.get('session-token')?.value

        if (!sessionToken) {
            return null
        }

        const sessionTokenHash = createHash('sha256').update(sessionToken).digest('hex')

        const session = await prisma.session.findUnique({
            where: { sessionTokenHash },
            include: { user: true }
        })

        if (!session || session.expiresAt < new Date() || session.revokedAt) {
            return null
        }

        return session.user
    } catch (error) {
        console.error('Session validation error:', error)
        return null
    }
}

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromSession(request)

        if (!user) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
        }

        return NextResponse.json({
            id: user.id,
            email: user.email,
            verifiedAt: user.verifiedAt?.toISOString() || null,
            isAdmin: user.isAdmin
        })

    } catch (error) {
        console.error('Get user error:', error)
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
}
