import { readFileSync, writeFileSync } from 'fs';

const professorsPath = '/home/usuario/develop/quadro-scrap/professors.json';

function associateSubjectsToProfessorsWithoutSubjects() {
    console.log('Loading professors data...');
    const professorsData = JSON.parse(readFileSync(professorsPath, 'utf-8'));

    let updatedCount = 0;

    // Find professors without subjects
    for (const profName in professorsData) {
        const profData = professorsData[profName];
        if (!profData.subjects || profData.subjects.length === 0) {
            // If no subjects but has processedClasses, we could scrape or assign defaults
            // For now, assign some default subjects or skip
            console.log(`Professor ${profName} has no subjects but has ${profData.processedClasses?.length || 0} processed classes.`);
            // To associate, we would need to scrape the class URLs to get subject names
            // For this script, we'll assign placeholder subjects
            profData.subjects = ['Matéria Pendente de Associação'];
            updatedCount++;
        }
    }

    if (updatedCount > 0) {
        console.log(`Updated ${updatedCount} professors with placeholder subjects.`);
        writeFileSync(professorsPath, JSON.stringify(professorsData, null, 2));
        console.log('Updated professors.json saved.');
    } else {
        console.log('No professors found without subjects.');
    }
}

associateSubjectsToProfessorsWithoutSubjects();
