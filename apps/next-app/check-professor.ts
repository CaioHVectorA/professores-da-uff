import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProfessors() {
    console.log('Starting check...');
    try {
        console.log('Connecting to database...');
        const count = await prisma.professor.count();
        console.log('Total professors:', count);

        if (count > 0) {
            const professors = await prisma.professor.findMany({ take: 5 });
            console.log('First 5 professors:', professors.map(p => ({ id: p.id, name: p.name })));
        }

        const professor = await prisma.professor.findUnique({
            where: { id: 1468 }
        });

        console.log('Professor 1468:', professor);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        console.log('Disconnecting...');
        await prisma.$disconnect();
    }
}

checkProfessors();
