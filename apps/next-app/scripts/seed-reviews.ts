import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedReviews() {
  console.log('Starting to seed reviews...')

  // Get all professors
  const professors = await prisma.professor.findMany({
    include: {
      professorSubjects: {
        include: {
          subject: true
        }
      }
    }
  })

  console.log(`Found ${professors.length} professors`)

  for (const professor of professors) {
    if (professor.professorSubjects.length === 0) {
      console.log(`Professor ${professor.name} has no subjects, skipping`)
      continue
    }

    // Generate 8 reviews per professor
    for (let i = 0; i < 8; i++) {
      // Random subject
      const randomSubject = professor.professorSubjects[Math.floor(Math.random() * professor.professorSubjects.length)]

      // Random ratings (1-5)
      const didatic = Math.floor(Math.random() * 5) + 1
      const material = Math.floor(Math.random() * 5) + 1
      const difficulty = Math.floor(Math.random() * 5) + 1
      const personality = Math.floor(Math.random() * 5) + 1

      // Random review text
      const reviews = [
        'Excelente professor, explica muito bem os conceitos.',
        'Muito bom, mas as provas são difíceis.',
        'Professor dedicado, mas o material poderia ser melhor.',
        'Aulas interessantes, aprendi bastante.',
        'Bom professor, mas falta organização nas aulas.',
        'Muito exigente, mas justo.',
        'Professor nota 10, super recomendo.',
        'Aulas um pouco monótonas, mas conteúdo bom.',
        'Professor paciente e esclarecedor.',
        'Bom, mas poderia dar mais exemplos práticos.'
      ]
      const review = reviews[Math.floor(Math.random() * reviews.length)]

      // Random user (assume users 1-100 exist)
      const userId = Math.floor(Math.random() * 100) + 1

      // Random anonymous
      const anonymous = Math.random() > 0.5

      try {
        await prisma.review.create({
          data: {
            professorSubjectId: randomSubject.id,
            userId: userId,
            review: review,
            didaticQuality: didatic,
            materialQuality: material,
            examsDifficulty: difficulty,
            personality: personality,
            anonymous: anonymous,
            createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000) // Random date in last year
          }
        })
      } catch (error) {
        console.error(`Error creating review for professor ${professor.name}:`, error)
      }
    }

    console.log(`Seeded 8 reviews for professor ${professor.name}`)
  }

  console.log('Finished seeding reviews')
}

seedReviews()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
