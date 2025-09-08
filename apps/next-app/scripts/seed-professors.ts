import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

async function seedProfessors() {
    try {
        console.log('Starting professors seed...');

        // Load professors.json
        console.log('Loading professors data from professors.json...');
        const professorsData = JSON.parse(readFileSync('/home/usuario/develop/quadro-scrap/professors.json', 'utf-8'));
        console.log(`Loaded data for ${Object.keys(professorsData).length} professors.`);

        const professorMap = new Map<string, number>();
        const subjectMap = new Map<string, number>();
        let createdProfessors = 0;
        let skippedProfessors = 0;
        let foundSubjects = 0;
        let missingSubjects = 0;
        let createdAssociations = 0;
        let skippedAssociations = 0;

        // First, collect all unique subjects from professors data
        const allSubjects = new Set<string>();
        for (const profName in professorsData) {
            const profData = professorsData[profName];
            if (profData.subjects && Array.isArray(profData.subjects)) {
                profData.subjects.forEach((subject: string) => allSubjects.add(subject));
            }
        }
        console.log(`Collected ${allSubjects.size} unique subjects from professors data.`);

        // Find existing subjects (assuming all subjects already exist)
        console.log('Finding existing subjects...');
        // for (const subjectName of allSubjects) {
        //     const subject = await prisma.subject.findFirst({ where: { name: subjectName } });
        //     if (subject) {
        //         subjectMap.set(subjectName, subject.id);
        //         foundSubjects++;
        //         console.log(`Found subject: ${subjectName} (ID: ${subject.id})`);
        //     } else {
        //         missingSubjects++;
        //         console.warn(`Subject not found: ${subjectName}`);
        //     }
        // }
        // console.log(`Found ${foundSubjects} subjects, ${missingSubjects} missing.`);

        // Create professors and associations
        console.log('Processing professors...');
        for (const profName in professorsData) {
            console.log(`Processing professor: ${profName}`);

            // Check if professor already exists
            let professor = await prisma.professor.findFirst({ where: { name: profName } });

            if (!professor) {
                professor = await prisma.professor.create({ data: { name: profName } });
                createdProfessors++;
                console.log(`✓ Created professor: ${profName} (ID: ${professor.id})`);
            } else {
                skippedProfessors++;
                console.log(`- Professor already exists: ${profName} (ID: ${professor.id})`);
            }

            professorMap.set(profName, professor.id);

            // Create associations with subjects
            const profData = professorsData[profName];
            if (profData.subjects && Array.isArray(profData.subjects)) {
                console.log(`  Processing ${profData.subjects.length} subjects for ${profName}...`);
                for (const subjectName of profData.subjects) {
                    const subjectId = subjectMap.get(subjectName);
                    if (subjectId) {
                        // Check if association already exists
                        const existingAssoc = await prisma.professor_Subject.findUnique({
                            where: {
                                professorId_subjectId: {
                                    professorId: professor.id,
                                    subjectId: subjectId
                                }
                            }
                        });

                        if (!existingAssoc) {
                            await prisma.professor_Subject.create({
                                data: {
                                    professorId: professor.id,
                                    subjectId: subjectId
                                }
                            });
                            createdAssociations++;
                            console.log(`  ✓ Associated ${profName} with ${subjectName}`);
                        } else {
                            skippedAssociations++;
                            console.log(`  - Association already exists: ${profName} - ${subjectName}`);
                        }
                    } else {
                        console.warn(`  ⚠ Skipping association for missing subject: ${subjectName}`);
                    }
                }
            } else {
                console.log(`  No subjects for ${profName}`);
            }
        }

        console.log('\n=== SEED SUMMARY ===');
        console.log(`- Created: ${createdProfessors} professors`);
        console.log(`- Skipped: ${skippedProfessors} professors (already exist)`);
        console.log(`- Found: ${foundSubjects} subjects`);
        console.log(`- Missing: ${missingSubjects} subjects`);
        console.log(`- Created: ${createdAssociations} professor-subject associations`);
        console.log(`- Skipped: ${skippedAssociations} associations (already exist)`);
        console.log(`- Total processed: ${Object.keys(professorsData).length} professors`);
        console.log('Professors seed completed successfully!');
    } catch (error) {
        console.error('Professors seed failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the seed if this file is executed directly
if (require.main === module) {
    seedProfessors();
}

export { seedProfessors };
