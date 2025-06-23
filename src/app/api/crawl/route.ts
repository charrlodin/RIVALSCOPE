import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { firecrawl } from '@/lib/firecrawl';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { competitorId } = await request.json();

    if (!competitorId) {
      return NextResponse.json(
        { error: 'Competitor ID is required' },
        { status: 400 }
      );
    }

    const competitor = await prisma.competitor.findFirst({
      where: {
        id: competitorId,
        userId: session.user.id
      }
    });

    if (!competitor) {
      return NextResponse.json(
        { error: 'Competitor not found' },
        { status: 404 }
      );
    }

    const result = await firecrawl.scrapeUrl(competitor.url);

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || 'Failed to crawl website' },
        { status: 400 }
      );
    }

    const content = result.data.content;
    const contentHash = crypto.createHash('sha256').update(content).digest('hex');

    const previousCrawl = await prisma.crawlData.findFirst({
      where: {
        competitorId: competitor.id
      },
      orderBy: {
        crawledAt: 'desc'
      }
    });

    const crawlData = await prisma.crawlData.create({
      data: {
        competitorId: competitor.id,
        url: competitor.url,
        content,
        contentHash,
        metadata: result.data.metadata || {}
      }
    });

    await prisma.competitor.update({
      where: {
        id: competitor.id
      },
      data: {
        lastCrawled: new Date()
      }
    });

    let hasChanges = false;
    if (previousCrawl && previousCrawl.contentHash !== contentHash) {
      hasChanges = true;
      
      await prisma.change.create({
        data: {
          competitorId: competitor.id,
          crawlDataId: crawlData.id,
          changeType: 'GENERAL_CHANGE',
          title: 'Content Updated',
          description: 'Website content has been modified',
          severity: 'MEDIUM'
        }
      });
    }

    return NextResponse.json({
      success: true,
      crawlData,
      hasChanges,
      contentLength: content.length
    });

  } catch (error) {
    console.error('Crawl error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}