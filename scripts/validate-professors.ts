import { readFileSync } from 'fs';

const professorsPath = '/home/usuario/develop/quadro-scrap/professors.json';

function validateProfessorsData() {
    console.log('Loading professors data...');
    const professorsData = JSON.parse(readFileSync(professorsPath, 'utf-8'));

    let totalProfessors = 0;
    let professorsWithSubjects = 0;
    let professorsWithProcessedClasses = 0;
    let totalSubjects = 0;
    let totalProcessedClasses = 0;

    for (const profName in professorsData) {
        totalProfessors++;
        const profData = professorsData[profName];

        if (profData.subjects && Array.isArray(profData.subjects) && profData.subjects.length > 0) {
            professorsWithSubjects++;
            totalSubjects += profData.subjects.length;
        }

        if (profData.processedClasses && Array.isArray(profData.processedClasses) && profData.processedClasses.length > 0) {
            professorsWithProcessedClasses++;
            totalProcessedClasses += profData.processedClasses.length;
        }
    }

    console.log(`Total professors: ${totalProfessors}`);
    console.log(`Professors with subjects: ${professorsWithSubjects}`);
    console.log(`Professors with processed classes: ${professorsWithProcessedClasses}`);
    console.log(`Total subjects: ${totalSubjects}`);
    console.log(`Total processed classes: ${totalProcessedClasses}`);

    if (professorsWithSubjects === totalProfessors) {
        console.log('✅ All professors have subjects.');
    } else {
        console.log('⚠️  Some professors are missing subjects.');
    }

    if (professorsWithProcessedClasses === totalProfessors) {
        console.log('✅ All professors have processed classes.');
    } else {
        console.log('⚠️  Some professors are missing processed classes.');
    }
}

validateProfessorsData();
