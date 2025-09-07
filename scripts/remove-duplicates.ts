import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function removeDuplicateProfessors() {
    console.log('Finding duplicate professors...')

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

    const duplicates = Array.from(nameMap.entries()).filter(([_, ids]) => ids.length > 1)

    console.log(`Found ${duplicates.length} duplicate professor names`)

    for (const [name, ids] of duplicates) {
        const [keepId, ...removeIds] = ids
        console.log(`Keeping professor ${keepId} (${name}), removing ${removeIds.join(', ')}`)

        // Move reviews to the kept professor
        for (const removeId of removeIds) {
            await prisma.review.updateMany({
                where: { professorId: removeId },
                data: { professorId: keepId }
            })
        }

        // Remove duplicate professors
        await prisma.professor.deleteMany({
            where: { id: { in: removeIds } }
        })
    }

    console.log('Duplicate professors removed')
}

async function removeDuplicateSubjects() {
    console.log('Finding duplicate subjects...')

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

    const duplicates = Array.from(profSubjectMap.entries()).filter(([_, ids]) => ids.length > 1)

    console.log(`Found ${duplicates.length} duplicate subjects per professor`)

    for (const [key, ids] of duplicates) {
        const [keepId, ...removeIds] = ids
        const [profId, name] = key.split('-')
        console.log(`Keeping subject ${keepId} (${name} for prof ${profId}), removing ${removeIds.join(', ')}`)

        // Move reviews to the kept subject
        for (const removeId of removeIds) {
            await prisma.review.updateMany({
                where: { subjectId: removeId },
                data: { subjectId: keepId }
            })
        }

        // Remove duplicate subjects
        await prisma.subject.deleteMany({
            where: { id: { in: removeIds } }
        })
    }

    console.log('Duplicate subjects removed')
}

async function main() {
    try {
        await removeDuplicateProfessors()
        await removeDuplicateSubjects()
        console.log('Cleanup completed')
    } catch (error) {
        console.error('Error during cleanup:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
