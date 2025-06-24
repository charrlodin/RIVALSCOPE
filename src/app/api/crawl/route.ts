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

    // Get user's signal balance
    const user = await prisma.user.findFirst({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate signal cost based on monitoring type
    let signalCost = 1; // Default for SINGLE_PAGE
    let urlsToCheck: string[] = [competitor.url];
    
    if (competitor.monitoringType === 'SECTION') {
      // Get sitemap info to calculate actual cost
      const sitemapInfo = await firecrawl.getSitemapInfo(competitor.url);
      signalCost = sitemapInfo?.totalPages || 10; // Fallback to 10 if sitemap unavailable
    } else if (competitor.monitoringType === 'SMART') {
      // Use smart tracking to determine URLs and cost
      const { smartTracking } = await import('@/lib/smart-tracking');
      const smartResult = await smartTracking.getSmartCrawlUrls({ 
        competitorId: competitor.id 
      });
      urlsToCheck = smartResult.urlsToCheck;
      signalCost = smartResult.estimatedSignals;
      
      console.log(`Smart tracking will check ${urlsToCheck.length} URLs: ${smartResult.reason}`);
    }
    
    if (user.signalsBalance < signalCost) {
      return NextResponse.json(
        { error: `Insufficient signals. Need ${signalCost} signals but only have ${user.signalsBalance}.` },
        { status: 400 }
      );
    }

    // Create crawl log to track this attempt
    const crawlLog = await prisma.crawlLog.create({
      data: {
        competitorId: competitor.id,
        status: 'IN_PROGRESS',
        signalsUsed: signalCost,
        startedAt: new Date()
      }
    });

    let result;
    let totalChanges = 0;
    
    try {
      // Use appropriate scraping method based on monitoring type
      if (competitor.monitoringType === 'SMART') {
        // Crawl specific URLs determined by smart tracking
        const crawlResults = await firecrawl.crawlSpecificUrls(urlsToCheck);
        
        // Process each URL result
        for (const urlResult of crawlResults) {
          if (urlResult.result.success && urlResult.result.data) {
            const content = urlResult.result.data.markdown;
            const contentHash = crypto.createHash('sha256').update(content).digest('hex');
            const metadata = urlResult.result.data.metadata || {};

            // Create crawl data entry for each URL
            const crawlData = await prisma.crawlData.create({
              data: {
                competitorId: competitor.id,
                url: urlResult.url,
                content,
                contentHash,
                metadata
              }
            });

            // Detect changes for this URL
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
              totalChanges += detectedChanges.length;
            }

            // Update sitemap URL record
            await prisma.sitemapUrl.updateMany({
              where: {
                competitorId: competitor.id,
                url: urlResult.url
              },
              data: {
                lastCrawled: new Date(),
                contentHash: contentHash
              }
            });
          }
        }

        // Create a combined result for compatibility
        result = {
          success: crawlResults.some(r => r.result.success),
          data: crawlResults.find(r => r.result.success)?.result.data || null,
          error: crawlResults.every(r => !r.result.success) ? 'All URLs failed to crawl' : undefined
        };
        
      } else if (competitor.monitoringType === 'SECTION') {
        result = await firecrawl.crawlWebsite(competitor.url, 5);
      } else {
        result = await firecrawl.scrapeUrl(competitor.url);
      }
    } catch (error) {
      // Update crawl log with failure
      await prisma.crawlLog.update({
        where: { id: crawlLog.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      // Update competitor crawl attempts
      await prisma.competitor.update({
        where: { id: competitor.id },
        data: {
          crawlAttempts: { increment: 1 }
        }
      });

      throw error;
    }

    if (!result.success || !result.data) {
      // Update crawl log with failure
      await prisma.crawlLog.update({
        where: { id: crawlLog.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          errorMessage: result.error || 'Failed to crawl website'
        }
      });

      // Update competitor crawl attempts
      await prisma.competitor.update({
        where: { id: competitor.id },
        data: {
          crawlAttempts: { increment: 1 }
        }
      });

      return NextResponse.json(
        { error: result.error || 'Failed to crawl website' },
        { status: 400 }
      );
    }

    // For non-SMART monitoring, process the single result
    let detectedChanges: any[] = [];
    let crawlData: any = null;
    
    if (competitor.monitoringType !== 'SMART') {
      const content = result.data.markdown;
      const contentHash = crypto.createHash('sha256').update(content).digest('hex');
      const metadata = result.data.metadata || {};

      // Create new crawl data entry
      crawlData = await prisma.crawlData.create({
        data: {
          competitorId: competitor.id,
          url: competitor.url,
          content,
          contentHash,
          metadata
        }
      });

      // Detect and process changes
      detectedChanges = await changeDetector.detectChanges(
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
    } else {
      // For SMART monitoring, use the totalChanges already calculated
      detectedChanges = Array(totalChanges).fill({}); // Placeholder array for count
    }

    // Update crawl log with success
    await prisma.crawlLog.update({
      where: { id: crawlLog.id },
      data: {
        status: 'SUCCESS',
        completedAt: new Date(),
        pagesFound: competitor.monitoringType === 'SMART' ? urlsToCheck.length : 
                   competitor.monitoringType === 'SECTION' ? 5 : 1,
        changesFound: competitor.monitoringType === 'SMART' ? totalChanges : detectedChanges.length
      }
    });

    // Deduct signals from user balance
    await prisma.user.update({
      where: { id: userId },
      data: {
        signalsBalance: { decrement: signalCost }
      }
    });

    // Record signal transaction
    await prisma.signalTransaction.create({
      data: {
        userId: userId,
        competitorId: competitor.id,
        type: competitor.monitoringType,
        signalsUsed: signalCost,
        description: `Crawled ${competitor.name || competitor.url}`
      }
    });

    // Update competitor stats
    await prisma.competitor.update({
      where: { id: competitor.id },
      data: {
        lastCrawled: new Date(),
        lastSuccessfulCrawl: new Date(),
        crawlAttempts: { increment: 1 },
        successfulCrawls: { increment: 1 }
      }
    });

    return NextResponse.json({
      success: true,
      crawlData: crawlData ? {
        id: crawlData.id,
        contentLength: crawlData ? result.data?.markdown?.length || 0 : 0,
        crawledAt: crawlData.crawledAt
      } : {
        id: 'smart_crawl',
        contentLength: urlsToCheck.length,
        crawledAt: new Date()
      },
      changesDetected: competitor.monitoringType === 'SMART' ? totalChanges : detectedChanges.length,
      changes: competitor.monitoringType === 'SMART' ? `Found changes across ${totalChanges} URLs` : detectedChanges,
      urlsChecked: competitor.monitoringType === 'SMART' ? urlsToCheck.length : 1,
      signalsUsed: signalCost,
      signalsRemaining: user.signalsBalance - signalCost
    });

  } catch (error) {
    console.error('Crawl error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}