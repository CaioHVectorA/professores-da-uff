import { Database } from 'bun:sqlite'
import crypto from 'node:crypto'

const DB_PATH = new URL('../../../../db.db', import.meta.url).pathname
export const EMAIL_PEPPER = process.env.EMAIL_PEPPER || 'dev-pepper-change-me'

export const db = new Database(DB_PATH)
db.exec('PRAGMA foreign_keys = ON;')

export const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex')
export const normalizeEmail = (e: string) => e.trim().toLowerCase()
export const emailHash = (e: string) => sha256(normalizeEmail(e) + EMAIL_PEPPER)
export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex')
export const addMinutes = (d: Date, m: number) => new Date(d.getTime() + m * 60_000)
export const clampInt = (n: number, min: number, max: number) => Math.max(min, Math.min(max, Math.trunc(n)))

export const stmts = {
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
    createSession: db.prepare('INSERT INTO sessions (user_id, session_token_hash, expires_at) VALUES (?, ?, ?)'),
    getSession: db.query<{ id: number; user_id: number }, any>(
        'SELECT id, user_id FROM sessions WHERE session_token_hash = $sth AND revoked_at IS NULL AND datetime(expires_at) > datetime("now")'
    ),
    // NOTE: limit/offset moved to helpers below to avoid datatype mismatch in some SQLite bindings
    listProfessorsBase: db.query<{ id: number; name: string }, any>(
        'SELECT id, name FROM professors WHERE name LIKE $q ORDER BY name'
    ),
    countProfessors: db.query<{ c: number }, any>('SELECT COUNT(*) as c FROM professors WHERE name LIKE $q'),
    subjectsByProfessor: db.query<{ name: string }, any>(
        'SELECT s.name as name FROM subjects s JOIN professor_subjects ps ON ps.subject_id = s.id WHERE ps.professor_id = $pid ORDER BY s.name'
    ),
    listProfBySubjectBase: db.query<{ id: number; name: string }, any>(
        'SELECT p.id, p.name FROM professors p JOIN professor_subjects ps ON ps.professor_id = p.id JOIN subjects s ON s.id = ps.subject_id WHERE s.name = $subject ORDER BY p.name'
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
    }, any>(
        'SELECT id, review, created_at, didatic_quality, material_quality, exams_difficulty, personality, requires_presence, exam_method, anonymous, subject_id FROM review WHERE professor_id = $pid ORDER BY created_at DESC'
    )
}

// Helpers with safe integer embedding for pagination
export function listProfessorsPaged(q: string, limit: number, offset: number) {
    const lim = clampInt(limit, 1, 100)
    const off = Math.max(0, Math.trunc(offset))
    const sql = `SELECT id, name FROM professors WHERE name LIKE $q ORDER BY name LIMIT ${lim} OFFSET ${off}`
    return db.query<{ id: number; name: string }, any>(sql).all({ q })
}

export function listProfBySubjectPaged(subject: string, limit: number, offset: number) {
    const lim = clampInt(limit, 1, 100)
    const off = Math.max(0, Math.trunc(offset))
    const sql = `SELECT p.id, p.name FROM professors p JOIN professor_subjects ps ON ps.professor_id = p.id JOIN subjects s ON s.id = ps.subject_id WHERE s.name = $subject ORDER BY p.name LIMIT ${lim} OFFSET ${off}`
    return db.query<{ id: number; name: string }, any>(sql).all({ subject })
}

export function requireSessionFromReq(req: Request) {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return null
    const sth = sha256(token + EMAIL_PEPPER)
    const row = stmts.getSession.get({ sth })
    if (!row) return null
    return row.user_id
}
