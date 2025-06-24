import FirecrawlApp from '@mendable/firecrawl-js';
import { redis } from './redis';

interface FirecrawlResponse {
  success: boolean;
  data?: {
    markdown: string;
    html?: string;
    metadata?: {
      title?: string;
      description?: string;
      sourceURL?: string;
      statusCode?: number;
    };
  };
  error?: string;
}

interface SitemapInfo {
  totalPages: number;
  pages: string[];
  domain: string;
  crawledAt: string;
}

export class FirecrawlService {
  private app: FirecrawlApp;

  constructor(apiKey: string) {
    this.app = new FirecrawlApp({ apiKey });
  }

  async getSitemapInfo(url: string): Promise<SitemapInfo | null> {
    try {
      const domain = new URL(url).hostname;
      const cacheKey = redis.constructor.keys.sitemap(domain);
      
      // Check cache first
      if (redis.isAvailable()) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          console.log(`Using cached sitemap for ${domain}`);
          return cached;
        }
      }

      // Use Firecrawl to get sitemap
      const sitemapResult = await this.app.mapUrl(url, {
        search: '',
        ignoreSitemap: false,
        includeSubdomains: false,
        limit: 1000 // Max pages to discover
      });

      if (!sitemapResult.success || !sitemapResult.links) {
        return null;
      }

      const pages = Array.isArray(sitemapResult.links) ? sitemapResult.links : [];
      const sitemapInfo: SitemapInfo = {
        totalPages: pages.length,
        pages: pages.slice(0, 100), // Store first 100 URLs
        domain,
        crawledAt: new Date().toISOString()
      };

      // Cache for 24 hours
      if (redis.isAvailable()) {
        await redis.set(cacheKey, sitemapInfo, 86400);
      }

      return sitemapInfo;
    } catch (error) {
      console.error('Error getting sitemap info:', error);
      return null;
    }
  }

  async scrapeUrl(url: string): Promise<FirecrawlResponse> {
    try {
      // Check cache first (24 hour cache for scraped content)
      const urlHash = Buffer.from(url).toString('base64').slice(0, 16);
      const cacheKey = `scrape:${urlHash}`;
      
      if (redis.isAvailable()) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          console.log(`Using cached scrape data for ${url}`);
          return cached;
        }
      }

      const scrapeResult = await this.app.scrapeUrl(url, {
        formats: ['markdown', 'html'],
        onlyMainContent: true,
        includeTags: ['title', 'meta', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'li', 'div'],
        excludeTags: ['nav', 'footer', 'header', 'aside', 'script', 'style'],
      });

      if (!scrapeResult.success) {
        return {
          success: false,
          error: scrapeResult.error || 'Failed to scrape URL'
        };
      }

      const response = {
        success: true,
        data: {
          markdown: scrapeResult.data?.markdown || '',
          html: scrapeResult.data?.html,
          metadata: {
            title: scrapeResult.data?.metadata?.title,
            description: scrapeResult.data?.metadata?.description,
            sourceURL: scrapeResult.data?.metadata?.sourceURL || url,
            statusCode: scrapeResult.data?.metadata?.statusCode
          }
        }
      };

      // Cache successful scrape for 24 hours
      if (redis.isAvailable()) {
        await redis.set(cacheKey, response, 86400);
      }

      return response;
    } catch (error) {
      console.error('Firecrawl scraping error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async crawlSpecificUrls(urls: string[]): Promise<{ url: string; result: FirecrawlResponse }[]> {
    const results = [];
    
    for (const url of urls) {
      try {
        const result = await this.scrapeUrl(url);
        results.push({ url, result });
      } catch (error) {
        console.error(`Error crawling ${url}:`, error);
        results.push({ 
          url, 
          result: { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          } 
        });
      }
    }
    
    return results;
  }

  async crawlWebsite(url: string, maxPages: number = 10): Promise<FirecrawlResponse> {
    try {
      const crawlResult = await this.app.crawlUrl(url, {
        limit: maxPages,
        scrapeOptions: {
          formats: ['markdown', 'html'],
          onlyMainContent: true,
        }
      });

      if (!crawlResult.success) {
        return {
          success: false,
          error: crawlResult.error || 'Failed to crawl website'
        };
      }

      // Return the first page's data for compatibility
      const firstPage = crawlResult.data?.[0];
      if (!firstPage) {
        return {
          success: false,
          error: 'No pages found'
        };
      }

      return {
        success: true,
        data: {
          markdown: firstPage.markdown || '',
          html: firstPage.html,
          metadata: {
            title: firstPage.metadata?.title,
            description: firstPage.metadata?.description,
            sourceURL: firstPage.metadata?.sourceURL || url,
            statusCode: firstPage.metadata?.statusCode
          }
        }
      };
    } catch (error) {
      console.error('Firecrawl crawling error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

export const firecrawl = new FirecrawlService(process.env.FIRECRAWL_API_KEY || '');