import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { smartTracking } from '@/lib/smart-tracking';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { url, priorityPaths = [] } = await request.json();

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

    // Create a temporary competitor ID for preview
    const tempCompetitorId = `temp_${userId}_${Date.now()}`;

    try {
      // Initialize smart tracking temporarily
      const sitemapEntries = await smartTracking.parseSitemap(url);
      
      if (sitemapEntries.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'No sitemap found or website not accessible'
        });
      }

      // Simulate smart tracking analysis
      const preview = {
        totalUrls: sitemapEntries.length,
        priorityUrls: sitemapEntries.filter(entry => 
          priorityPaths.some((path: string) => 
            entry.url.includes(path) || entry.url.endsWith(path)
          )
        ).length,
        recentChanges: sitemapEntries.filter(entry => {
          if (!entry.lastmod) return false;
          const lastmod = new Date(entry.lastmod);
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return lastmod > weekAgo;
        }).length,
        estimatedSignals: Math.min(
          Math.max(
            sitemapEntries.filter(entry => 
              priorityPaths.some((path: string) => 
                entry.url.includes(path) || entry.url.endsWith(path)
              ) || 
              (entry.lastmod && new Date(entry.lastmod) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
              !entry.lastmod // New URLs without lastmod
            ).length,
            3 // Minimum 3 URLs for smart tracking
          ),
          8 // Maximum 8 URLs per smart crawl - truly smart!
        ),
        topPaths: analyzeTopPaths(sitemapEntries)
      };

      return NextResponse.json({
        success: true,
        ...preview,
        sitemapFound: true,
        recommendation: generateRecommendation(preview)
      });

    } catch (error) {
      console.error('Error generating smart preview:', error);
      return NextResponse.json(
        { error: 'Failed to analyze website for smart tracking' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Smart preview API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }

}

// Helper function to analyze top paths
function analyzeTopPaths(sitemapEntries: any[]) {
    const pathCounts: { [key: string]: number } = {};
    
    sitemapEntries.forEach(entry => {
      try {
        const path = new URL(entry.url).pathname;
        const segments = path.split('/').filter(Boolean);
        const topLevelPath = segments.length > 0 ? `/${segments[0]}` : '/';
        pathCounts[topLevelPath] = (pathCounts[topLevelPath] || 0) + 1;
      } catch (error) {
        // Skip invalid URLs
      }
    });

    return Object.entries(pathCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([path, count]) => ({ path, count }));
}

// Helper function to generate recommendation
function generateRecommendation(preview: any) {
  const { totalUrls, estimatedSignals, priorityUrls, recentChanges } = preview;
  const savings = Math.max(0, totalUrls - estimatedSignals);
  
  if (savings > 50) {
    return `🎯 Excellent choice! Smart tracking will save ~${savings} signals vs full site monitoring.`;
  } else if (savings > 20) {
    return `💡 Good option! Smart tracking will save ~${savings} signals vs full site monitoring.`;
  } else if (recentChanges > 10) {
    return `📈 This site has ${recentChanges} recent changes. Smart tracking is perfect for active sites.`;
  } else {
    return `🔍 Smart tracking will monitor ${estimatedSignals} most important pages efficiently.`;
  }
}