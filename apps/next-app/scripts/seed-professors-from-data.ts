import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

async function seedProfessorsFromData() {
    try {
        console.log('Starting professors seed from data...');

        // Load professors-data.json
        console.log('Loading professors data from professors-data.json...');
        const professorsData = JSON.parse(readFileSync('/home/usuario/develop/quadro-scrap/data/professors-data.json', 'utf-8'));
        console.log(`Loaded data for ${Object.keys(professorsData).length} professors.`);

        // Delete old records (assuming old means created before a certain date, but since no date, maybe delete all and recreate)
        console.log('Deleting old Professor_Subject records...');
        await prisma.professor_Subject.deleteMany({});
        console.log('Deleting old Professors...');
        await prisma.professor.deleteMany({});
        console.log('Deleting old Subjects...');
        await prisma.subject.deleteMany({});

        const professorsToCreate: { name: string }[] = [];
        const subjectsToCreate: { name: string }[] = [];
        const professorSubjectsToCreate: { professorId: number; subjectId: number; semester: string }[] = [];

        const professorMap = new Map<string, number>();
        const subjectMap = new Map<string, number>();

        // Collect unique professors and subjects
        for (const profName in professorsData) {
            if (!professorMap.has(profName)) {
                professorsToCreate.push({ name: profName });
                professorMap.set(profName, professorsToCreate.length); // temporary index
            }
            const subjects = professorsData[profName];
            subjects.forEach((item: { subject: string; Y: string }) => {
                if (!subjectMap.has(item.subject)) {
                    subjectsToCreate.push({ name: item.subject });
                    subjectMap.set(item.subject, subjectsToCreate.length); // temporary index
                }
            });
        }

        // Create all professors in one go
        console.log(`Creating ${professorsToCreate.length} professors...`);
        const createdProfessors = await prisma.professor.createManyAndReturn({
            data: professorsToCreate,
            select: { id: true, name: true }
        });

        // Update map with real IDs
        createdProfessors.forEach(prof => {
            professorMap.set(prof.name, prof.id);
        });

        // Create all subjects in one go
        console.log(`Creating ${subjectsToCreate.length} subjects...`);
        const createdSubjects = await prisma.subject.createManyAndReturn({
            data: subjectsToCreate,
            select: { id: true, name: true }
        });

        // Update map with real IDs
        createdSubjects.forEach(subj => {
            subjectMap.set(subj.name, subj.id);
        });

        // Prepare professor-subject associations
        for (const profName in professorsData) {
            const profId = professorMap.get(profName)!;
            const subjects = professorsData[profName];
            subjects.forEach((item: { subject: string; Y: string }) => {
                const subjId = subjectMap.get(item.subject)!;
                professorSubjectsToCreate.push({
                    professorId: profId,
                    subjectId: subjId,
                    semester: item.Y
                });
            });
        }

        // Create all associations in one go
        console.log(`Creating ${professorSubjectsToCreate.length} professor-subject associations...`);
        await prisma.professor_Subject.createMany({
            data: professorSubjectsToCreate
        });

        console.log('Professors seed from data completed successfully!');
    } catch (error) {
        console.error('Professors seed from data failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the seed if this file is executed directly
if (require.main === module) {
    seedProfessorsFromData();
}

export { seedProfessorsFromData };
