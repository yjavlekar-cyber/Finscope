import { NewsArticle } from './types';

// Lexicons for financial sentiment
const POSITIVE_WORDS = new Set([
  'rally', 'surge', 'dividend', 'profit', 'acquire', 'merger', 'growth', 'gain', 'bullish', 'upbeat', 
  'outlook', 'exceed', 'beat', 'upgrade', 'soar', 'expansion', 'innovative', 'ipo', 'funding', 
  'invest', 'bull', 'rallying', 'outperformed', 'soared', 'grew', 'profitable', 'acquired', 
  'gains', 'surges', 'optimistic', 'strong', 'climbed', 'rebound', 'acquisition', 'record-high',
  'bulls', 'surpassed', 'breakthrough', 'partnership', 'beats', 'soars', 'earnings-beat'
]);

const NEGATIVE_WORDS = new Set([
  'plunge', 'crash', 'default', 'layoff', 'debt', 'deficit', 'decline', 'bearish', 'drop', 'slump', 
  'sink', 'miss', 'cut', 'bankruptcy', 'liquidation', 'selloff', 'recession', 'downgrade', 'shrink', 
  'low', 'contraction', 'bear', 'plunging', 'fears', 'inflation', 'hike', 'investigation', 'plunged', 
  'dropped', 'sank', 'slumped', 'missed', 'crisis', 'lawsuit', 'losses', 'loss', 'slashed', 'layoffs',
  'bears', 'subsidize', 'fraud', 'scam', 'investigate', 'fine', 'penalty', 'lawsuit', 'drop', 'bankrupt'
]);

// Excluded junk categories/topics (sports, celebs, entertainment, gaming, gossip)
const EXCLUDED_WORDS = new Set([
  'hollywood', 'actor', 'actress', 'movie', 'film', 'album', 'grammy', 'oscar', 'football', 'soccer', 
  'basketball', 'nfl', 'nba', 'fifa', 'olympics', 'gaming', 'playstation', 'xbox', 'nintendo', 
  'fortnite', 'kardashian', 'dating', 'romance', 'divorce', 'gossip', 'concert', 'tour', 'fashion', 
  'runway', 'makeup', 'showbiz', 'wrestling', 'wwe', 'cardib', 'marvel', 'disney', 'superhero',
  'gameplay', 'trailer', 'esports', 'tiktok-drama', 'influencer'
]);

// Helper to sanitize and tokenize text
function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2);
}

/**
 * Calculates similarity between two strings using Sorensen-Dice coefficient.
 * Value is between 0.0 (no match) and 1.0 (exact match).
 */
export function getSimilarity(textA: string, textB: string): number {
  const setA = new Set(tokenize(textA));
  const setB = new Set(tokenize(textB));
  if (setA.size === 0 || setB.size === 0) return 0;
  
  let intersection = 0;
  for (const word of setA) {
    if (setB.has(word)) {
      intersection++;
    }
  }
  return (2 * intersection) / (setA.size + setB.size);
}

/**
 * Categorize articles based on financial keywords in title and description.
 */
export function classifyCategory(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  
  if (text.includes('bitcoin') || text.includes('crypto') || text.includes('ethereum') || text.includes('dogecoin') || text.includes('solana') || text.includes('blockchain') || text.includes('btc') || text.includes('eth') || text.includes('binance') || text.includes('coinbase')) {
    return 'Crypto';
  }
  if (text.includes('ipo') || text.includes('public listing') || text.includes('initial public offering') || text.includes('list on nasdaq') || text.includes('spac')) {
    return 'IPO';
  }
  if (text.includes('startup') || text.includes('funding round') || text.includes('venture capital') || text.includes('seed stage') || text.includes('y combinator') || text.includes('series a') || text.includes('series b') || text.includes('unicorn')) {
    return 'Startups';
  }
  if (text.includes('fed ') || text.includes('federal reserve') || text.includes('interest rate') || text.includes('inflation') || text.includes('gdp') || text.includes('employment') || text.includes('deficit') || text.includes('treasury') || text.includes('central bank')) {
    return 'Economy';
  }
  if (text.includes('bank ') || text.includes('banking') || text.includes('morgan stanley') || text.includes('goldman sachs') || text.includes('jpmorgan') || text.includes('citigroup') || text.includes('credit suisse') || text.includes('svg bank') || text.includes('hsbc')) {
    return 'Banking';
  }
  if (text.includes('global') || text.includes('trade war') || text.includes('tariff') || text.includes('brexit') || text.includes('opec') || text.includes('china') || text.includes('europe') || text.includes('cross-border')) {
    return 'Global Finance';
  }
  if (text.includes('stock') || text.includes('shares') || text.includes('earnings') || text.includes('dividend') || text.includes('nasdaq') || text.includes('dow jones') || text.includes('nyse') || text.includes('sp 500') || text.includes('ticker') || text.includes('short sell')) {
    return 'Stocks';
  }
  
  // Default fallback category
  return 'Markets';
}

/**
 * Filter out low quality or non-finance articles and calculate a relevance score.
 */
export function evaluateRelevance(title: string, description: string): { isRelevant: boolean; score: number } {
  const combined = `${title} ${description}`.toLowerCase();
  const tokens = tokenize(combined);
  
  if (tokens.length === 0) return { isRelevant: false, score: 0 };
  
  // 1. Strict Exclusions Check
  for (const token of tokens) {
    if (EXCLUDED_WORDS.has(token)) {
      return { isRelevant: false, score: 0 };
    }
  }

  // 2. Finance Indicators Check
  const financeKeywords = [
    'market', 'stock', 'share', 'earnings', 'revenue', 'profit', 'fed', 'interest', 'inflation', 
    'crypto', 'bitcoin', 'economy', 'startup', 'funding', 'ipo', 'bank', 'finance', 'investing', 
    'investment', 'nasdaq', 'dow', 'goldman', 'jpmorgan', 'dividend', 'acquisit', 'merger', 
    'central bank', 'yield', 'bond', 'debt', 'cash', 'gdp', 'fintech', 'venture capital', 'crude oil', 
    'crude', 'commodity', 'gold price', 'valuation', 'regulation', 'trade', 'sec'
  ];
  
  let matches = 0;
  for (const keyword of financeKeywords) {
    if (combined.includes(keyword)) {
      matches++;
    }
  }

  // Sentiment hits count as finance markers too
  let financeTermCount = 0;
  for (const token of tokens) {
    if (POSITIVE_WORDS.has(token) || NEGATIVE_WORDS.has(token)) {
      financeTermCount++;
    }
  }

  // 3. Compute score
  const baseScore = Math.min(100, (matches * 15) + (financeTermCount * 8));
  
  // We need at least one direct finance keyword OR some significant finance terms to be relevant
  const isRelevant = matches > 0 || financeTermCount >= 2;
  
  return {
    isRelevant,
    score: Math.max(10, baseScore)
  };
}

/**
 * Heuristic sentiment analysis
 */
export function analyzeSentiment(title: string, description: string): 'Bullish' | 'Bearish' | 'Neutral' {
  const tokens = tokenize(`${title} ${description}`);
  
  let score = 0;
  for (const token of tokens) {
    if (POSITIVE_WORDS.has(token)) {
      score += 1;
    } else if (NEGATIVE_WORDS.has(token)) {
      score -= 1;
    }
  }
  
  if (score > 0) return 'Bullish';
  if (score < 0) return 'Bearish';
  return 'Neutral';
}

/**
 * Local deduplication processor to clean arrays of articles.
 */
export function deduplicateArticles(articles: NewsArticle[]): NewsArticle[] {
  const result: NewsArticle[] = [];
  const similarityThreshold = 0.55; // 55% token overlap is quite high for headlines

  for (const article of articles) {
    let isDuplicate = false;
    for (const existing of result) {
      // Check title similarity and source overlap
      const titleSim = getSimilarity(article.title, existing.title);
      if (titleSim > similarityThreshold) {
        isDuplicate = true;
        // Keep the one with a longer description / image if possible
        if ((article.description || '').length > (existing.description || '').length && article.urlToImage) {
          const index = result.indexOf(existing);
          result[index] = article;
        }
        break;
      }
    }
    if (!isDuplicate) {
      result.push(article);
    }
  }
  
  return result;
}
