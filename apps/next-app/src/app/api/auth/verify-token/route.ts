import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'
import { cookies } from 'next/headers'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
    try {
        const { token } = await request.json()

        if (!token) {
            return NextResponse.json({ error: 'Token é obrigatório' }, { status: 400 })
        }

        const tokenHash = createHash('sha256').update(token).digest('hex')

        // Find and validate token
        const magicToken = await prisma.magicLinkToken.findUnique({
            where: { tokenHash },
            include: { user: true }
        })

        if (!magicToken) {
            return NextResponse.json({ error: 'Token inválido' }, { status: 400 })
        }

        if (magicToken.usedAt) {
            return NextResponse.json({ error: 'Token já foi usado' }, { status: 400 })
        }

        if (magicToken.expiresAt < new Date()) {
            return NextResponse.json({ error: 'Token expirado' }, { status: 400 })
        }

        // Mark token as used
        await prisma.magicLinkToken.update({
            where: { id: magicToken.id },
            data: { usedAt: new Date() }
        })

        // Update user verification
        await prisma.user.update({
            where: { id: magicToken.user.id },
            data: { verifiedAt: new Date() }
        })

        // Create session
        const sessionToken = createHash('sha256').update(Math.random().toString()).digest('hex')
        const sessionTokenHash = createHash('sha256').update(sessionToken).digest('hex')
        const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

        await prisma.session.create({
            data: {
                userId: magicToken.user.id,
                sessionTokenHash,
                expiresAt: sessionExpiresAt
            }
        })

        // Set session cookie
        const cookieStore = await cookies()
        cookieStore.set('session-token', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 // 30 days
        })

        return NextResponse.json({ ok: true })

    } catch (error) {
        console.error('Token verification error:', error)
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
}
