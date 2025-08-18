import { Elysia, t } from 'elysia'
import cors from '@elysiajs/cors'
import { addMinutes, emailHash, ensureUserId, normalizeEmail, randomToken, sha256, stmts, EMAIL_PEPPER } from '../db/sql'
import { sendSigninEmail } from '../lib/email'

const DEV_BYPASS = process.env.DEV_AUTH_BYPASS === '1'

function isEmail(str: unknown): str is string {
    return typeof str === 'string' && /.+@.+\..+/.test(str)
}

async function ensureUserWithRetry(hash: string): Promise<number | null> {
    for (let i = 0; i < 5; i++) {
        const id = ensureUserId(hash)
        if (id) return id
        if (i < 4) await Bun.sleep(50 * (i + 1))
    }
    return null
}

export const authRoutes = new Elysia({ prefix: '/api/auth' })
    .use(cors())
    .post('/request', async ({ body, request, set }) => {
        const email = typeof (body as any)?.email === 'string' ? (body as any).email : ''
        const normalized = normalizeEmail(email)
        if (!isEmail(normalized) || !/@(id\.)?uff\.br$/.test(normalized)) {
            set.status = 400
            return { error: 'Use email @id.uff.br/@uff.br' }
        }

        const hash = emailHash(normalized)
        const userId = await ensureUserWithRetry(hash)
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

        if (DEV_BYPASS) {
            return { ok: true, dev_token: token }
        }

        await sendSigninEmail(normalized, token)
        return { ok: true }
    })
    .get('/verify', ({ query, set }) => {
        const token = typeof (query as any)?.token === 'string' ? (query as any).token : ''
        if (!token) {
            set.status = 400
            return { error: 'Token required' }
        }
        const tokenHash = sha256(token + EMAIL_PEPPER)
        console.log('Verify - token:', token)
        console.log('Verify - tokenHash:', tokenHash)
        const row = stmts.getValidToken.get(tokenHash) as any
        console.log('Verify - row found:', row)
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
        return { ok: true, token: session }
    })
