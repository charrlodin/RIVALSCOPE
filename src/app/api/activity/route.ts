import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get recent changes and crawl logs for this user
    const recentChanges = await prisma.change.findMany({
      where: {
        competitor: {
          userId: userId
        }
      },
      include: {
        competitor: {
          select: {
            name: true,
            url: true
          }
        }
      },
      orderBy: {
        detectedAt: 'desc'
      },
      take: 10
    });

    const recentCrawls = await prisma.crawlLog.findMany({
      where: {
        competitor: {
          userId: userId
        }
      },
      include: {
        competitor: {
          select: {
            name: true,
            url: true
          }
        }
      },
      orderBy: {
        startedAt: 'desc'
      },
      take: 10
    });

    // Combine and sort by timestamp
    const activity = [
      ...recentChanges.map(change => ({
        id: change.id,
        type: 'CHANGE',
        changeType: change.changeType,
        title: change.title,
        description: change.description,
        competitor: change.competitor.name || new URL(change.competitor.url).hostname,
        competitorUrl: change.competitor.url,
        severity: change.severity.toLowerCase(),
        time: change.detectedAt,
        oldValue: change.oldValue,
        newValue: change.newValue
      })),
      ...recentCrawls.map(crawl => ({
        id: crawl.id,
        type: 'CRAWL',
        title: crawl.status === 'SUCCESS' ? 'CRAWL COMPLETED' : 'CRAWL FAILED',
        description: crawl.status === 'SUCCESS' 
          ? `Successfully crawled ${crawl.pagesFound || 1} page(s), found ${crawl.changesFound} changes`
          : `Crawl failed: ${crawl.errorMessage || 'Unknown error'}`,
        competitor: crawl.competitor.name || new URL(crawl.competitor.url).hostname,
        competitorUrl: crawl.competitor.url,
        severity: crawl.status === 'SUCCESS' ? 'low' : 'high',
        time: crawl.startedAt,
        status: crawl.status,
        signalsUsed: crawl.signalsUsed,
        changesFound: crawl.changesFound
      }))
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    return NextResponse.json(activity.slice(0, 15));
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}