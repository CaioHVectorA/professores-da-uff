import { Database } from 'bun:sqlite';
import { PrismaClient } from '@prisma/client';

// Assuming db.db is in the parent directory
const dbPath = process.cwd() + '/../db.db';
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

        // Create professors
        const profMap = new Map();
        for (const prof of professors) {
            const created = await prisma.professor.create({ data: { name: prof.name } });
            profMap.set(prof.id, created.id);
        }

        // Create subjects
        const subjMap = new Map();
        for (const subj of subjects) {
            const created = await prisma.subject.create({ data: { name: subj.name } });
            subjMap.set(subj.id, created.id);
        }

        // Create professor_subjects
        const psMap = new Map(); // Map from old ps.id to new ps.id
        for (const ps of professorSubjects) {
            const profId = profMap.get(ps.professor_id);
            const subjId = subjMap.get(ps.subject_id);
            if (profId && subjId) {
                const created = await prisma.professor_Subject.create({
                    data: {
                        professorId: profId,
                        subjectId: subjId
                    }
                });
                psMap.set(ps.id, created.id); // Assuming ps has id
            }
        }

        // Create reviews
        for (const rev of reviews) {
            // Find the professorSubjectId
            const ps = professorSubjects.find(p => p.professor_id === rev.professor_id && p.subject_id === rev.subject_id);
            if (ps) {
                const professorSubjectId = psMap.get(ps.id);
                if (professorSubjectId) {
                    await prisma.review.create({
                        data: {
                            professorSubjectId: professorSubjectId,
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
