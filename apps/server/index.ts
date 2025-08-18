import { Elysia } from 'elysia'
import { Database } from 'bun:sqlite'
import crypto from 'node:crypto'
import cors from '@elysiajs/cors'

// Config
const DB_PATH = new URL('../../db.db', import.meta.url).pathname
const DEV_BYPASS = process.env.DEV_AUTH_BYPASS === '1'
const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const APP_URL = process.env.APP_URL || 'http://localhost:3000'
const EMAIL_PEPPER = process.env.EMAIL_PEPPER || 'dev-pepper-change-me'

const db = new Database(DB_PATH)
db.exec('PRAGMA foreign_keys = ON;')

function normalizeEmail(email: string) {
    return email.trim().toLowerCase()
}

function sha256(input: string) {
    return crypto.createHash('sha256').update(input).digest('hex')
}

function emailHash(email: string) {
    return sha256(normalizeEmail(email) + EMAIL_PEPPER)
}

function randomToken(bytes = 32) {
    return crypto.randomBytes(bytes).toString('hex')
}

function addMinutes(date: Date, minutes: number) {
    return new Date(date.getTime() + minutes * 60_000)
}

function isEmail(str: unknown): str is string {
    return typeof str === 'string' && /.+@.+\..+/.test(str)
}

function toNumber(v: unknown, d: number) {
    const n = Number(v)
    return Number.isFinite(n) ? n : d
}

// Minimal Resend client to avoid importing heavy SDK in dev
async function sendSigninEmail(to: string, token: string) {
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

// DB helpers
const stmts = {
    getUserByEmailHash: db.query<{ id: number; verified_at: string | null }, any>(
        'SELECT id, verified_at FROM users WHERE email_hash = $email_hash'
    ),
    insertUser: db.prepare('INSERT INTO users (email_hash, verified_at) VALUES (?, NULL)'),
    insertToken: db.prepare(
        'INSERT INTO magic_link_tokens (user_id, token_hash, purpose, expires_at, request_ip, user_agent) VALUES (?, ?, ?, ?, ?, ?)'
    ),
    getValidToken: db.query<{ id: number; user_id: number }, any>(
        'SELECT id, user_id FROM magic_link_tokens WHERE token_hash = $token_hash AND used_at IS NULL AND datetime(expires_at) > datetime("now")'
    ),
    consumeToken: db.prepare('UPDATE magic_link_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = ?'),
    verifyUserNow: db.prepare('UPDATE users SET verified_at = CURRENT_TIMESTAMP WHERE id = ?'),
    createSession: db.prepare(
        'INSERT INTO sessions (user_id, session_token_hash, expires_at) VALUES (?, ?, ?)'
    ),
    getSession: db.query<{ id: number; user_id: number }, any>(
        'SELECT id, user_id FROM sessions WHERE session_token_hash = $sth AND revoked_at IS NULL AND datetime(expires_at) > datetime("now")'
    ),
    listProfessors: db.query<{ id: number; name: string }, any>(
        'SELECT id, name FROM professors WHERE name LIKE $q ORDER BY name LIMIT $limit OFFSET $offset'
    ),
    countProfessors: db.query<{ c: number }, any>('SELECT COUNT(*) as c FROM professors WHERE name LIKE $q'),
    subjectsByProfessor: db.query<{ name: string }, any>(
        'SELECT s.name as name FROM subjects s JOIN professor_subjects ps ON ps.subject_id = s.id WHERE ps.professor_id = $pid ORDER BY s.name'
    ),
    listProfBySubject: db.query<{ id: number; name: string }, any>(
        'SELECT p.id, p.name FROM professors p JOIN professor_subjects ps ON ps.professor_id = p.id JOIN subjects s ON s.id = ps.subject_id WHERE s.name = $subject ORDER BY p.name LIMIT $limit OFFSET $offset'
    ),
    countProfBySubject: db.query<{ c: number }, any>(
        'SELECT COUNT(DISTINCT p.id) as c FROM professors p JOIN professor_subjects ps ON ps.professor_id = p.id JOIN subjects s ON s.id = ps.subject_id WHERE s.name = $subject'
    ),
    getSubjectByName: db.query<{ id: number }, any>('SELECT id FROM subjects WHERE name = $name'),
    insertReview: db.prepare(
        'INSERT INTO review (professor_id, subject_id, user_id, review, approved, didatic_quality, material_quality, exams_difficulty, personality, requires_presence, exam_method, anonymous) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ),
    listReviewsByProfessor: db.query<{
        id: number
        review: string
        created_at: string
        didatic_quality: number
        material_quality: number
        exams_difficulty: number
        personality: number
        requires_presence: number
        exam_method: string | null
        anonymous: number
        subject_id: number
    }, any>('SELECT id, review, created_at, didatic_quality, material_quality, exams_difficulty, personality, requires_presence, exam_method, anonymous, subject_id FROM review WHERE professor_id = $pid ORDER BY created_at DESC')
}

function requireSessionFromReq(req: Request) {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return null
    const sth = sha256(token + EMAIL_PEPPER)
    const row = stmts.getSession.get({ sth })
    if (!row) return null
    return row.user_id
}

const app = new Elysia()
    .use(cors())
    .onError(({ code, error, set }) => {
        console.error(error)
        set.status = code === 'VALIDATION' ? 400 : 500
        return { error: (error as Error).message ?? String(error) }
    })

    // Health
    .get('/api/health', () => ({ ok: true }))

    // Auth: request magic link
    .post('/api/auth/request', async ({ body, request, set }) => {
        const email = typeof (body as any)?.email === 'string' ? (body as any).email : ''
        const normalized = normalizeEmail(email)
        if (!isEmail(normalized) || !/@(id\.)?uff\.br$/.test(normalized)) {
            set.status = 400
            return { error: 'Use email @id.uff.br/@uff.br' }
        }

        const hash = emailHash(normalized)
        let user = stmts.getUserByEmailHash.get({ email_hash: hash }) as any
        if (!user) {
            const r = stmts.insertUser.run(hash)
            user = { id: Number(r.lastInsertRowid), verified_at: null }
        }

        // Dev bypass: retorna token direto sem enviar email
        if (DEV_BYPASS) {
            const token = randomToken(24)
            const tokenHash = sha256(token + EMAIL_PEPPER)
            const expires = addMinutes(new Date(), 15).toISOString()
            stmts.insertToken.run(user.id, tokenHash, 'signin', expires, request.headers.get('x-forwarded-for') ?? null, request.headers.get('user-agent') ?? null)
            return { ok: true, dev_token: token }
        }

        // Prod: envia e-mail
        const token = randomToken(24)
        const tokenHash = sha256(token + EMAIL_PEPPER)
        const expires = addMinutes(new Date(), 15).toISOString()
        stmts.insertToken.run(user.id, tokenHash, 'signin', expires, request.headers.get('x-forwarded-for') ?? null, request.headers.get('user-agent') ?? null)
        await sendSigninEmail(normalized, token)
        return { ok: true }
    })

    // Auth: verify magic link
    .get('/api/auth/verify', ({ query, set }) => {
        const token = typeof query?.token === 'string' ? query.token : ''
        if (!token) {
            set.status = 400
            return { error: 'Token required' }
        }
        const tokenHash = sha256(token + EMAIL_PEPPER)
        const row = stmts.getValidToken.get({ token_hash: tokenHash }) as any
        if (!row) {
            set.status = 400
            return { error: 'Invalid or expired token' }
        }
        stmts.consumeToken.run(row.id)
        stmts.verifyUserNow.run(row.user_id)

        const session = randomToken(32)
        const sessionHash = sha256(session + EMAIL_PEPPER)
        const expires = addMinutes(new Date(), 60 * 24 * 30).toISOString() // 30 days
        stmts.createSession.run(row.user_id, sessionHash, expires)
        return { ok: true, token: session }
    })

    // Professors search with pagination and subjects list
    .get('/api/professors', ({ query }) => {
        const q = typeof query?.q === 'string' ? query.q : ''
        const page = toNumber((query as any)?.page, 1)
        const pageSize = toNumber((query as any)?.pageSize, 20)

        const offset = (Number(page) - 1) * Number(pageSize)
        const like = `%${q}%`
        const rows = stmts.listProfessors.all({ q: like, limit: Number(pageSize), offset })
        const total = stmts.countProfessors.get({ q: like })?.c ?? 0
        const data = rows.map((p) => {
            const subs = stmts.subjectsByProfessor.all({ pid: p.id }).map((s) => s.name)
            return { id: p.id, name: p.name, subjects: subs }
        })
        return { data, page: Number(page), pageSize: Number(pageSize), total }
    })

    // Professors by subject name
    .get('/api/professors/subject/:subject', ({ params, query }) => {
        const subject = typeof params?.subject === 'string' ? params.subject : ''
        const page = toNumber((query as any)?.page, 1)
        const pageSize = toNumber((query as any)?.pageSize, 20)

        const offset = (Number(page) - 1) * Number(pageSize)

        const rows = stmts.listProfBySubject.all({ subject, limit: Number(pageSize), offset })
        const total = stmts.countProfBySubject.get({ subject })?.c ?? 0
        const data = rows.map((p) => ({ id: p.id, name: p.name }))
        return { data, page: Number(page), pageSize: Number(pageSize), total, subject }
    })

    // Create review
    .post('/api/reviews', ({ body, set, request }) => {
        const payload = body as any
        const userId = requireSessionFromReq(request)
        if (!userId) {
            set.status = 401
            return { error: 'Unauthorized' }
        }

        const professor_id = toNumber(payload?.professor_id, NaN)
        const subject_name = typeof payload?.subject_name === 'string' ? payload.subject_name : ''
        const review = typeof payload?.review === 'string' ? payload.review : ''
        const didatic_quality = toNumber(payload?.didatic_quality, 0)
        const material_quality = toNumber(payload?.material_quality, 0)
        const exams_difficulty = toNumber(payload?.exams_difficulty, 0)
        const personality = toNumber(payload?.personality, 0)

        if (!professor_id || !subject_name || !review || didatic_quality < 1 || didatic_quality > 5 || material_quality < 1 || material_quality > 5 || exams_difficulty < 1 || exams_difficulty > 5 || personality < 1 || personality > 5) {
            set.status = 400
            return { error: 'Invalid payload' }
        }

        const subj = stmts.getSubjectByName.get({ name: subject_name }) as any
        if (!subj) {
            set.status = 400
            return { error: 'Subject not found' }
        }

        const approved = !!payload?.approved
        const requires_presence = !!payload?.requires_presence
        const exam_method = typeof payload?.exam_method === 'string' ? payload.exam_method : null
        const anonymous = payload?.anonymous === undefined ? 1 : payload?.anonymous ? 1 : 0

        stmts.insertReview.run(
            professor_id,
            subj.id,
            userId,
            review,
            approved ? 1 : 0,
            didatic_quality,
            material_quality,
            exams_difficulty,
            personality,
            requires_presence ? 1 : 0,
            exam_method,
            anonymous
        )

        return { ok: true }
    })

    // Reviews by professor
    .get('/api/reviews/:professorId', ({ params }) => {
        const professorId = toNumber((params as any)?.professorId, NaN)
        const rows = stmts.listReviewsByProfessor.all({ pid: Number(professorId) })
        return { data: rows }
    })

app.listen(3000)
console.log(`Server running http://localhost:3000`)