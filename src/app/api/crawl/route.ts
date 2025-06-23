import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { firecrawl } from '@/lib/firecrawl';
import { changeDetector } from '@/lib/change-detector';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
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
        userId: userId
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

    const content = result.data.markdown;
    const contentHash = crypto.createHash('sha256').update(content).digest('hex');
    const metadata = result.data.metadata || {};

    // Create new crawl data entry
    const crawlData = await prisma.crawlData.create({
      data: {
        competitorId: competitor.id,
        url: competitor.url,
        content,
        contentHash,
        metadata
      }
    });

    // Update competitor last crawled time
    await prisma.competitor.update({
      where: {
        id: competitor.id
      },
      data: {
        lastCrawled: new Date()
      }
    });

    // Detect and process changes
    const detectedChanges = await changeDetector.detectChanges(
      competitor.id,
      content,
      contentHash,
      metadata
    );

    // Save detected changes
    if (detectedChanges.length > 0) {
      await changeDetector.saveChanges(
        competitor.id,
        crawlData.id,
        detectedChanges
      );
    }

    return NextResponse.json({
      success: true,
      crawlData: {
        id: crawlData.id,
        contentLength: content.length,
        crawledAt: crawlData.crawledAt
      },
      changesDetected: detectedChanges.length,
      changes: detectedChanges
    });

  } catch (error) {
    console.error('Crawl error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}