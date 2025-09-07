import fetch from 'node-fetch';

async function checkDuplicates() {
    try {
        // Check professors
        const profRes = await fetch('http://localhost:3000/api/professors?page=1&pageSize=1000');
        const profData = await profRes.json();
        const professors = profData.data;

        const profNames = professors.map(p => p.name);
        const profDuplicates = profNames.filter((name, index) => profNames.indexOf(name) !== index);
        console.log('Professor duplicates:', [...new Set(profDuplicates)]);

        // Check subjects
        const subjRes = await fetch('http://localhost:3000/api/subjects');
        const subjData = await subjRes.json();
        const subjects = subjData.data;

        const subjNames = subjects.map(s => s.name);
        const subjDuplicates = subjNames.filter((name, index) => subjNames.indexOf(name) !== index);
        console.log('Subject duplicates:', [...new Set(subjDuplicates)]);

    } catch (error) {
        console.error('Error:', error);
    }
}

checkDuplicates();
