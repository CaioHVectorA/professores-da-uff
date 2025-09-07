import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'
import { cookies } from 'next/headers'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies()
        const sessionToken = cookieStore.get('session-token')?.value

        if (sessionToken) {
            const sessionTokenHash = createHash('sha256').update(sessionToken).digest('hex')

            // Revoke session
            await prisma.session.updateMany({
                where: { sessionTokenHash },
                data: { revokedAt: new Date() }
            })
        }

        // Clear session cookie
        cookieStore.set('session-token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 0
        })

        return NextResponse.json({ ok: true })

    } catch (error) {
        console.error('Logout error:', error)
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
}
