const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const APP_URL = process.env.APP_URL || 'http://localhost:3000'

export async function sendSigninEmail(to: string, token: string) {
    if (!RESEND_API_KEY) throw new Error('Missing RESEND_API_KEY')
    const url = `${APP_URL}/api/auth/verify?token=${token}`
    const subject = 'Seu link de acesso — UFF Reviews'
    const html = `<p>Use o link abaixo para acessar:</p><p><a href="${url}">${url}</a></p><p>Expira em 15 minutos.</p>`
    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ from: 'noreply@uffreviews.dev', to, subject, html })
    })
    if (!res.ok) throw new Error(`Resend error: ${res.status} ${await res.text()}`)
}
