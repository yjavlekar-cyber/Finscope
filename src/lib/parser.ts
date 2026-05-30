import { NewsArticle } from './types';
import { evaluateRelevance } from './analyzer';

const RSS_FEEDS = [
  { name: 'CNBC Finance', url: 'https://news.google.com/rss/search?q=finance+site:cnbc.com&hl=en-US&gl=US&ceid=US:en' },
  { name: 'Reuters Markets', url: 'https://news.google.com/rss/search?q=markets+site:reuters.com&hl=en-US&gl=US&ceid=US:en' },
  { name: 'Bloomberg Business', url: 'https://news.google.com/rss/search?q=business+site:bloomberg.com&hl=en-US&gl=US&ceid=US:en' },
  { name: 'Financial Times', url: 'https://news.google.com/rss/search?q=finance+site:ft.com&hl=en-US&gl=US&ceid=US:en' }
];

/**
 * Utility to decode standard XML escape sequences
 */
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
}

/**
 * Parses Google News XML feed items manually.
 */
function parseGoogleNewsRss(xmlText: string, sourceName: string): NewsArticle[] {
  const articles: NewsArticle[] = [];
  const items = xmlText.split('<item>');
  
  // Skip the first split chunk as it contains the channel header info
  for (let i = 1; i < items.length; i++) {
    const item = items[i];
    
    const titleMatch = item.match(/<title>([\s\S]*?)<\/title>/);
    const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/);
    const pubDateMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
    const descMatch = item.match(/<description>([\s\S]*?)<\/description>/);

    if (titleMatch && linkMatch) {
      let rawTitle = decodeHtmlEntities(titleMatch[1]).trim();
      const url = linkMatch[1].trim();
      const publishedAt = pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString();
      let description = descMatch ? decodeHtmlEntities(descMatch[1]).replace(/<[^>]*>/g, '').trim() : '';

      // Google News titles format is usually: "Headline Text - Source Name"
      // Clean up the ending source name to keep the title pristine
      const hyphenIndex = rawTitle.lastIndexOf(' - ');
      let cleanTitle = rawTitle;
      let finalSource = sourceName;
      
      if (hyphenIndex > 0) {
        cleanTitle = rawTitle.slice(0, hyphenIndex).trim();
        finalSource = rawTitle.slice(hyphenIndex + 3).trim();
      }

      // Shorten long lists in Google descriptions
      if (description.length > 250) {
        description = description.slice(0, 247) + '...';
      }

      // Generate a mock unique ID based on title hash
      const id = Buffer.from(cleanTitle.slice(0, 20) + publishedAt).toString('base64').replace(/[^a-zA-Z0-9]/g, '');

      // Check if it's relevant to finance
      const relevance = evaluateRelevance(cleanTitle, description);

      if (relevance.isRelevant) {
        articles.push({
          id,
          title: cleanTitle,
          description: description || 'No summary description is available for this market update.',
          url,
          publishedAt,
          sourceName: finalSource,
          category: 'Markets',
          sentiment: 'Neutral',
          relevanceScore: relevance.score,
          importanceScore: 'Medium',
          // Default placeholders, will be resolved by AI or heuristic fallback
          urlToImage: `https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=400&auto=format&fit=crop` // Professional finance background image
        });
      }
    }
  }

  return articles;
}

/**
 * Fetches news from NewsAPI.org if key exists
 */
async function fetchNewsApi(apiKey: string): Promise<NewsArticle[]> {
  const query = encodeURIComponent('(finance OR stocks OR economy OR crypto OR banking OR IPO OR business OR investing OR "interest rates" OR "earnings report")');
  const url = `https://newsapi.org/v2/everything?q=${query}&language=en&sortBy=publishedAt&pageSize=50&apiKey=${apiKey}`;

  const res = await fetch(url, { headers: { 'User-Agent': 'FinScope App' } });
  
  if (!res.ok) {
    throw new Error(`NewsAPI responded with status: ${res.status}`);
  }

  const data = await res.json();
  if (data.status !== 'ok' || !Array.isArray(data.articles)) {
    throw new Error(`NewsAPI failed: ${data.message || 'Unknown error'}`);
  }

  const articles: NewsArticle[] = [];

  for (const art of data.articles) {
    if (!art.title || !art.url) continue;

    const title = decodeHtmlEntities(art.title);
    const description = decodeHtmlEntities(art.description || art.content || '');
    
    const relevance = evaluateRelevance(title, description);

    if (relevance.isRelevant) {
      const id = Buffer.from(title.slice(0, 20) + art.publishedAt).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
      articles.push({
        id,
        title,
        description: description || 'Detailed finance event coverage.',
        url: art.url,
        urlToImage: art.urlToImage || 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=400&auto=format&fit=crop',
        publishedAt: art.publishedAt ? new Date(art.publishedAt).toISOString() : new Date().toISOString(),
        sourceName: art.source?.name || 'Financial Source',
        category: 'Markets',
        sentiment: 'Neutral',
        relevanceScore: relevance.score,
        importanceScore: 'Medium'
      });
    }
  }

  return articles;
}

/**
 * Fetches all RSS feeds concurrently
 */
async function fetchRssFeeds(): Promise<NewsArticle[]> {
  const promises = RSS_FEEDS.map(async feed => {
    try {
      const response = await fetch(feed.url, {
        next: { revalidate: 300 }, // Cache feed for 5 minutes
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const xmlText = await response.text();
      return parseGoogleNewsRss(xmlText, feed.name);
    } catch (e) {
      console.error(`[FinScope Parser] Failed to fetch feed ${feed.name}:`, e);
      return [];
    }
  });

  const results = await Promise.all(promises);
  return results.flat();
}

/**
 * Provides high-quality mock articles as an ultimate fallback.
 */
function getMockArticles(): NewsArticle[] {
  const now = new Date();
  return [
    {
      id: 'mock-1',
      title: 'Global Markets Brace for Central Bank Policy Shifts',
      description: 'Institutional investors are reallocating portfolios as major central banks signal a potential pivot in interest rate trajectories for the upcoming fiscal quarter.',
      url: '#',
      publishedAt: new Date(now.getTime() - 1000 * 60 * 30).toISOString(),
      sourceName: 'FinScope Editorial',
      category: 'Markets',
      sentiment: 'Neutral',
      relevanceScore: 95,
      importanceScore: 'High',
      urlToImage: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=800'
    },
    {
      id: 'mock-2',
      title: 'Tech Sector Earnings Projected to Outperform Estimates',
      description: 'Analysis of supply chain data and consumer spending patterns suggests a stronger-than-expected performance for enterprise software and AI infrastructure providers.',
      url: '#',
      publishedAt: new Date(now.getTime() - 1000 * 60 * 120).toISOString(),
      sourceName: 'Market Intelligence',
      category: 'Stocks',
      sentiment: 'Bullish',
      relevanceScore: 88,
      importanceScore: 'Medium',
      urlToImage: 'https://images.unsplash.com/photo-1551288049-bbbda536339a?q=80&w=800'
    },
    {
      id: 'mock-3',
      title: 'Emerging Fintech Innovations Disrupting Traditional Banking',
      description: 'Cross-border payment protocols and decentralized ledger technologies are forcing legacy financial institutions to accelerate their digital transformation initiatives.',
      url: '#',
      publishedAt: new Date(now.getTime() - 1000 * 60 * 240).toISOString(),
      sourceName: 'FinScope Insights',
      category: 'Banking',
      sentiment: 'Bullish',
      relevanceScore: 82,
      importanceScore: 'Medium',
      urlToImage: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=800'
    }
  ];
}

/**
 * Main News Fetching consolidation service
 */
export async function getFinScopeNews(): Promise<NewsArticle[]> {
  const newsApiKey = process.env.NEWS_API_KEY;
  let articles: NewsArticle[] = [];

  if (newsApiKey) {
    try {
      console.log('[FinScope News] Attempting NewsAPI fetch...');
      articles = await fetchNewsApi(newsApiKey);
    } catch (e) {
      console.error('[FinScope News] NewsAPI fetch failed, falling back to RSS feeds...', e);
      articles = await fetchRssFeeds();
    }
  } else {
    articles = await fetchRssFeeds();
  }

  // Final fallback to high-quality mock data if feeds are empty or blocked
  if (articles.length < 3) {
    console.log('[FinScope News] Live feeds returned insufficient data. Injecting editorial fallbacks.');
    articles = [...articles, ...getMockArticles()];
  }

  // Sort articles chronologically descending
  return articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}
