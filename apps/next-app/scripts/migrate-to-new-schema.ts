import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateData() {
    console.log('Starting data migration...');

    // Step 1: Migrate existing Subjects to Professor_Subject
    const subjects = await prisma.subject.findMany();
    for (const subject of subjects) {
        // Create Professor_Subject entry
        await prisma.professor_Subject.create({
            data: {
                professorId: subject.professorId,
                subjectId: subject.id,
            },
        });
    }
    console.log('Migrated subjects to professor_subjects.');

    // Step 2: Update Reviews to use professorSubjectId
    const reviews = await prisma.review.findMany();
    for (const review of reviews) {
        // Find the corresponding Professor_Subject
        const professorSubject = await prisma.professor_Subject.findUnique({
            where: {
                professorId_subjectId: {
                    professorId: review.professorId,
                    subjectId: review.subjectId,
                },
            },
        });
        if (professorSubject) {
            await prisma.review.update({
                where: { id: review.id },
                data: {
                    professorSubjectId: professorSubject.id,
                    // Remove professorId and subjectId if needed, but since schema changed, they are removed
                },
            });
        }
    }
    console.log('Updated reviews to use professorSubjectId.');

    // Step 3: Remove duplicates in Professor and Subject
    // For Professors, group by name and merge
    const professors = await prisma.professor.findMany();
    const professorMap = new Map<string, number>();
    for (const prof of professors) {
        if (professorMap.has(prof.name)) {
            // Merge professorSubjects to the first one
            const firstId = professorMap.get(prof.name)!;
            const profSubjects = await prisma.professor_Subject.findMany({
                where: { professorId: prof.id },
            });
            for (const ps of profSubjects) {
                await prisma.professor_Subject.update({
                    where: { id: ps.id },
                    data: { professorId: firstId },
                });
            }
            // Update reviews
            await prisma.review.updateMany({
                where: { professorSubject: { professorId: prof.id } },
                data: { professorSubject: { update: { professorId: firstId } } },
            });
            // Delete duplicate professor
            await prisma.professor.delete({ where: { id: prof.id } });
        } else {
            professorMap.set(prof.name, prof.id);
        }
    }

    // For Subjects, group by name and merge
    const subjectMap = new Map<string, number>();
    for (const subj of subjects) {
        if (subjectMap.has(subj.name)) {
            const firstId = subjectMap.get(subj.name)!;
            const profSubjects = await prisma.professor_Subject.findMany({
                where: { subjectId: subj.id },
            });
            for (const ps of profSubjects) {
                await prisma.professor_Subject.update({
                    where: { id: ps.id },
                    data: { subjectId: firstId },
                });
            }
            // Update reviews via professorSubject
            await prisma.review.updateMany({
                where: { professorSubject: { subjectId: subj.id } },
                data: { professorSubject: { update: { subjectId: firstId } } },
            });
            // Delete duplicate subject
            await prisma.subject.delete({ where: { id: subj.id } });
        } else {
            subjectMap.set(subj.name, subj.id);
        }
    }

    console.log('Removed duplicates.');
    console.log('Migration completed.');
}

migrateData()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
