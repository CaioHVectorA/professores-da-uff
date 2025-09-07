import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDuplicates() {
    console.log('Checking for duplicate professors...')

    const professors = await prisma.professor.findMany({
        select: { id: true, name: true }
    })

    const nameMap = new Map<string, number[]>()

    professors.forEach(prof => {
        if (!nameMap.has(prof.name)) {
            nameMap.set(prof.name, [])
        }
        nameMap.get(prof.name)!.push(prof.id)
    })

    const profDuplicates = Array.from(nameMap.entries()).filter(([_, ids]) => ids.length > 1)

    console.log(`Found ${profDuplicates.length} duplicate professor names:`)
    profDuplicates.forEach(([name, ids]) => {
        console.log(`- ${name}: ${ids.join(', ')}`)
    })

    console.log('\nChecking for duplicate subjects per professor...')

    const subjects = await prisma.subject.findMany({
        select: { id: true, name: true, professorId: true }
    })

    const profSubjectMap = new Map<string, number[]>()

    subjects.forEach(sub => {
        const key = `${sub.professorId}-${sub.name}`
        if (!profSubjectMap.has(key)) {
            profSubjectMap.set(key, [])
        }
        profSubjectMap.get(key)!.push(sub.id)
    })

    const subDuplicates = Array.from(profSubjectMap.entries()).filter(([_, ids]) => ids.length > 1)

    console.log(`Found ${subDuplicates.length} duplicate subjects per professor:`)
    subDuplicates.forEach(([key, ids]) => {
        const [profId, name] = key.split('-')
        console.log(`- Prof ${profId}, ${name}: ${ids.join(', ')}`)
    })

    await prisma.$disconnect()
}

checkDuplicates()
