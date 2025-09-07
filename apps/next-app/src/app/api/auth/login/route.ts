import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'
import { Resend } from 'resend'

const prisma = new PrismaClient()
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json()

        if (!email) {
            return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
        }

        // Validate UFF email
        if (!email.endsWith('@id.uff.br') && !email.endsWith('@uff.br')) {
            return NextResponse.json({
                error: 'Use um email institucional da UFF (@id.uff.br ou @uff.br)'
            }, { status: 400 })
        }

        // Hash email for privacy
        const emailHash = createHash('sha256').update(email.toLowerCase()).digest('hex')

        // Find or create user
        let user = await prisma.user.findUnique({
            where: { emailHash }
        })

        if (!user) {
            user = await prisma.user.create({
                data: {
                    emailHash,
                    email: email.toLowerCase()
                }
            })
        }

        // Generate magic link token
        const token = createHash('sha256').update(Math.random().toString()).digest('hex')
        const tokenHash = createHash('sha256').update(token).digest('hex')
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

        await prisma.magicLinkToken.create({
            data: {
                userId: user.id,
                tokenHash,
                expiresAt,
                requestIp: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
                userAgent: request.headers.get('user-agent')
            }
        })

        // Send magic link email
        const magicLinkUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080'}/auth/magic-link?token=${token}`

        // In development, always send to caihebatista@gmail.com
        const recipientEmail = process.env.NODE_ENV === 'development' ? 'caihebatista@gmail.com' : email

        try {
            console.log('🔧 Enviando email para:', recipientEmail)
            console.log('🔧 Magic link URL:', magicLinkUrl)
            console.log('🔧 NODE_ENV:', process.env.NODE_ENV)
            console.log('🔧 RESEND_API_KEY presente:', !!process.env.RESEND_API_KEY)

            const emailResult = await resend.emails.send({
                from: process.env.NODE_ENV === 'development' ? 'onboarding@resend.dev' : 'QuadroScrap <noreply@quadroscrap.com>',
                to: recipientEmail, // Removido array, deve ser string
                subject: 'Seu link de acesso - QuadroScrap',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">QuadroScrap - Link de Acesso</h2>
            <p>Olá!</p>
            <p>Clique no link abaixo para acessar sua conta:</p>
            <a href="${magicLinkUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
              Acessar QuadroScrap
            </a>
            <p style="color: #6b7280; font-size: 14px;">
              Este link é válido por 15 minutos e pode ser usado apenas uma vez.
            </p>
            <p style="color: #6b7280; font-size: 14px;">
              Se você não solicitou este link, ignore este email.
            </p>
            ${process.env.NODE_ENV === 'development' ? `<p style="color: #dc2626; font-size: 12px; margin-top: 16px;">🔧 <strong>Modo Desenvolvimento:</strong> Este email foi enviado para ${recipientEmail} em vez de ${email}</p>` : ''}
          </div>
        `
            })

            console.log('✅ Email enviado com sucesso. Resposta completa:', JSON.stringify(emailResult, null, 2))
        } catch (emailError) {
            console.error('❌ Erro ao enviar email:', emailError)
            return NextResponse.json({ error: 'Erro ao enviar email' }, { status: 500 })
        }

        return NextResponse.json({
            ok: true,
            message: 'Link de acesso enviado para seu email!'
        })

    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
}
