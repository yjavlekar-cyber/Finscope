import { NextResponse } from 'next/server';
import { getFinScopeNews } from '@/lib/parser';
import { deduplicateArticles } from '@/lib/analyzer';
import { enrichArticlesWithAI } from '@/lib/gemini';
import { NewsArticle } from '@/lib/types';

// Simple In-Memory Cache
interface CacheStore {
  data: NewsArticle[];
  timestamp: number;
}

let newsCache: CacheStore | null = null;
const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes cache (180,000 ms)

// Simple Token-Bucket Rate Limiter
const ipBuckets = new Map<string, { tokens: number; lastRefill: number }>();
const RATE_LIMIT_TOKENS = 15;
const REFILL_RATE_MS = 60 * 1000; // Refill over 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  let bucket = ipBuckets.get(ip);

  if (!bucket) {
    bucket = { tokens: RATE_LIMIT_TOKENS, lastRefill: now };
    ipBuckets.set(ip, bucket);
    return true;
  }

  // Refill tokens
  const elapsed = now - bucket.lastRefill;
  if (elapsed > REFILL_RATE_MS) {
    bucket.tokens = Math.min(RATE_LIMIT_TOKENS, bucket.tokens + Math.floor(elapsed / REFILL_RATE_MS) * RATE_LIMIT_TOKENS);
    bucket.lastRefill = now;
  }

  if (bucket.tokens > 0) {
    bucket.tokens--;
    return true;
  }

  return false;
}

export async function GET(request: Request) {
  // Extract client IP for rate limiting
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a minute before refreshing again.' },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const bypassCache = searchParams.get('refresh') === 'true';

  try {
    const now = Date.now();
    
    // Check cache
    if (!bypassCache && newsCache && (now - newsCache.timestamp < CACHE_DURATION)) {
      console.log('[FinScope API] Serving cached financial news feed.');
      return NextResponse.json({
        articles: newsCache.data,
        cached: true,
        lastUpdated: new Date(newsCache.timestamp).toISOString()
      });
    }

    console.log('[FinScope API] Cache expired or force refresh. Rebuilding news feed...');
    
    // Fetch, deduplicate, and enrich
    const rawArticles = await getFinScopeNews();
    const uniqueArticles = deduplicateArticles(rawArticles);
    
    // Slice to 25 articles to keep payloads small and responsive
    const subset = uniqueArticles.slice(0, 25);
    const enriched = await enrichArticlesWithAI(subset);

    // Save cache
    newsCache = {
      data: enriched,
      timestamp: now
    };

    return NextResponse.json({
      articles: enriched,
      cached: false,
      lastUpdated: new Date(now).toISOString()
    });

  } catch (error: any) {
    console.error('[FinScope API] Fatal error generating news feed:', error);

    // Serve stale cache if available
    if (newsCache) {
      console.log('[FinScope API] Serving stale cache due to server-side error.');
      return NextResponse.json({
        articles: newsCache.data,
        cached: true,
        stale: true,
        lastUpdated: new Date(newsCache.timestamp).toISOString(),
        warning: 'Serving stale results due to source API errors'
      });
    }

    return NextResponse.json(
      { error: 'Failed to aggregate news feeds. Please try again shortly.', details: error.message },
      { status: 500 }
    );
  }
}
