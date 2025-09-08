import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Lista de professores para seed
const professors = [
    'João Silva',
    'Maria Santos',
    'Pedro Oliveira',
    'Ana Costa',
    'Carlos Ferreira',
    'Mariana Almeida',
    'Ricardo Pereira',
    'Beatriz Rodrigues',
    'Fernando Gomes',
    'Carla Martins',
    'Tiago Ribeiro',
    'Rosa Ines de Novais Cordeiro',
    'Luciana Gomes',
    'Roberto Carvalho',
    'Patricia Lima'
];

async function seedProfessorsSimple() {
    try {
        console.log('Starting simple professors seed...');

        let createdCount = 0;
        let skippedCount = 0;

        for (const profName of professors) {
            // Check if professor already exists
            let professor = await prisma.professor.findFirst({ where: { name: profName } });

            if (!professor) {
                professor = await prisma.professor.create({ data: { name: profName } });
                createdCount++;
                console.log(`✓ Created professor: ${profName}`);
            } else {
                skippedCount++;
                console.log(`- Skipped professor (already exists): ${profName}`);
            }
        }

        console.log(`\n📊 Seed summary:`);
        console.log(`- ✅ Created: ${createdCount} professors`);
        console.log(`- ⏭️  Skipped: ${skippedCount} professors (already exist)`);
        console.log(`- 📝 Total processed: ${professors.length} professors`);
        console.log('🎉 Simple professors seed completed successfully!');
    } catch (error) {
        console.error('❌ Simple professors seed failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the seed if this file is executed directly
if (require.main === module) {
    seedProfessorsSimple();
}

export { seedProfessorsSimple };
