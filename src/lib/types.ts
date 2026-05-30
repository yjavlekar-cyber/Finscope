export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content?: string;
  url: string;
  urlToImage?: string;
  publishedAt: string; // ISO string
  sourceName: string;
  category: string; // e.g. Markets, Stocks, Crypto, Economy, Banking, Startups, IPO, Global Finance
  sector?: string; // e.g. Technology, Healthcare, Energy, Finance, Consumer
  country?: string; // e.g. USA, UK, India, China, Global
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  relevanceScore: number; // 0 to 100
  importanceScore: 'High' | 'Medium' | 'Low';
  summary?: string[]; // Bulleted AI summary
}

export interface MarketAsset {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  category: 'Indices' | 'Stocks' | 'Crypto' | 'Commodities';
  sparkline?: number[]; // Mini charts data points
}
