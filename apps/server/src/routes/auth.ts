import { Elysia, t } from 'elysia'
import cors from '@elysiajs/cors'
import { cookie } from '@elysiajs/cookie'
import { addMinutes, emailHash, ensureUserId, normalizeEmail, randomToken, sha256, stmts, EMAIL_PEPPER } from '../db/sql'
import { sendSigninEmail } from '../lib/email'

function isEmail(str: unknown): str is string {
    return typeof str === 'string' && /.+@.+\..+/.test(str)
}

async function ensureUserWithRetry(hash: string, email?: string): Promise<number | null> {
    for (let i = 0; i < 5; i++) {
        const id = ensureUserId(hash, email)
        if (id) return id
        if (i < 4) await Bun.sleep(50 * (i + 1))
    }
    return null
}

export const authRoutes = new Elysia({ prefix: '/api/auth' })
    .use(cors())
    .use(cookie())
    .post('/login', async ({ body, request, set }) => {
        const email = typeof (body as any)?.email === 'string' ? (body as any).email : ''
        const normalized = normalizeEmail(email)
        if (!isEmail(normalized) || !/@(id\.)?uff\.br$/.test(normalized)) {
            set.status = 400
            return { error: 'Use email @id.uff.br/@uff.br' }
        }

        const hash = emailHash(normalized)
        const userId = await ensureUserWithRetry(hash, normalized)
        if (!userId) {
            set.status = 500
            return { error: 'Failed to ensure user' }
        }

        const token = randomToken(24)
        const tokenHash = sha256(token + EMAIL_PEPPER)
        const expires = addMinutes(new Date(), 15).toISOString()
        stmts.insertToken.run(
            userId,
            tokenHash,
            'signin',
            expires,
            request.headers.get('x-forwarded-for') ?? null,
            request.headers.get('user-agent') ?? null
        )

        // In localhost, redirect directly instead of sending email
        const isLocalhost = request.headers.get('host')?.includes('localhost') ||
            request.headers.get('host')?.includes('127.0.0.1')

        if (isLocalhost) {
            const frontendUrl = 'http://localhost:3000'
            return {
                ok: true,
                message: 'Redirecionando...',
                redirect_url: `${frontendUrl}/?token=${token}`
            }
        } else {
            await sendSigninEmail(normalized, token)
            return { ok: true, message: 'Link de acesso enviado para o seu email' }
        }
    }).get('/magic-link', ({ query, set, cookie }) => {
        const token = typeof (query as any)?.token === 'string' ? (query as any).token : ''
        if (!token) {
            set.status = 400
            set.redirect = '/?error=token-missing'
            return
        }

        const tokenHash = sha256(token + EMAIL_PEPPER)
        const row = stmts.getValidToken.get(tokenHash) as any

        if (!row) {
            set.status = 400
            set.redirect = '/?error=invalid-token'
            return
        }

        stmts.consumeToken.run(row.id)
        stmts.verifyUserNow.run(row.user_id)

        const session = randomToken(32)
        const sessionHash = sha256(session + EMAIL_PEPPER)
        const expires = addMinutes(new Date(), 60 * 24 * 30).toISOString()
        stmts.createSession.run(row.user_id, sessionHash, expires)

        // Set session cookie using the cookie object
        if (cookie.auth_token) {
            cookie.auth_token.set({
                value: session,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: '/'
            })
        }

        // Redirect to homepage
        set.redirect = '/?login=success'
        return
    })
    .post('/verify-token', ({ body, set, cookie }) => {
        const token = typeof (body as any)?.token === 'string' ? (body as any).token : ''
        if (!token) {
            set.status = 400
            return { error: 'Token required' }
        }

        const tokenHash = sha256(token + EMAIL_PEPPER)
        const row = stmts.getValidToken.get(tokenHash) as any

        if (!row) {
            set.status = 400
            return { error: 'Invalid or expired token' }
        }

        stmts.consumeToken.run(row.id)
        stmts.verifyUserNow.run(row.user_id)

        const session = randomToken(32)
        const sessionHash = sha256(session + EMAIL_PEPPER)
        const expires = addMinutes(new Date(), 60 * 24 * 30).toISOString()
        stmts.createSession.run(row.user_id, sessionHash, expires)

        // Set session cookie
        if (cookie.auth_token) {
            cookie.auth_token.set({
                value: session,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: '/'
            })
        }

        return { ok: true, message: 'Login realizado com sucesso' }
    })
    .get('/user', ({ cookie, set }) => {
        const authToken = cookie.auth_token?.value

        if (!authToken) {
            set.status = 401
            return { error: 'Not authenticated' }
        }

        const sessionHash = sha256(authToken + EMAIL_PEPPER)
        const session = stmts.getSession.get(sessionHash) as any

        if (!session) {
            set.status = 401
            return { error: 'Invalid session' }
        }

        const user = stmts.getUserById.get(session.user_id) as any
        if (!user) {
            set.status = 404
            return { error: 'User not found' }
        }

        return {
            id: user.id,
            email: user.email || user.email_hash, // Return actual email if available, fallback to hash
            verified: !!user.verified_at
        }
    })
    .post('/logout', ({ cookie }) => {
        if (cookie.auth_token) {
            cookie.auth_token.remove()
        }

        return { ok: true, message: 'Logout realizado com sucesso' }
    })
