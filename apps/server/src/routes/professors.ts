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
    .get('/professors/:professorId/reviews', ({ params, query }) => {
        const professorId = toNumber((params as any)?.professorId, NaN)

        if (!professorId || isNaN(professorId)) {
            return { error: 'Invalid professor ID' }
        }

        const reviews = stmts.listReviewsByProfessor.all(Number(professorId))

        // Get subject names for each review
        const data = reviews.map((review) => {
            const subject = stmts.getSubjectById.get(review.subject_id) || { name: 'Unknown' }
            return {
                id: review.id,
                review: review.review,
                created_at: review.created_at,
                didatic_quality: review.didatic_quality,
                material_quality: review.material_quality,
                exams_difficulty: review.exams_difficulty,
                personality: review.personality,
                requires_presence: !!review.requires_presence,
                exam_method: review.exam_method,
                anonymous: !!review.anonymous,
                subject_name: subject.name
            }
        })

        return {
            data,
            professor_id: Number(professorId),
            total: data.length
        }
    })
