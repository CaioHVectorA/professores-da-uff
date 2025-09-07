import { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'
import { cookies } from 'next/headers'

const prisma = new PrismaClient()

export async function getUserFromSession(request: NextRequest) {
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

export async function requireAuth(request: NextRequest) {
    const user = await getUserFromSession(request)

    if (!user) {
        throw new Error('Não autenticado')
    }

    return user
}
