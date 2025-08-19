const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const APP_URL = process.env.APP_URL || 'http://localhost:3001'

export async function sendSigninEmail(to: string, token: string) {
    if (!RESEND_API_KEY) throw new Error('Missing RESEND_API_KEY')
    const url = `${APP_URL}/api/auth/magic-link?token=${token}`
    const subject = 'Seu link de acesso — QuadroScrap UFF'
    const html = `
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
    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ from: 'noreply@quadroscrap.dev', to, subject, html })
    })
    if (!res.ok) throw new Error(`Resend error: ${res.status} ${await res.text()}`)
}
