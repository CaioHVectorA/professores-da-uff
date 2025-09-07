import { Database } from 'bun:sqlite';
import { PrismaClient } from '@prisma/client';

// Assuming db.db is in the parent directory
const dbPath = process.cwd() + '/db.db';
console.log('DB path:', dbPath);
const sqliteDb = new Database(dbPath);

const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL, // Should be Postgres URL
});

async function migrate() {
    try {
        // Get data from SQLite
        let professors: any[] = [];
        let subjects: any[] = [];
        let professorSubjects: any[] = [];
        let reviews: any[] = [];
        try {
            professors = sqliteDb.query('SELECT * FROM professors').all();
        } catch (e) {
            console.log('Table professors not found');
        }
        try {
            subjects = sqliteDb.query('SELECT * FROM subjects').all();
        } catch (e) {
            console.log('Table subjects not found');
        }
        try {
            professorSubjects = sqliteDb.query('SELECT * FROM professor_subjects').all();
        } catch (e) {
            console.log('Table professor_subjects not found');
        }
        try {
            reviews = sqliteDb.query('SELECT * FROM review').all();
        } catch (e) {
            console.log('Table review not found');
        }

        try {
            const sequences = sqliteDb.query('SELECT * FROM sqlite_sequence').all();
            console.log('sqlite_sequence:', sequences);
        } catch (e) {
            console.log('sqlite_sequence not found');
        }

        // Create professors
        const profMap = new Map();
        for (const prof of professors) {
            const created = await prisma.professor.create({ data: { name: prof.name } });
            profMap.set(prof.id, created.id);
        }

        // Create subjects and link to professors
        const subjMap = new Map();
        for (const ps of professorSubjects) {
            const profId = profMap.get(ps.professor_id);
            const subj = subjects.find(s => s.id === ps.subject_id);
            if (profId && subj) {
                const created = await prisma.subject.create({ data: { name: subj.name, professorId: profId } });
                subjMap.set(subj.id, created.id);
            }
        }

        // Create reviews
        for (const rev of reviews) {
            const profId = profMap.get(rev.professor_id);
            const subjId = subjMap.get(rev.subject_id);
            if (profId && subjId) {
                await prisma.review.create({
                    data: {
                        professorId: profId,
                        subjectId: subjId,
                        review: rev.review,
                        createdAt: rev.created_at,
                        didaticQuality: rev.didatic_quality,
                        materialQuality: rev.material_quality,
                        examsDifficulty: rev.exams_difficulty,
                        personality: rev.personality,
                        requiresPresence: rev.requires_presence,
                        examMethod: rev.exam_method,
                        anonymous: rev.anonymous
                    }
                });
            }
        }

        console.log('Migration completed');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        sqliteDb.close();
        await prisma.$disconnect();
    }
}

migrate();
