import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AISmartCrawlRecommendation {
  priority_pages: Array<{
    url: string;
    reason: string;
    importance_score: number; // 1-10 scale
  }>;
  estimated_signals: number;
  analysis_summary: string;
}

export interface AIUserPromptMatch {
  matched_pages: Array<{
    url: string;
    reason: string;
    relevance_score: number; // 1-10 scale
  }>;
  estimated_signals: number;
  interpretation: string;
}

/**
 * AI Service for Smart Crawl Analysis
 */
export class AISmartCrawlService {
  
  /**
   * System 1: AI-Led Smart Crawl Analysis
   * Analyzes sitemap and recommends high-value pages for monitoring
   */
  async analyzeWebsiteForSmartCrawl(
    sitemapContent: string, 
    websiteUrl: string,
    maxSignals: number = 8
  ): Promise<AISmartCrawlRecommendation> {
    try {
      const prompt = `You are a senior competitive intelligence analyst for SaaS products. You receive the XML sitemap of a website. Your job is to recommend which pages should be monitored regularly to detect strategic changes (product, pricing, features, roadmap, hiring, blogs, testimonials, etc.).

IMPORTANT CONSTRAINTS:
- Maximum ${maxSignals} pages can be selected (budget constraint)
- Focus on high-signal, high-impact pages that indicate strategic changes
- Consider URL patterns, naming conventions, and likely content importance
- Prioritize business-critical pages over generic content

Website: ${websiteUrl}

Sitemap content:
${sitemapContent}

Return a JSON response with this exact structure:
{
  "priority_pages": [
    {
      "url": "https://example.com/pricing",
      "reason": "Pricing page likely to signal changes in monetization strategy.",
      "importance_score": 9
    }
  ],
  "estimated_signals": 6,
  "analysis_summary": "Brief explanation of selection strategy and what changes to expect"
}

Be concise and strategic. Focus on pages that competitors would most want to monitor.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a competitive intelligence expert. Respond only with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      // Validate and enforce constraints
      if (result.priority_pages && result.priority_pages.length > maxSignals) {
        result.priority_pages = result.priority_pages
          .sort((a: any, b: any) => (b.importance_score || 0) - (a.importance_score || 0))
          .slice(0, maxSignals);
        result.estimated_signals = Math.min(result.estimated_signals, maxSignals);
      }

      return result as AISmartCrawlRecommendation;
    } catch (error) {
      console.error('AI Smart Crawl analysis failed:', error);
      
      // Fallback to simple heuristic
      return this.getFallbackRecommendation(sitemapContent, websiteUrl, maxSignals);
    }
  }

  /**
   * System 2: User-Custom Smart Crawl
   * Matches user intent to relevant sitemap URLs
   */
  async matchUserIntentToPages(
    userPrompt: string,
    sitemapContent: string,
    websiteUrl: string,
    maxSignals: number = 8
  ): Promise<AIUserPromptMatch> {
    try {
      const prompt = `You are an AI assistant that receives a user's monitoring request and a sitemap. Your job is to map their request to the most relevant URLs and estimate how many credits ("signals") it will cost to track those URLs.

IMPORTANT CONSTRAINTS:
- Maximum ${maxSignals} pages can be selected (budget constraint)
- Match user intent as closely as possible
- Prioritize exact matches over loose interpretations
- Consider URL patterns and likely content

Website: ${websiteUrl}
User wants to track: "${userPrompt}"

Sitemap content:
${sitemapContent}

Return a JSON response with this exact structure:
{
  "matched_pages": [
    {
      "url": "https://example.com/pricing",
      "reason": "Direct match for 'pricing'.",
      "relevance_score": 9
    }
  ],
  "estimated_signals": 4,
  "interpretation": "Brief explanation of how you interpreted the user's request"
}

Focus on quality matches that align with user intent.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant. Respond only with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 800,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      // Validate and enforce constraints
      if (result.matched_pages && result.matched_pages.length > maxSignals) {
        result.matched_pages = result.matched_pages
          .sort((a: any, b: any) => (b.relevance_score || 0) - (a.relevance_score || 0))
          .slice(0, maxSignals);
        result.estimated_signals = Math.min(result.estimated_signals, maxSignals);
      }

      return result as AIUserPromptMatch;
    } catch (error) {
      console.error('AI User Intent matching failed:', error);
      
      // Fallback to keyword matching
      return this.getFallbackUserMatch(userPrompt, sitemapContent, websiteUrl, maxSignals);
    }
  }

  /**
   * Fallback recommendation when AI fails
   */
  private getFallbackRecommendation(
    sitemapContent: string, 
    websiteUrl: string, 
    maxSignals: number
  ): AISmartCrawlRecommendation {
    const urls = this.extractUrlsFromSitemap(sitemapContent);
    const businessCriticalPaths = [
      '/pricing', '/features', '/about', '/products', '/services', 
      '/blog', '/news', '/changelog', '/roadmap', '/careers'
    ];

    const priorityPages = urls
      .filter(url => businessCriticalPaths.some(path => url.toLowerCase().includes(path)))
      .slice(0, maxSignals)
      .map(url => ({
        url,
        reason: 'Business-critical page identified by URL pattern',
        importance_score: 7
      }));

    return {
      priority_pages: priorityPages,
      estimated_signals: Math.min(priorityPages.length, maxSignals),
      analysis_summary: 'Fallback analysis using business-critical URL patterns'
    };
  }

  /**
   * Fallback user intent matching when AI fails
   */
  private getFallbackUserMatch(
    userPrompt: string,
    sitemapContent: string,
    websiteUrl: string,
    maxSignals: number
  ): AIUserPromptMatch {
    const urls = this.extractUrlsFromSitemap(sitemapContent);
    const keywords = userPrompt.toLowerCase().split(/\s+/);
    
    const matchedPages = urls
      .filter(url => keywords.some(keyword => url.toLowerCase().includes(keyword)))
      .slice(0, maxSignals)
      .map(url => ({
        url,
        reason: 'Keyword match in URL',
        relevance_score: 6
      }));

    return {
      matched_pages: matchedPages,
      estimated_signals: Math.min(matchedPages.length, maxSignals),
      interpretation: `Simple keyword matching for: ${keywords.join(', ')}`
    };
  }

  /**
   * Extract URLs from sitemap XML content
   */
  private extractUrlsFromSitemap(sitemapContent: string): string[] {
    const urlMatches = sitemapContent.match(/<loc>(.*?)<\/loc>/g) || [];
    return urlMatches
      .map(match => match.replace(/<\/?loc>/g, ''))
      .filter(url => url.trim().length > 0);
  }
}

export const aiSmartCrawl = new AISmartCrawlService();