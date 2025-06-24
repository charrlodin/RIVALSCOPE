import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST(
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

    // Toggle the isActive status
    const updatedCompetitor = await prisma.competitor.update({
      where: {
        id: id
      },
      data: {
        isActive: !competitor.isActive
      },
      include: {
        _count: {
          select: {
            changes: true,
            crawlData: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      competitor: updatedCompetitor,
      action: updatedCompetitor.isActive ? 'resumed' : 'paused'
    });
  } catch (error) {
    console.error('Error toggling competitor status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}