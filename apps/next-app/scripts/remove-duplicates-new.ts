import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function removeDuplicates() {
    console.log('Starting duplicate removal...');

    // Remove duplicate Professors
    const professors = await prisma.professor.findMany({
        include: { professorSubjects: true },
    });

    const profMap = new Map<string, number>();

    for (const prof of professors) {
        const name = prof.name.toLowerCase().trim();
        if (profMap.has(name)) {
            const keepId = profMap.get(name)!;
            // Move professorSubjects to the kept professor
            for (const ps of prof.professorSubjects) {
                // Check if the kept professor already has this subject
                const existing = await prisma.professor_Subject.findUnique({
                    where: {
                        professorId_subjectId: {
                            professorId: keepId,
                            subjectId: ps.subjectId,
                        },
                    },
                });
                if (!existing) {
                    await prisma.professor_Subject.update({
                        where: { id: ps.id },
                        data: { professorId: keepId },
                    });
                } else {
                    // If duplicate professor-subject, merge reviews
                    const reviews = await prisma.review.findMany({
                        where: { professorSubjectId: ps.id },
                    });
                    for (const review of reviews) {
                        await prisma.review.update({
                            where: { id: review.id },
                            data: { professorSubjectId: existing.id },
                        });
                    }
                    // Delete the duplicate professorSubject
                    await prisma.professor_Subject.delete({ where: { id: ps.id } });
                }
            }
            // Delete the duplicate professor
            await prisma.professor.delete({ where: { id: prof.id } });
        } else {
            profMap.set(name, prof.id);
        }
    }

    // Remove duplicate Subjects
    const subjects = await prisma.subject.findMany({
        include: { professorSubjects: true },
    });

    const subjMap = new Map<string, number>();

    for (const subj of subjects) {
        const name = subj.name.toLowerCase().trim();
        if (subjMap.has(name)) {
            const keepId = subjMap.get(name)!;
            // Move professorSubjects to the kept subject
            for (const ps of subj.professorSubjects) {
                // Check if the kept subject already has this professor
                const existing = await prisma.professor_Subject.findUnique({
                    where: {
                        professorId_subjectId: {
                            professorId: ps.professorId,
                            subjectId: keepId,
                        },
                    },
                });
                if (!existing) {
                    await prisma.professor_Subject.update({
                        where: { id: ps.id },
                        data: { subjectId: keepId },
                    });
                } else {
                    // Merge reviews
                    const reviews = await prisma.review.findMany({
                        where: { professorSubjectId: ps.id },
                    });
                    for (const review of reviews) {
                        await prisma.review.update({
                            where: { id: review.id },
                            data: { professorSubjectId: existing.id },
                        });
                    }
                    // Delete the duplicate professorSubject
                    await prisma.professor_Subject.delete({ where: { id: ps.id } });
                }
            }
            // Delete the duplicate subject
            await prisma.subject.delete({ where: { id: subj.id } });
        } else {
            subjMap.set(name, subj.id);
        }
    }

    console.log('Duplicates removed.');
}

removeDuplicates()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
