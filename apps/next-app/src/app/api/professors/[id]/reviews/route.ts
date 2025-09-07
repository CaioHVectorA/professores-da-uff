import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getUserFromSession } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const professorId = parseInt(params.id)
    const user = await getUserFromSession(request)

    const reviews = await prisma.review.findMany({
      where: { professorId },
      include: {
        subject: true,
        user: true
      },
      orderBy: { createdAt: 'desc' }
    })

    const transformedReviews = reviews.map(review => ({
      id: review.id,
      review: review.review,
      created_at: review.createdAt.toISOString(),
      didatic_quality: review.didaticQuality,
      material_quality: review.materialQuality,
      exams_difficulty: review.examsDifficulty,
      personality: review.personality,
      requires_presence: review.requiresPresence,
      exam_method: review.examMethod,
      anonymous: review.anonymous,
      subject_name: review.subject.name,
      user_id: (user && review.userId === user.id) ? review.userId : null,
      user_name: review.user ? review.user.email?.split('@')[0] : null
    }))

    return NextResponse.json({
      data: transformedReviews,
      professor_id: professorId,
      total: transformedReviews.length
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const professorId = parseInt(params.id)
    const user = await getUserFromSession(request)
    const body = await request.json()

    const {
      subjectId,
      review,
      didaticQuality,
      materialQuality,
      examsDifficulty,
      personality,
      requiresPresence,
      examMethod,
      anonymous = false
    } = body

    if (!anonymous && !user) {
      return NextResponse.json({ error: 'Authentication required for non-anonymous reviews' }, { status: 401 })
    }

    // Check if user already reviewed this professor (only for non-anonymous)
    if (!anonymous && user) {
      const existingReview = await prisma.review.findFirst({
        where: {
          professorId,
          userId: user.id,
          anonymous: false
        }
      })

      if (existingReview) {
        return NextResponse.json({ error: 'You have already reviewed this professor' }, { status: 400 })
      }
    }

    const newReview = await prisma.review.create({
      data: {
        professorId,
        subjectId,
        userId: (!anonymous && user) ? user.id : null,
        review,
        didaticQuality,
        materialQuality,
        examsDifficulty,
        personality,
        requiresPresence,
        examMethod,
        anonymous
      },
      include: {
        subject: true
      }
    })

    return NextResponse.json({
      data: {
        id: newReview.id,
        review: newReview.review,
        created_at: newReview.createdAt.toISOString(),
        didatic_quality: newReview.didaticQuality,
        material_quality: newReview.materialQuality,
        exams_difficulty: newReview.examsDifficulty,
        personality: newReview.personality,
        requires_presence: newReview.requiresPresence,
        exam_method: newReview.examMethod,
        anonymous: newReview.anonymous,
        subject_name: newReview.subject.name
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
