import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

async function seed() {
    try {
        console.log('Starting seed...');

        // Load professors.json
        const professorsData = JSON.parse(readFileSync('/home/usuario/develop/quadro-scrap/professors.json', 'utf-8'));

        const subjectMap = new Map<string, number>();
        const professorMap = new Map<string, number>();

        // First, create all unique subjects
        const allSubjects = new Set<string>();
        for (const profName in professorsData) {
            const profData = professorsData[profName];
            profData.subjects.forEach((subj: string) => allSubjects.add(subj));
        }

        for (const subjName of allSubjects) {
            let subject = await prisma.subject.findFirst({ where: { name: subjName } });
            if (!subject) {
                subject = await prisma.subject.create({ data: { name: subjName } });
            }
            subjectMap.set(subjName, subject.id);
        }

        console.log(`Processed ${allSubjects.size} subjects`);

        // Then, create professors and link to subjects
        for (const profName in professorsData) {
            const profData = professorsData[profName];

            let professor = await prisma.professor.findFirst({ where: { name: profName } });
            if (!professor) {
                professor = await prisma.professor.create({ data: { name: profName } });
            }
            professorMap.set(profName, professor.id);

            // Create Professor_Subject links
            for (const subjName of profData.subjects) {
                const subjId = subjectMap.get(subjName);
                if (subjId) {
                    const existing = await prisma.professor_Subject.findUnique({
                        where: {
                            professorId_subjectId: {
                                professorId: professor.id,
                                subjectId: subjId
                            }
                        }
                    });
                    if (!existing) {
                        await prisma.professor_Subject.create({
                            data: {
                                professorId: professor.id,
                                subjectId: subjId
                            }
                        });
                    }
                }
            }
        }

        console.log(`Created ${Object.keys(professorsData).length} professors`);
        console.log('Seed completed');
    } catch (error) {
        console.error('Seed failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seed();
