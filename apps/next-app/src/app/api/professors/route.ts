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
          subjects: {
            some: {
              name: {
                contains: subject,
                mode: 'insensitive'
              }
            }
          }
        } : {})
      },
      include: {
        subjects: true,
        reviews: {
          select: {
            didaticQuality: true,
            materialQuality: true,
            examsDifficulty: true,
            personality: true
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
      const reviews = prof.reviews;
      const averages = {
        didatic: reviews.length > 0 ? reviews.reduce((sum, r) => sum + (r.didaticQuality || 0), 0) / reviews.length : 0,
        material: reviews.length > 0 ? reviews.reduce((sum, r) => sum + (r.materialQuality || 0), 0) / reviews.length : 0,
        difficulty: reviews.length > 0 ? reviews.reduce((sum, r) => sum + (r.examsDifficulty || 0), 0) / reviews.length : 0,
        personality: reviews.length > 0 ? reviews.reduce((sum, r) => sum + (r.personality || 0), 0) / reviews.length : 0
      };

      return {
        id: prof.id,
        name: prof.name,
        subjects: prof.subjects.map(s => ({ id: s.id, name: s.name })),
        reviewCount: reviews.length,
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
          subjects: {
            some: {
              name: {
                contains: subject,
                mode: 'insensitive'
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
