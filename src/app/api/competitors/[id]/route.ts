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

    const competitor = await prisma.competitor.findFirst({
      where: {
        id: id,
        userId: userId
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

    if (!competitor) {
      return NextResponse.json(
        { error: 'Competitor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(competitor);
  } catch (error) {
    console.error('Error fetching competitor:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const { name, description, isActive } = await request.json();

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

    const updatedCompetitor = await prisma.competitor.update({
      where: {
        id: id
      },
      data: {
        name,
        description,
        isActive
      }
    });

    return NextResponse.json(updatedCompetitor);
  } catch (error) {
    console.error('Error updating competitor:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Delete all related data (cascade delete)
    await prisma.$transaction([
      // Delete changes first
      prisma.change.deleteMany({
        where: { competitorId: id }
      }),
      // Delete crawl data
      prisma.crawlData.deleteMany({
        where: { competitorId: id }
      }),
      // Finally delete the competitor
      prisma.competitor.delete({
        where: { id: id }
      })
    ]);

    return NextResponse.json({ 
      success: true, 
      message: 'Competitor deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting competitor:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}