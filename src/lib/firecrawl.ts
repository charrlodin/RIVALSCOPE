interface FirecrawlResponse {
  success: boolean;
  data?: {
    content: string;
    metadata?: {
      title?: string;
      description?: string;
      url?: string;
    };
  };
  error?: string;
}

export class FirecrawlService {
  private apiKey: string;
  private baseUrl = 'https://api.firecrawl.dev/v0';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async scrapeUrl(url: string): Promise<FirecrawlResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/scrape`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          formats: ['markdown', 'html'],
          onlyMainContent: true,
          includeTags: ['title', 'meta', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'li', 'div'],
          excludeTags: ['nav', 'footer', 'header', 'aside', 'script', 'style'],
        }),
      });

      if (!response.ok) {
        throw new Error(`Firecrawl API error: ${response.status}`);
      }

      const result = await response.json();
      return result;
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
      const response = await fetch(`${this.baseUrl}/crawl`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          crawlerOptions: {
            maxDepth: 2,
            limit: maxPages,
          },
          pageOptions: {
            onlyMainContent: true,
            includeHtml: false,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Firecrawl API error: ${response.status}`);
      }

      const result = await response.json();
      return result;
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