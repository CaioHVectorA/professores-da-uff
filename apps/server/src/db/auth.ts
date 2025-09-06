import crypto from 'node:crypto'
import prisma from './prisma'

export const EMAIL_PEPPER = process.env.EMAIL_PEPPER || 'dev-pepper-change-me'
const DEBUG_AUTH = process.env.DEBUG_AUTH === '1'
const dbg = (...args: any[]) => {
    if (DEBUG_AUTH) console.log('[auth]', ...args)
}

export const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex')
export const normalizeEmail = (e: string) => e.trim().toLowerCase()
export const emailHash = (e: string) => sha256(normalizeEmail(e) + EMAIL_PEPPER)
export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex')
export const addMinutes = (d: Date, m: number) => new Date(d.getTime() + m * 60_000)
export const clampInt = (n: number, min: number, max: number) => Math.max(min, Math.min(max, Math.trunc(n)))

// Ensure a user exists for the given email_hash and return its id
export async function ensureUserId(emailHash: string, email?: string): Promise<number | null> {
    dbg('ensureUserId: start', emailHash)
    try {
        let user = await prisma.user.findUnique({
            where: { emailHash }
        })

        if (!user) {
            user = await prisma.user.create({
                data: {
                    emailHash,
                    email: email || null
                }
            })
        }

        return user.id
    } catch (e) {
        dbg('ensureUserId error', e)
        return null
    }
}

export async function getUserByEmailHash(emailHash: string) {
    return prisma.user.findUnique({
        where: { emailHash },
        select: { id: true, verifiedAt: true }
    })
}

export async function createMagicLinkToken(data: {
    userId: number
    tokenHash: string
    purpose?: string
    expiresAt: Date
    requestIp?: string
    userAgent?: string
}) {
    return prisma.magicLinkToken.create({ data })
}

export async function getValidToken(tokenHash: string) {
    return prisma.magicLinkToken.findFirst({
        where: {
            tokenHash,
            usedAt: null,
            expiresAt: { gt: new Date() }
        },
        select: { id: true, userId: true }
    })
}

export async function consumeToken(id: number) {
    return prisma.magicLinkToken.update({
        where: { id },
        data: { usedAt: new Date() }
    })
}

export async function verifyUserNow(id: number) {
    return prisma.user.update({
        where: { id },
        data: { verifiedAt: new Date() }
    })
}

export async function createSession(data: {
    userId: number
    sessionTokenHash: string
    expiresAt: Date
}) {
    return prisma.session.create({ data })
}

export async function getValidSession(sessionTokenHash: string) {
    return prisma.session.findFirst({
        where: {
            sessionTokenHash,
            revokedAt: null,
            expiresAt: { gt: new Date() }
        },
        select: { id: true, userId: true }
    })
}

export async function getUserById(id: number) {
    return prisma.user.findUnique({
        where: { id },
        select: { id: true, emailHash: true, email: true, verifiedAt: true }
    })
}
