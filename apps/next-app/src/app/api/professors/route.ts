import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getUserFromSession } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url, 'http://localhost:3000');
    const searchParams = url.searchParams;
    const q = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // Optional: Check if user is authenticated for personalized results
    const user = await getUserFromSession(request)

    // Fetch professors with subjects
    const professors = await prisma.professor.findMany({
      where: q ? {
        name: {
          contains: q,
          mode: 'insensitive'
        }
      } : {},
      include: {
        subjects: true,
        _count: {
          select: { reviews: true }
        }
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: {
        name: 'asc'
      }
    });

    // Transform data to match the expected format
    const transformedProfessors = professors.map(prof => ({
      id: prof.id,
      name: prof.name,
      subjects: prof.subjects.map(s => s.name),
      reviewCount: prof._count.reviews
    }));

    const total = await prisma.professor.count({
      where: q ? {
        name: {
          contains: q,
          mode: 'insensitive'
        }
      } : {}
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
