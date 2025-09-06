import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || '')
const APP_URL = process.env.APP_URL || 'http://localhost:3000'

export async function sendSigninEmail(to: string, token: string) {
    if (!process.env.RESEND_API_KEY) throw new Error('Missing RESEND_API_KEY')

    const url = `${APP_URL}/magic-link?token=${token}`
    const isDev = process.env.NODE_ENV !== 'production'
    const { data, error } = await resend.emails.send({
        from: 'QuadroScrap <onboarding@resend.dev>',
        to: isDev ? ["caihebatista@gmail.com"] : [to],
        subject: 'Seu link de acesso — QuadroScrap UFF',
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #2563eb;">QuadroScrap UFF</h1>
                <p>Clique no link abaixo para acessar sua conta:</p>
                <a href="${url}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
                    Acessar QuadroScrap
                </a>
                <p style="color: #666; font-size: 14px;">Este link expira em 15 minutos.</p>
                <p style="color: #666; font-size: 14px;">Se você não solicitou este acesso, ignore este email.</p>
            </div>
        `
    })

    if (error) {
        console.log({ error })
        throw new Error(`Resend error: ${error.message}`)
    }

    return data
}
