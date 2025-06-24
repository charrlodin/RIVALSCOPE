import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { firecrawl } from '@/lib/firecrawl';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Get sitemap information
    const sitemapInfo = await firecrawl.getSitemapInfo(url);

    if (!sitemapInfo) {
      return NextResponse.json(
        { error: 'Failed to retrieve sitemap information' },
        { status: 400 }
      );
    }

    // Calculate signal costs
    const signalCosts = {
      SINGLE_PAGE: 1,
      FULL_SITE: sitemapInfo.totalPages || 1
    };

    return NextResponse.json({
      success: true,
      sitemap: sitemapInfo,
      signalCosts,
      recommendations: {
        singlePage: {
          cost: signalCosts.SINGLE_PAGE,
          description: 'Monitor just the main page for basic changes'
        },
        fullSite: {
          cost: signalCosts.FULL_SITE,
          description: `Monitor all ${sitemapInfo.totalPages} pages for comprehensive tracking`
        }
      }
    });
  } catch (error) {
    console.error('Sitemap API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}