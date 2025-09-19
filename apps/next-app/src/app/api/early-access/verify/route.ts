import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'
import { cookies } from 'next/headers'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json()

        if (!email || !password) {
            return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 })
        }

        // Find early access user
        const earlyAccess = await prisma.applicationEarlyAccess.findUnique({
            where: { email }
        })

        if (!earlyAccess) {
            return NextResponse.json({ error: 'Email não encontrado' }, { status: 401 })
        }

        if (earlyAccess.password !== password) {
            return NextResponse.json({ error: 'Senha de acesso incorreta' }, { status: 401 })
        }

        // Create session
        const sessionToken = createHash('sha256').update(Math.random().toString()).digest('hex')
        const sessionTokenHash = createHash('sha256').update(sessionToken).digest('hex')

        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

        await prisma.session.create({
            data: {
                userId: 1, // Assuming a dummy user or need to create one
                sessionTokenHash,
                expiresAt,
            }
        })

        // Set cookie
        const cookieStore = await cookies()
        cookieStore.set('session-token', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60,
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Early access verification error:', error)
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
}
