import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const competitors = await prisma.competitor.findMany({
      where: {
        userId: userId
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
    const { userId } = await auth();
    
    if (!userId) {
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

    // Check user's subscription limits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        subscription: true,
        _count: {
          select: {
            competitors: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const plan = user.subscription?.plan || 'FREE';
    const currentCount = user._count.competitors;
    
    const limits = {
      FREE: 1,
      STARTER: 5,
      PRO: 20
    };

    if (currentCount >= limits[plan as keyof typeof limits]) {
      return NextResponse.json(
        { error: `Plan limit reached. ${plan} plan allows ${limits[plan as keyof typeof limits]} competitors.` },
        { status: 403 }
      );
    }

    const existingCompetitor = await prisma.competitor.findFirst({
      where: {
        userId: userId,
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
        userId: userId,
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