import FirecrawlApp from '@mendable/firecrawl-js';

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

export class FirecrawlService {
  private app: FirecrawlApp;

  constructor(apiKey: string) {
    this.app = new FirecrawlApp({ apiKey });
  }

  async scrapeUrl(url: string): Promise<FirecrawlResponse> {
    try {
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

      return {
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
    } catch (error) {
      console.error('Firecrawl scraping error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
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