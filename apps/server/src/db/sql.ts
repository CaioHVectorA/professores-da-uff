import { Database } from 'bun:sqlite'
import crypto from 'node:crypto'

export const DB_PATH = new URL('../../../../db.db', import.meta.url).pathname
export const EMAIL_PEPPER = process.env.EMAIL_PEPPER || 'dev-pepper-change-me'
const DEBUG_AUTH = process.env.DEBUG_AUTH === '1'
const dbg = (...args: any[]) => {
    if (DEBUG_AUTH) console.log('[auth]', ...args)
}

export const db = new Database(DB_PATH)
db.exec('PRAGMA foreign_keys = ON;')
// Improve dev stability under hot reload / multiple writers
try {
    db.exec('PRAGMA journal_mode = WAL;')
    db.exec('PRAGMA busy_timeout = 3000;')
} catch (_) {
    // ignore
}

// Ensure minimal auth schema exists (dev-friendly)
db.exec(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email_hash TEXT NOT NULL UNIQUE,
    email TEXT,
    verified_at TIMESTAMP DEFAULT NULL,
    is_admin INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS magic_link_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    purpose TEXT DEFAULT 'signin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP DEFAULT NULL,
    request_ip TEXT DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token_hash TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
`)

// Add email column if it doesn't exist (for existing databases)
try {
    db.exec('ALTER TABLE users ADD COLUMN email TEXT;')
} catch (e) {
    // Column already exists or other error, ignore
}

dbg('DB initialized at', DB_PATH)

export const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex')
export const normalizeEmail = (e: string) => e.trim().toLowerCase()
export const emailHash = (e: string) => sha256(normalizeEmail(e) + EMAIL_PEPPER)
export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex')
export const addMinutes = (d: Date, m: number) => new Date(d.getTime() + m * 60_000)
export const clampInt = (n: number, min: number, max: number) => Math.max(min, Math.min(max, Math.trunc(n)))

export const stmts = {
    getUserByEmailHash: db.query<{ id: number; verified_at: string | null }, any>(
        'SELECT id, verified_at FROM users WHERE email_hash = ?'
    ),
    // Keep simple insert (ignored on conflict) for compatibility
    insertUser: db.prepare('INSERT OR IGNORE INTO users (email_hash, email, verified_at) VALUES (?, ?, NULL)'),
    // Atomic upsert that always returns the row (may not be supported on some SQLite builds)
    insertOrGetUser: db.query<{ id: number; verified_at: string | null }, any>(
        'INSERT INTO users (email_hash, email, verified_at) VALUES ($email_hash, $email, NULL) ON CONFLICT(email_hash) DO UPDATE SET email = $email, verified_at = verified_at RETURNING id, verified_at'
    ),
    insertToken: db.prepare(
        'INSERT INTO magic_link_tokens (user_id, token_hash, purpose, expires_at, request_ip, user_agent) VALUES (?, ?, ?, ?, ?, ?)'
    ),
    getValidToken: db.query<{ id: number; user_id: number }, any>(
        'SELECT id, user_id FROM magic_link_tokens WHERE token_hash = ? AND datetime(expires_at) > datetime("now")'
    ),
    consumeToken: db.prepare('UPDATE magic_link_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = ?'),
    verifyUserNow: db.prepare('UPDATE users SET verified_at = CURRENT_TIMESTAMP WHERE id = ?'),
    createSession: db.prepare('INSERT INTO sessions (user_id, session_token_hash, expires_at) VALUES (?, ?, ?)'),
    getSession: db.query<{ id: number; user_id: number }, any>(
        'SELECT id, user_id FROM sessions WHERE session_token_hash = ? AND revoked_at IS NULL AND datetime(expires_at) > datetime("now")'
    ),
    getUserById: db.query<{ id: number; email_hash: string; email: string; verified_at: string | null }, any>(
        'SELECT id, email_hash, email, verified_at FROM users WHERE id = ?'
    ),
    // NOTE: limit/offset moved to helpers below to avoid datatype mismatch in some SQLite bindings
    listProfessorsBase: db.query<{ id: number; name: string }, any>(
        'SELECT id, name FROM professors WHERE name LIKE $q ORDER BY name'
    ),
    countProfessors: db.query<{ c: number }, any>('SELECT COUNT(*) as c FROM professors WHERE name LIKE $q'),
    subjectsByProfessor: db.query<{ name: string }, any>(
        'SELECT s.name as name FROM subjects s JOIN professor_subjects ps ON ps.subject_id = s.id WHERE ps.professor_id = ? ORDER BY s.name'
    ),
    listProfBySubjectBase: db.query<{ id: number; name: string }, any>(
        'SELECT p.id, p.name FROM professors p JOIN professor_subjects ps ON ps.professor_id = p.id JOIN subjects s ON s.id = ps.subject_id WHERE s.name = $subject ORDER BY p.name'
    ),
    countProfBySubject: db.query<{ c: number }, any>(
        'SELECT COUNT(DISTINCT p.id) as c FROM professors p JOIN professor_subjects ps ON ps.professor_id = p.id JOIN subjects s ON s.id = ps.subject_id WHERE s.name = $subject'
    ),
    getSubjectByName: db.query<{ id: number }, any>('SELECT id FROM subjects WHERE name = ?'),
    getSubjectById: db.query<{ id: number; name: string }, any>('SELECT id, name FROM subjects WHERE id = ?'),
    insertReview: db.prepare(
        'INSERT INTO review (professor_id, subject_id, user_id, review, approved, didatic_quality, material_quality, exams_difficulty, personality, requires_presence, exam_method, anonymous) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ),
    checkUserReviewExists: db.query<{ count: number }, any>(
        'SELECT COUNT(*) as count FROM review WHERE professor_id = ? AND user_id = ?'
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
        user_id: number
        subject_name: string
    }, any>(
        'SELECT r.id, r.review, r.created_at, r.didatic_quality, r.material_quality, r.exams_difficulty, r.personality, r.requires_presence, r.exam_method, r.anonymous, r.subject_id, r.user_id, s.name as subject_name FROM review r JOIN subjects s ON r.subject_id = s.id WHERE r.professor_id = ? ORDER BY r.created_at DESC'
    )
}

// Ensure a user exists for the given email_hash and return its id
export function ensureUserId(email_hash: string, email?: string): number | null {
    dbg('ensureUserId: start', email_hash)
    try {
        const existing = stmts.getUserByEmailHash.get(email_hash) as any
        dbg('existing', existing)
        if (existing?.id) return Number(existing.id)
        const r = stmts.insertUser.run(email_hash, email || null) as any
        dbg('insertUser.run result', r)
        if (r && typeof r.changes === 'number' && r.changes === 1) {
            dbg('inserted new user id', r.lastInsertRowid)
            return Number(r.lastInsertRowid)
        }
        const again = stmts.getUserByEmailHash.get(email_hash) as any
        dbg('again', again)
        return again?.id ? Number(again.id) : null
    } catch (e) {
        dbg('ensureUserId error', e)
        return null
    }
}

// Helpers with safe integer embedding for pagination
export function listProfessorsPaged(q: string, limit: number, offset: number) {
    const lim = clampInt(limit, 1, 100)
    const off = Math.max(0, Math.trunc(offset))
    const sql = `SELECT id, name FROM professors WHERE name LIKE ? ORDER BY name LIMIT ${lim} OFFSET ${off}`
    dbg('listProfessorsPaged', { sql, q, lim, off })
    return db.query<{ id: number; name: string }, any>(sql).all(q)
}

export function listProfBySubjectPaged(subject: string, limit: number, offset: number) {
    const lim = clampInt(limit, 1, 100)
    const off = Math.max(0, Math.trunc(offset))
    const sql = `SELECT p.id, p.name FROM professors p JOIN professor_subjects ps ON ps.professor_id = p.id JOIN subjects s ON s.id = ps.subject_id WHERE s.name = $subject ORDER BY p.name LIMIT ${lim} OFFSET ${off}`
    return db.query<{ id: number; name: string }, any>(sql).all({ subject })
}

export function requireSessionFromReq(req: Request) {
    // Try Authorization header first
    let token = req.headers.get('Authorization')?.replace('Bearer ', '')
    
    // If not found, try cookie
    if (!token) {
        const cookieHeader = req.headers.get('cookie')
        if (cookieHeader) {
            const cookies: Record<string, string> = {}
            cookieHeader.split(';').forEach(cookie => {
                const [key, value] = cookie.trim().split('=')
                if (key && value) {
                    cookies[key] = value
                }
            })
            token = cookies['auth_token']
        }
    }
    
    if (!token) return null
    const sth = sha256(token + EMAIL_PEPPER)
    const row = stmts.getSession.get(sth)
    if (!row) return null
    return row.user_id
}
