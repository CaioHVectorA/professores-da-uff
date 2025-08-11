import { Elysia } from 'elysia'
import cors from '@elysiajs/cors'
import { requireSessionFromReq, stmts } from '../db/sql'

function toNumber(v: unknown, d: number) {
    const n = Number(v)
    return Number.isFinite(n) ? n : d
}

export const reviewRoutes = new Elysia({ prefix: '/api' })
    .use(cors())
    .post('/reviews', ({ body, set, request }) => {
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
    .get('/reviews/:professorId', ({ params }) => {
        const professorId = toNumber((params as any)?.professorId, NaN)
        const rows = stmts.listReviewsByProfessor.all({ pid: Number(professorId) })
        return { data: rows }
    })
