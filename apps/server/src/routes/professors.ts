import { Elysia } from 'elysia'
import cors from '@elysiajs/cors'
import { stmts, listProfessorsPaged, listProfBySubjectPaged } from '../db/sql'

function toNumber(v: unknown, d: number) {
    const n = Number(v)
    return Number.isFinite(n) ? n : d
}

export const professorRoutes = new Elysia({ prefix: '/api' })
    .use(cors())
    .get('/professors', ({ query }) => {
        const q = typeof (query as any)?.q === 'string' ? (query as any).q : ''
        const page = toNumber((query as any)?.page, 1)
        const pageSize = toNumber((query as any)?.pageSize, 20)

        const offset = (Number(page) - 1) * Number(pageSize)
        const like = `%${q}%`
        const rows = listProfessorsPaged(like, Number(pageSize), offset)
        const total = stmts.countProfessors.get({ q: like })?.c ?? 0
        const data = rows.map((p) => {
            const subs = stmts.subjectsByProfessor.all(p.id).map((s) => s.name)
            return { id: p.id, name: p.name, subjects: subs }
        })
        return { data, page: Number(page), pageSize: Number(pageSize), total }
    })
    .get('/professors/subject/:subject', ({ params, query }) => {
        const subject = typeof (params as any)?.subject === 'string' ? (params as any).subject : ''
        const page = toNumber((query as any)?.page, 1)
        const pageSize = toNumber((query as any)?.pageSize, 20)

        const offset = (Number(page) - 1) * Number(pageSize)

        const rows = listProfBySubjectPaged(subject, Number(pageSize), offset)
        const total = stmts.countProfBySubject.get({ subject })?.c ?? 0
        const data = rows.map((p) => ({ id: p.id, name: p.name }))
        return { data, page: Number(page), pageSize: Number(pageSize), total, subject }
    })
