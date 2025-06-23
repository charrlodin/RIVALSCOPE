import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify the competitor belongs to the user
    const competitor = await prisma.competitor.findFirst({
      where: {
        id: id,
        userId: userId
      }
    });

    if (!competitor) {
      return NextResponse.json(
        { error: 'Competitor not found' },
        { status: 404 }
      );
    }

    // Fetch changes for this competitor
    const changes = await prisma.change.findMany({
      where: {
        competitorId: id
      },
      orderBy: {
        detectedAt: 'desc'
      }
    });

    return NextResponse.json(changes);
  } catch (error) {
    console.error('Error fetching competitor changes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;
    const { markAllRead } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify the competitor belongs to the user
    const competitor = await prisma.competitor.findFirst({
      where: {
        id: id,
        userId: userId
      }
    });

    if (!competitor) {
      return NextResponse.json(
        { error: 'Competitor not found' },
        { status: 404 }
      );
    }

    if (markAllRead) {
      // Mark all changes as read
      await prisma.change.updateMany({
        where: {
          competitorId: id,
          isRead: false
        },
        data: {
          isRead: true
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating competitor changes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}