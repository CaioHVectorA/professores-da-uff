import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCourses() {
    try {
        console.log('Starting course seed...');
        const cwd = process.cwd();
        console.log('Current working directory:', cwd);

        // Load uff-courses.json
        const filePath = '/home/usuario/develop/quadro-scrap/uff-courses.json';
        console.log('Loading file from:', filePath);
        const file = await Bun.file(filePath).json();
        console.log('File loaded successfully');
        console.log('uff_courses exists:', !!file.uff_courses);
        console.log('courses exists:', !!file.uff_courses?.courses);
        console.log('total courses:', file.uff_courses?.courses?.length || 0);

        const courses = file.uff_courses.courses;
        console.log('Processing', courses.length, 'courses');

        for (const course of courses) {
            console.log('Seeding course:', course.id, course.name);
            try {

                await prisma.course.upsert({
                    where: { id: course.id },
                    update: { name: course.name },
                    create: { id: course.id, name: course.name }
                });
            } catch (error) {
                continue;
            }
        }

        console.log(`Seeded ${courses.length} courses successfully`);
    } catch (error) {
        console.error('Seed failed:', error);
        if (error instanceof Error) {
            console.error('Error stack:', error.stack);
        }
    } finally {
        await prisma.$disconnect();
    }
}

seedCourses();
