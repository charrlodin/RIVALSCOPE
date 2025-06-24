import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { aiSmartCrawl } from '@/lib/openai';
import { smartTracking } from '@/lib/smart-tracking';
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

    const { url, userPrompt, maxSignals = 8 } = await request.json();

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

    // Get sitemap content using consistent method
    let sitemapEntries;
    let totalUrlsFromFirecrawl = 0;
    
    try {
      // First try to get total count from firecrawl (consistent with /api/sitemap)
      const firecrawlSitemap = await firecrawl.getSitemapInfo(url);
      totalUrlsFromFirecrawl = firecrawlSitemap?.totalPages || 0;
    } catch (error) {
      console.log('Firecrawl sitemap failed, using custom parser');
    }
    
    // Get detailed sitemap entries for AI analysis
    sitemapEntries = await smartTracking.parseSitemap(url);
    
    if (sitemapEntries.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No sitemap found or website not accessible'
      });
    }
    
    // Use firecrawl count if available, otherwise use parsed entries count
    const actualTotalUrls = totalUrlsFromFirecrawl || sitemapEntries.length;

    // Convert sitemap entries to XML format for AI
    const sitemapXml = generateSitemapXml(sitemapEntries);

    let aiResult;
    
    if (userPrompt && userPrompt.trim()) {
      // System 2: User-driven smart crawl
      aiResult = await aiSmartCrawl.matchUserIntentToPages(
        userPrompt.trim(),
        sitemapXml,
        url,
        maxSignals
      );
      
      return NextResponse.json({
        success: true,
        type: 'user_intent',
        userPrompt,
        matched_pages: aiResult.matched_pages,
        estimated_signals: aiResult.estimated_signals,
        interpretation: aiResult.interpretation,
        total_urls_in_sitemap: actualTotalUrls,
        recommendation: `AI found ${aiResult.matched_pages.length} pages matching your request: "${userPrompt}"`
      });
      
    } else {
      // System 1: AI-led smart crawl analysis
      aiResult = await aiSmartCrawl.analyzeWebsiteForSmartCrawl(
        sitemapXml,
        url,
        maxSignals
      );
      
      return NextResponse.json({
        success: true,
        type: 'ai_analysis',
        priority_pages: aiResult.priority_pages,
        estimated_signals: aiResult.estimated_signals,
        analysis_summary: aiResult.analysis_summary,
        total_urls_in_sitemap: actualTotalUrls,
        recommendation: `AI selected ${aiResult.priority_pages.length} high-value pages for competitive monitoring`
      });
    }

  } catch (error) {
    console.error('AI smart crawl API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze website with AI' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to generate XML sitemap format for AI
 */
function generateSitemapXml(sitemapEntries: any[]): string {
  const xmlEntries = sitemapEntries.map(entry => {
    let xml = `  <url>\n    <loc>${entry.url}</loc>`;
    if (entry.lastmod) {
      xml += `\n    <lastmod>${entry.lastmod}</lastmod>`;
    }
    if (entry.priority !== undefined) {
      xml += `\n    <priority>${entry.priority}</priority>`;
    }
    if (entry.changefreq) {
      xml += `\n    <changefreq>${entry.changefreq}</changefreq>`;
    }
    xml += '\n  </url>';
    return xml;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`;
}