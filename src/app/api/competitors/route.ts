import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const competitors = await prisma.competitor.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        _count: {
          select: {
            changes: {
              where: {
                isRead: false
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(competitors);
  } catch (error) {
    console.error('Error fetching competitors:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { url, name, description } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    const existingCompetitor = await prisma.competitor.findFirst({
      where: {
        userId: session.user.id,
        url: url
      }
    });

    if (existingCompetitor) {
      return NextResponse.json(
        { error: 'This competitor is already being monitored' },
        { status: 400 }
      );
    }

    const competitor = await prisma.competitor.create({
      data: {
        userId: session.user.id,
        url,
        name: name || new URL(url).hostname,
        description
      }
    });

    return NextResponse.json(competitor, { status: 201 });
  } catch (error) {
    console.error('Error creating competitor:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}