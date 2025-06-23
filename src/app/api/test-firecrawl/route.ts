import { NextResponse } from 'next/server';
import { firecrawl } from '@/lib/firecrawl';

export async function GET() {
  try {
    // Test with a simple, fast website
    const result = await firecrawl.scrapeUrl('https://example.com');
    
    return NextResponse.json({
      success: result.success,
      contentLength: result.data?.markdown?.length || 0,
      hasMetadata: !!result.data?.metadata,
      title: result.data?.metadata?.title,
      error: result.error
    });
  } catch (error) {
    console.error('Firecrawl test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}