import { prisma } from '@/lib/prisma';
import { EmailService } from '@/lib/resend';

interface ChangeDetection {
  type: 'PRICE_CHANGE' | 'CONTENT_UPDATE' | 'NEW_BLOG_POST' | 'FEATURE_ANNOUNCEMENT' | 'PRODUCT_UPDATE' | 'GENERAL_CHANGE';
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  oldValue?: string;
  newValue?: string;
}

export class ChangeDetector {
  private priceRegex = /\$[\d,]+\.?\d*/g;
  private currencyRegex = /[£€¥₹][\d,]+\.?\d*/g;
  private blogKeywords = ['blog', 'news', 'article', 'post', 'update', 'announcement'];
  private featureKeywords = ['feature', 'new', 'launch', 'release', 'update', 'improvement'];

  async detectChanges(
    competitorId: string,
    newContent: string,
    newContentHash: string,
    newMetadata: any
  ): Promise<ChangeDetection[]> {
    const changes: ChangeDetection[] = [];

    // Get the previous crawl data
    const previousCrawl = await prisma.crawlData.findFirst({
      where: {
        competitorId: competitorId
      },
      orderBy: {
        crawledAt: 'desc'
      }
    });

    if (!previousCrawl) {
      // First crawl - no changes to detect
      return [];
    }

    // Check if content has changed
    if (previousCrawl.contentHash !== newContentHash) {
      // Detect specific types of changes
      const detectedChanges = await this.analyzeContentChanges(
        previousCrawl.content,
        newContent,
        previousCrawl.metadata,
        newMetadata
      );
      
      changes.push(...detectedChanges);
    }

    return changes;
  }

  private async analyzeContentChanges(
    oldContent: string,
    newContent: string,
    oldMetadata: any,
    newMetadata: any
  ): Promise<ChangeDetection[]> {
    const changes: ChangeDetection[] = [];

    // Detect price changes
    const priceChanges = this.detectPriceChanges(oldContent, newContent);
    changes.push(...priceChanges);

    // Detect title changes
    const titleChanges = this.detectTitleChanges(oldMetadata, newMetadata);
    changes.push(...titleChanges);

    // Detect content additions/removals
    const contentChanges = this.detectContentChanges(oldContent, newContent);
    changes.push(...contentChanges);

    // Detect new blog posts or features
    const structuralChanges = this.detectStructuralChanges(oldContent, newContent);
    changes.push(...structuralChanges);

    return changes;
  }

  private detectPriceChanges(oldContent: string, newContent: string): ChangeDetection[] {
    const changes: ChangeDetection[] = [];
    
    const oldPrices = this.extractPrices(oldContent);
    const newPrices = this.extractPrices(newContent);

    // Compare price sets
    const oldPriceSet = new Set(oldPrices);
    const newPriceSet = new Set(newPrices);

    // Find price changes
    const addedPrices = newPrices.filter(price => !oldPriceSet.has(price));
    const removedPrices = oldPrices.filter(price => !newPriceSet.has(price));

    if (addedPrices.length > 0 || removedPrices.length > 0) {
      changes.push({
        type: 'PRICE_CHANGE',
        title: 'Pricing Updated',
        description: `Price changes detected. ${addedPrices.length} new prices, ${removedPrices.length} removed prices.`,
        severity: 'HIGH',
        oldValue: removedPrices.join(', '),
        newValue: addedPrices.join(', ')
      });
    }

    return changes;
  }

  private detectTitleChanges(oldMetadata: any, newMetadata: any): ChangeDetection[] {
    const changes: ChangeDetection[] = [];
    
    const oldTitle = oldMetadata?.title || '';
    const newTitle = newMetadata?.title || '';

    if (oldTitle !== newTitle && oldTitle && newTitle) {
      changes.push({
        type: 'CONTENT_UPDATE',
        title: 'Page Title Changed',
        description: 'The page title has been updated.',
        severity: 'MEDIUM',
        oldValue: oldTitle,
        newValue: newTitle
      });
    }

    return changes;
  }

  private detectContentChanges(oldContent: string, newContent: string): ChangeDetection[] {
    const changes: ChangeDetection[] = [];

    // Simple word count change detection
    const oldWords = oldContent.split(/\s+/).length;
    const newWords = newContent.split(/\s+/).length;
    const wordDiff = Math.abs(newWords - oldWords);

    if (wordDiff > 50) { // Significant content change
      const changeType = newWords > oldWords ? 'added' : 'removed';
      
      changes.push({
        type: 'CONTENT_UPDATE',
        title: 'Significant Content Change',
        description: `Approximately ${wordDiff} words ${changeType}.`,
        severity: wordDiff > 200 ? 'HIGH' : 'MEDIUM'
      });
    }

    return changes;
  }

  private detectStructuralChanges(oldContent: string, newContent: string): ChangeDetection[] {
    const changes: ChangeDetection[] = [];

    // Detect new blog posts or articles
    const oldBlogMatches = this.findBlogContent(oldContent);
    const newBlogMatches = this.findBlogContent(newContent);

    if (newBlogMatches.length > oldBlogMatches.length) {
      changes.push({
        type: 'NEW_BLOG_POST',
        title: 'New Content Published',
        description: `${newBlogMatches.length - oldBlogMatches.length} new blog posts or articles detected.`,
        severity: 'MEDIUM'
      });
    }

    // Detect new features
    const oldFeatureMatches = this.findFeatureContent(oldContent);
    const newFeatureMatches = this.findFeatureContent(newContent);

    if (newFeatureMatches.length > oldFeatureMatches.length) {
      changes.push({
        type: 'FEATURE_ANNOUNCEMENT',
        title: 'New Feature Detected',
        description: `${newFeatureMatches.length - oldFeatureMatches.length} new features or announcements found.`,
        severity: 'HIGH'
      });
    }

    return changes;
  }

  private extractPrices(content: string): string[] {
    const prices: string[] = [];
    
    // Extract USD prices
    const usdMatches = content.match(this.priceRegex) || [];
    prices.push(...usdMatches);

    // Extract other currency prices
    const currencyMatches = content.match(this.currencyRegex) || [];
    prices.push(...currencyMatches);

    return [...new Set(prices)]; // Remove duplicates
  }

  private findBlogContent(content: string): string[] {
    const matches: string[] = [];
    const lowerContent = content.toLowerCase();
    
    this.blogKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b.*?(?=\\n|$)`, 'gi');
      const keywordMatches = content.match(regex) || [];
      matches.push(...keywordMatches);
    });

    return matches;
  }

  private findFeatureContent(content: string): string[] {
    const matches: string[] = [];
    const lowerContent = content.toLowerCase();
    
    this.featureKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b.*?(?=\\n|$)`, 'gi');
      const keywordMatches = content.match(regex) || [];
      matches.push(...keywordMatches);
    });

    return matches;
  }

  async saveChanges(
    competitorId: string,
    crawlDataId: string,
    changes: ChangeDetection[]
  ): Promise<void> {
    for (const change of changes) {
      await prisma.change.create({
        data: {
          competitorId,
          crawlDataId,
          changeType: change.type,
          title: change.title,
          description: change.description,
          oldValue: change.oldValue || null,
          newValue: change.newValue || null,
          severity: change.severity
        }
      });
    }

    // Send notifications for high priority changes
    const highPriorityChanges = changes.filter(c => 
      c.severity === 'HIGH' || c.severity === 'CRITICAL'
    );

    if (highPriorityChanges.length > 0) {
      await this.sendChangeNotifications(competitorId, highPriorityChanges);
    }
  }

  private async sendChangeNotifications(
    competitorId: string,
    changes: ChangeDetection[]
  ): Promise<void> {
    try {
      const competitor = await prisma.competitor.findUnique({
        where: { id: competitorId },
        include: { user: true }
      });

      if (!competitor || !competitor.user.email) {
        return;
      }

      // Send one email with the most severe change
      const mostSevereChange = changes.sort((a, b) => {
        const severityOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      })[0];

      const changesUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/competitors/${competitorId}/changes`;

      await EmailService.sendChangeNotification({
        competitorName: competitor.name || new URL(competitor.url).hostname,
        competitorUrl: competitor.url,
        changeType: mostSevereChange.type,
        changeDescription: changes.length === 1 
          ? mostSevereChange.description 
          : `${mostSevereChange.description} (${changes.length} total changes detected)`,
        severity: mostSevereChange.severity.toLowerCase() as 'low' | 'medium' | 'high',
        detectedAt: new Date(),
        changesUrl,
        userEmail: competitor.user.email,
        userName: competitor.user.firstName || competitor.user.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'User'
      });

      // Create in-app notifications for each change
      for (const change of changes) {
        await prisma.notification.create({
          data: {
            userId: competitor.userId,
            changeId: '', // Will be set after change is created
            type: 'EMAIL',
            title: change.title,
            message: change.description,
            sentAt: new Date()
          }
        });
      }
    } catch (error) {
      console.error('Error sending change notifications:', error);
    }
  }
}

export const changeDetector = new ChangeDetector();