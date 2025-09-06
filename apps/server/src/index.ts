import { Elysia } from 'elysia'
import cors from '@elysiajs/cors'
import { cookie } from '@elysiajs/cookie'
import { authRoutes } from './routes/auth'
import { professorRoutes } from './routes/professors'
import { reviewRoutes } from './routes/reviews'

const app = new Elysia()
    .use(cors({
        origin: 'http://localhost:3000',
        credentials: true
    }))
    .use(cookie())
    .get('/api/health', () => ({ ok: true }))
    .use(authRoutes)
    .use(professorRoutes)
    .use(reviewRoutes)

app.listen(8080)
console.log('Server running http://localhost:8080')
