import { readFileSync, writeFileSync } from 'fs';

const professorsPath = '/home/usuario/develop/quadro-scrap/professors.json';

function cleanDuplicateSubjects() {
    console.log('Loading professors data...');
    const professorsData = JSON.parse(readFileSync(professorsPath, 'utf-8'));

    let cleanedCount = 0;

    for (const profName in professorsData) {
        const profData = professorsData[profName];
        if (profData.subjects && Array.isArray(profData.subjects)) {
            const uniqueSubjects = [...new Set(profData.subjects)];
            if (uniqueSubjects.length !== profData.subjects.length) {
                profData.subjects = uniqueSubjects;
                cleanedCount++;
                console.log(`Cleaned duplicates for ${profName}: ${profData.subjects.length} unique subjects.`);
            }
        }
    }

    if (cleanedCount > 0) {
        console.log(`Cleaned duplicates for ${cleanedCount} professors.`);
        writeFileSync(professorsPath, JSON.stringify(professorsData, null, 2));
        console.log('Updated professors.json saved.');
    } else {
        console.log('No duplicate subjects found.');
    }
}

cleanDuplicateSubjects();
