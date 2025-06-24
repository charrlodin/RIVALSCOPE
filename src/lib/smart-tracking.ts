import { prisma } from './prisma';
import { firecrawl } from './firecrawl';
import { redis } from './redis';
import crypto from 'crypto';

interface SitemapEntry {
  url: string;
  lastmod?: string;
  priority?: number;
  changefreq?: string;
}

interface SmartTrackingOptions {
  competitorId: string;
  priorityPaths?: string[];
  maxUrls?: number;
}

interface SmartTrackingResult {
  urlsToCheck: string[];
  estimatedSignals: number;
  reason: string;
  lastmodChanges: number;
  newUrls: number;
  priorityUrls: number;
}

export class SmartTrackingService {
  
  /**
   * Parse sitemap.xml and extract URLs with metadata
   */
  async parseSitemap(baseUrl: string): Promise<SitemapEntry[]> {
    try {
      const domain = new URL(baseUrl).hostname;
      const cacheKey = `sitemap_parsed:${domain}`;
      
      // Check cache first (1 hour cache for parsed sitemap)
      if (redis.isAvailable()) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          console.log(`Using cached parsed sitemap for ${domain}`);
          return cached;
        }
      }

      // Try common sitemap locations
      const sitemapUrls = [
        `${baseUrl}/sitemap.xml`,
        `${baseUrl}/sitemap_index.xml`,
        `${new URL(baseUrl).origin}/sitemap.xml`
      ];

      let sitemapEntries: SitemapEntry[] = [];

      for (const sitemapUrl of sitemapUrls) {
        try {
          const response = await fetch(sitemapUrl);
          if (response.ok) {
            const xmlContent = await response.text();
            sitemapEntries = this.parseXmlSitemap(xmlContent, baseUrl);
            if (sitemapEntries.length > 0) {
              console.log(`Found sitemap at ${sitemapUrl} with ${sitemapEntries.length} URLs`);
              break;
            }
          }
        } catch (error) {
          console.log(`Could not fetch sitemap from ${sitemapUrl}`);
          continue;
        }
      }

      // Fallback: Use Firecrawl's sitemap discovery
      if (sitemapEntries.length === 0) {
        console.log('No XML sitemap found, using Firecrawl discovery...');
        const sitemapInfo = await firecrawl.getSitemapInfo(baseUrl);
        if (sitemapInfo) {
          sitemapEntries = sitemapInfo.pages.map(url => ({ url }));
        }
      }

      // Cache for 1 hour
      if (redis.isAvailable() && sitemapEntries.length > 0) {
        await redis.set(cacheKey, sitemapEntries, 3600);
      }

      return sitemapEntries;
    } catch (error) {
      console.error('Error parsing sitemap:', error);
      return [];
    }
  }

  /**
   * Parse XML sitemap content
   */
  private parseXmlSitemap(xmlContent: string, baseUrl: string): SitemapEntry[] {
    const entries: SitemapEntry[] = [];
    
    // Simple XML parsing for sitemap
    const urlMatches = xmlContent.match(/<url>([\s\S]*?)<\/url>/g) || [];
    
    for (const urlBlock of urlMatches) {
      const locMatch = urlBlock.match(/<loc>(.*?)<\/loc>/);
      const lastmodMatch = urlBlock.match(/<lastmod>(.*?)<\/lastmod>/);
      const priorityMatch = urlBlock.match(/<priority>(.*?)<\/priority>/);
      const changefreqMatch = urlBlock.match(/<changefreq>(.*?)<\/changefreq>/);
      
      if (locMatch) {
        const entry: SitemapEntry = {
          url: locMatch[1].trim()
        };
        
        if (lastmodMatch) {
          entry.lastmod = lastmodMatch[1].trim();
        }
        
        if (priorityMatch) {
          entry.priority = parseFloat(priorityMatch[1].trim());
        }
        
        if (changefreqMatch) {
          entry.changefreq = changefreqMatch[1].trim();
        }
        
        entries.push(entry);
      }
    }

    // Handle sitemap index files
    if (entries.length === 0) {
      const sitemapMatches = xmlContent.match(/<sitemap>([\s\S]*?)<\/sitemap>/g) || [];
      
      for (const sitemapBlock of sitemapMatches) {
        const locMatch = sitemapBlock.match(/<loc>(.*?)<\/loc>/);
        if (locMatch) {
          // Recursively parse sub-sitemaps (simplified for now)
          console.log(`Found sub-sitemap: ${locMatch[1]}`);
        }
      }
    }
    
    return entries;
  }

  /**
   * Update sitemap URLs in database
   */
  async updateSitemapUrls(competitorId: string, sitemapEntries: SitemapEntry[]): Promise<void> {
    try {
      const competitor = await prisma.competitor.findUnique({
        where: { id: competitorId },
        include: { sitemapUrls: true }
      });

      if (!competitor) {
        throw new Error('Competitor not found');
      }

      // Get priority paths from competitor settings
      const priorityPaths = (competitor.priorityPaths as string[]) || [];

      for (const entry of sitemapEntries) {
        const isPriority = priorityPaths.some(path => 
          entry.url.includes(path) || entry.url.endsWith(path)
        );

        await prisma.sitemapUrl.upsert({
          where: {
            competitorId_url: {
              competitorId,
              url: entry.url
            }
          },
          update: {
            lastmod: entry.lastmod ? new Date(entry.lastmod) : null,
            priority: entry.priority,
            changefreq: entry.changefreq,
            isPriority,
            updatedAt: new Date()
          },
          create: {
            competitorId,
            url: entry.url,
            lastmod: entry.lastmod ? new Date(entry.lastmod) : null,
            priority: entry.priority,
            changefreq: entry.changefreq,
            isPriority
          }
        });
      }

      // Mark competitor sitemap as checked
      await prisma.competitor.update({
        where: { id: competitorId },
        data: { lastSitemapCheck: new Date() }
      });

      console.log(`Updated ${sitemapEntries.length} sitemap URLs for competitor ${competitorId}`);
    } catch (error) {
      console.error('Error updating sitemap URLs:', error);
      throw error;
    }
  }

  /**
   * Determine which URLs need to be crawled using smart logic
   */
  async getSmartCrawlUrls(options: SmartTrackingOptions): Promise<SmartTrackingResult> {
    const { competitorId, priorityPaths = [], maxUrls = 8 } = options; // Changed from 50 to 8 max

    try {
      const competitor = await prisma.competitor.findUnique({
        where: { id: competitorId },
        include: { 
          sitemapUrls: {
            orderBy: [
              { isPriority: 'desc' },
              { priority: 'desc' },
              { lastmod: 'desc' }
            ]
          }
        }
      });

      if (!competitor) {
        throw new Error('Competitor not found');
      }

      let urlsToCheck: string[] = [];
      let lastmodChanges = 0;
      let newUrls = 0;
      let priorityUrls = 0;
      let reason = '';

      // 1. Always include priority URLs
      const priorityUrlsData = competitor.sitemapUrls.filter(u => u.isPriority && u.isActive);
      priorityUrls = priorityUrlsData.length;
      urlsToCheck.push(...priorityUrlsData.map(u => u.url));

      // 2. Check for lastmod changes
      const lastCheck = competitor.lastSitemapCheck || new Date(0);
      const changedUrls = competitor.sitemapUrls.filter(u => 
        u.isActive && 
        !u.isPriority && 
        u.lastmod && 
        u.lastmod > lastCheck
      );
      lastmodChanges = changedUrls.length;
      urlsToCheck.push(...changedUrls.map(u => u.url));

      // 3. Check for new URLs (not crawled yet)
      const newUrlsData = competitor.sitemapUrls.filter(u => 
        u.isActive && 
        !u.isPriority && 
        !u.lastCrawled
      );
      newUrls = Math.min(newUrlsData.length, maxUrls - urlsToCheck.length);
      urlsToCheck.push(...newUrlsData.slice(0, newUrls).map(u => u.url));

      // 4. Add business-critical pages if still under limit
      if (urlsToCheck.length < maxUrls) {
        const businessPaths = ['/pricing', '/features', '/about', '/products', '/services', '/contact'];
        const businessUrls = competitor.sitemapUrls.filter(u => 
          u.isActive && 
          !urlsToCheck.includes(u.url) &&
          businessPaths.some(path => u.url.toLowerCase().includes(path))
        );
        const remainingSlots = Math.min(3, maxUrls - urlsToCheck.length); // Max 3 business pages
        urlsToCheck.push(...businessUrls.slice(0, remainingSlots).map(u => u.url));
      }

      // 5. Fill remaining with high-priority sitemap pages (only if really needed)
      if (urlsToCheck.length < 3) { // Only if we have very few URLs
        const highPriorityUrls = competitor.sitemapUrls.filter(u => 
          u.isActive && 
          !urlsToCheck.includes(u.url) &&
          (u.priority || 0) > 0.8 // Higher threshold
        );
        const remainingSlots = Math.min(2, maxUrls - urlsToCheck.length); // Max 2 additional
        urlsToCheck.push(...highPriorityUrls.slice(0, remainingSlots).map(u => u.url));
      }

      // Remove duplicates
      urlsToCheck = [...new Set(urlsToCheck)];

      // Ensure minimum smart tracking (at least homepage + 1 key page)
      if (urlsToCheck.length === 0) {
        // Fallback to at least homepage + one business page
        urlsToCheck = [competitor.url]; // Homepage
        const businessUrls = competitor.sitemapUrls.filter(u => 
          u.isActive && 
          ['/pricing', '/features', '/about'].some(path => u.url.toLowerCase().includes(path))
        );
        if (businessUrls.length > 0) {
          urlsToCheck.push(businessUrls[0].url);
        }
      }

      // Limit to maxUrls
      if (urlsToCheck.length > maxUrls) {
        urlsToCheck = urlsToCheck.slice(0, maxUrls);
      }

      // Calculate estimated signals
      const estimatedSignals = urlsToCheck.length;

      // Generate reason
      if (priorityUrls > 0) {
        reason += `${priorityUrls} priority paths`;
      }
      if (lastmodChanges > 0) {
        reason += reason ? `, ${lastmodChanges} recent changes` : `${lastmodChanges} recent changes`;
      }
      if (newUrls > 0) {
        reason += reason ? `, ${newUrls} new URLs` : `${newUrls} new URLs`;
      }
      if (!reason) {
        reason = `${urlsToCheck.length} URLs selected by priority/frequency`;
      }

      return {
        urlsToCheck,
        estimatedSignals,
        reason,
        lastmodChanges,
        newUrls,
        priorityUrls
      };

    } catch (error) {
      console.error('Error determining smart crawl URLs:', error);
      throw error;
    }
  }

  /**
   * Initialize smart tracking for a competitor
   */
  async initializeSmartTracking(competitorId: string, baseUrl: string): Promise<boolean> {
    try {
      console.log(`Initializing smart tracking for competitor ${competitorId}`);
      
      // Parse sitemap
      const sitemapEntries = await this.parseSitemap(baseUrl);
      
      if (sitemapEntries.length === 0) {
        console.log('No sitemap found, smart tracking cannot be enabled');
        return false;
      }

      // Update database
      await this.updateSitemapUrls(competitorId, sitemapEntries);
      
      // Enable smart tracking
      await prisma.competitor.update({
        where: { id: competitorId },
        data: { smartTracking: true }
      });

      console.log(`Smart tracking initialized with ${sitemapEntries.length} URLs`);
      return true;

    } catch (error) {
      console.error('Error initializing smart tracking:', error);
      return false;
    }
  }

  /**
   * Get smart tracking preview for UI
   */
  async getSmartTrackingPreview(competitorId: string): Promise<{
    totalUrls: number;
    priorityUrls: number;
    recentChanges: number;
    estimatedSignals: number;
    topPaths: { path: string; count: number }[];
  }> {
    try {
      const competitor = await prisma.competitor.findUnique({
        where: { id: competitorId },
        include: { sitemapUrls: true }
      });

      if (!competitor) {
        return {
          totalUrls: 0,
          priorityUrls: 0,
          recentChanges: 0,
          estimatedSignals: 0,
          topPaths: []
        };
      }

      const totalUrls = competitor.sitemapUrls.filter(u => u.isActive).length;
      const priorityUrls = competitor.sitemapUrls.filter(u => u.isPriority && u.isActive).length;
      
      const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentChanges = competitor.sitemapUrls.filter(u => 
        u.isActive && u.lastmod && u.lastmod > lastWeek
      ).length;

      // Analyze top paths
      const pathCounts: { [key: string]: number } = {};
      competitor.sitemapUrls.forEach(u => {
        try {
          const path = new URL(u.url).pathname;
          const topLevelPath = '/' + path.split('/')[1];
          pathCounts[topLevelPath] = (pathCounts[topLevelPath] || 0) + 1;
        } catch (error) {
          // Skip invalid URLs
        }
      });

      const topPaths = Object.entries(pathCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([path, count]) => ({ path, count }));

      // Estimate signals based on smart logic
      const smartResult = await this.getSmartCrawlUrls({ competitorId });
      
      return {
        totalUrls,
        priorityUrls,
        recentChanges,
        estimatedSignals: smartResult.estimatedSignals,
        topPaths
      };

    } catch (error) {
      console.error('Error getting smart tracking preview:', error);
      return {
        totalUrls: 0,
        priorityUrls: 0,
        recentChanges: 0,
        estimatedSignals: 0,
        topPaths: []
      };
    }
  }
}

export const smartTracking = new SmartTrackingService();