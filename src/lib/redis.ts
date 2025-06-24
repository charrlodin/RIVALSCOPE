import { createClient } from 'redis';

class RedisCache {
  private client: any;
  private isConnected: boolean = false;

  constructor() {
    // Only initialize Redis client if REDIS_URL is provided
    if (process.env.REDIS_URL) {
      this.client = createClient({
        url: process.env.REDIS_URL
      });

      this.client.on('error', (err: Error) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis Client Connected');
        this.isConnected = true;
      });
    }
  }

  async connect() {
    if (this.client && !this.isConnected) {
      try {
        await this.client.connect();
        this.isConnected = true;
      } catch (error) {
        console.error('Failed to connect to Redis:', error);
        this.isConnected = false;
      }
    }
  }

  async get(key: string): Promise<any> {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 86400): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis del error:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  isAvailable(): boolean {
    return this.isConnected && !!this.client;
  }

  // Cache keys for different data types
  static keys = {
    sitemap: (domain: string) => `sitemap:${domain}`,
    crawlData: (url: string, contentHash: string) => `crawl:${url}:${contentHash}`,
    sitemapPages: (domain: string) => `sitemap_pages:${domain}`,
  };
}

export const redis = new RedisCache();

// Auto-connect on import if Redis URL is available
if (process.env.REDIS_URL) {
  redis.connect().catch(console.error);
}