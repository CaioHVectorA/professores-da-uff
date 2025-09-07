import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getUserFromSession } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url, 'http://localhost:3000');
    const searchParams = url.searchParams;
    const q = searchParams.get('q') || '';
    const subject = searchParams.get('subject') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // Optional: Check if user is authenticated for personalized results
    const user = await getUserFromSession(request)

    // Fetch professors with subjects and averages
    const professors = await prisma.professor.findMany({
      where: {
        ...(q ? {
          name: {
            contains: q,
            mode: 'insensitive'
          }
        } : {}),
        ...(subject ? {
          professorSubjects: {
            some: {
              subject: {
                name: {
                  contains: subject,
                  mode: 'insensitive'
                }
              }
            }
          }
        } : {})
      },
      include: {
        professorSubjects: {
          include: {
            subject: true,
            reviews: {
              select: {
                didaticQuality: true,
                materialQuality: true,
                examsDifficulty: true,
                personality: true
              }
            }
          }
        }
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: {
        name: 'asc'
      }
    });

    // Transform data to match the expected format
    const transformedProfessors = professors.map(prof => {
      const allReviews = prof.professorSubjects.flatMap(ps => ps.reviews);
      const averages = {
        didatic: allReviews.length > 0 ? allReviews.reduce((sum, r) => sum + (r.didaticQuality || 0), 0) / allReviews.length : 0,
        material: allReviews.length > 0 ? allReviews.reduce((sum, r) => sum + (r.materialQuality || 0), 0) / allReviews.length : 0,
        difficulty: allReviews.length > 0 ? allReviews.reduce((sum, r) => sum + (r.examsDifficulty || 0), 0) / allReviews.length : 0,
        personality: allReviews.length > 0 ? allReviews.reduce((sum, r) => sum + (r.personality || 0), 0) / allReviews.length : 0
      };

      const subjects = prof.professorSubjects.map(ps => ({ id: ps.subject.id, name: ps.subject.name }));

      return {
        id: prof.id,
        name: prof.name,
        subjects,
        reviewCount: allReviews.length,
        averages
      };
    });

    const total = await prisma.professor.count({
      where: {
        ...(q ? {
          name: {
            contains: q,
            mode: 'insensitive'
          }
        } : {}),
        ...(subject ? {
          professorSubjects: {
            some: {
              subject: {
                name: {
                  contains: subject,
                  mode: 'insensitive'
                }
              }
            }
          }
        } : {})
      }
    });

    return NextResponse.json({
      data: transformedProfessors,
      page,
      pageSize,
      total
    });
  } catch (error) {
    console.error('Error fetching professors:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
