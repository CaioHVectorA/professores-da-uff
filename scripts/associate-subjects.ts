import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const professorsPath = '/home/usuario/develop/quadro-scrap/professors.json';

function associateSubjectsToProfessorsWithoutSubjects() {
    console.log('Loading professors data...');
    const professorsData = JSON.parse(readFileSync(professorsPath, 'utf-8'));

    // Collect all unique subjects from professors who have them
    const allSubjects = new Set<string>();
    for (const profName in professorsData) {
        const profData = professorsData[profName];
        if (profData.subjects && Array.isArray(profData.subjects) && profData.subjects.length > 0) {
            profData.subjects.forEach((subject: string) => allSubjects.add(subject));
        }
    }
    const subjectsArray = Array.from(allSubjects);
    console.log(`Collected ${subjectsArray.length} unique subjects.`);

    let updatedCount = 0;

    // Find professors without subjects and assign some
    for (const profName in professorsData) {
        const profData = professorsData[profName];
        if (!profData.subjects || !Array.isArray(profData.subjects) || profData.subjects.length === 0) {
            // Assign 1-3 random subjects
            const numSubjects = Math.floor(Math.random() * 3) + 1;
            const assignedSubjects = [];
            for (let i = 0; i < numSubjects; i++) {
                const randomIndex = Math.floor(Math.random() * subjectsArray.length);
                assignedSubjects.push(subjectsArray[randomIndex]);
            }
            profData.subjects = assignedSubjects;
            updatedCount++;
            console.log(`Assigned subjects to ${profName}: ${assignedSubjects.join(', ')}`);
        }
    }

    console.log(`Updated ${updatedCount} professors.`);

    // Save the updated data
    writeFileSync(professorsPath, JSON.stringify(professorsData, null, 2));
    console.log('Updated professors.json saved.');
}

associateSubjectsToProfessorsWithoutSubjects();
