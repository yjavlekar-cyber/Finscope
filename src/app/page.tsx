'use client';

import React, { useEffect, useState, useMemo } from 'react';
import TickerTape from '@/components/TickerTape';
import Header from '@/components/Header';
import FilterBar from '@/components/FilterBar';
import NewsCard from '@/components/NewsCard';
import MarketOverview from '@/components/MarketOverview';
import ArticleReaderModal from '@/components/ArticleReaderModal';
import { NewsArticle, MarketAsset } from '@/lib/types';
import { RefreshCw, FileText, Info, Loader2, Sparkles, WifiOff, ArrowRight } from 'lucide-react';

export default function Home() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [marketAssets, setMarketAssets] = useState<MarketAsset[]>([]);
  const [dynamicStocks, setDynamicStocks] = useState<MarketAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchingStocks, setSearchingStocks] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Search, Category, Sector, Country and Sorting State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSector, setSelectedSector] = useState('All Sectors');
  const [selectedCountry, setSelectedCountry] = useState('All Regions');
  const [sortBy, setSortBy] = useState<'Latest' | 'Importance' | 'Relevance'>('Latest');
  
  // Modals & Timestamps
  const [activeArticle, setActiveArticle] = useState<NewsArticle | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Fetch news articles from Next.js server API
  async function fetchNews(forceRefresh = false) {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);
    
    setError(null);
    try {
      const url = forceRefresh ? '/api/news?refresh=true' : '/api/news';
      const res = await fetch(url);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Server failed to aggregate news feeds');
      }

      setArticles(data.articles || []);
      if (data.lastUpdated) {
        const timeStr = new Date(data.lastUpdated).toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        setLastUpdated(timeStr);
      }
    } catch (err: any) {
      console.error('[FinScope Page] Load error:', err);
      setError(err.message || 'Connecting to data feeds failed.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Fetch market assets
  async function fetchMarkets() {
    try {
      const res = await fetch('/api/market');
      if (res.ok) {
        const data = await res.json();
        setMarketAssets(data.assets || []);
      }
    } catch (err) {
      console.error('Failed to fetch market data:', err);
    }
  }

  // Initial load and auto-polling
  useEffect(() => {
    fetchNews(false);
    fetchMarkets();
    
    const newsInterval = setInterval(() => {
      console.log('[FinScope Poller] Running automatic news synchronization...');
      fetchNews(false);
    }, 60000);

    const marketInterval = setInterval(() => {
      fetchMarkets();
    }, 15000);

    return () => {
      clearInterval(newsInterval);
      clearInterval(marketInterval);
    };
  }, []);

  // Handle searching for dynamic stock symbols
  useEffect(() => {
    const query = searchQuery.trim().toUpperCase();
    // Logic to detect if it's a potential ticker or company name (1-12 chars, alphanumeric)
    if (query.length >= 1 && query.length <= 12 && /^[A-Z0-9.]+$/.test(query)) {
      // Check if we already have it in marketAssets or dynamicStocks
      const exists = [...marketAssets, ...dynamicStocks].some(s => s.symbol === query || s.name.toUpperCase().includes(query));
      if (!exists) {
        setSearchingStocks(true);
        const timer = setTimeout(async () => {
          try {
            const res = await fetch(`/api/market?symbol=${query}`);
            const data = await res.json();
            if (data.asset) {
              setDynamicStocks(prev => [...prev, data.asset]);
            }
          } catch (e) {
            console.error('Failed to fetch dynamic symbol:', e);
          } finally {
            setSearchingStocks(false);
          }
        }, 600); // Debounce lookup
        return () => clearTimeout(timer);
      }
    } else {
      setSearchingStocks(false);
    }
  }, [searchQuery, marketAssets, dynamicStocks]);

  // Filtered & Sorted Articles calculation
  const { filteredArticles, matchedStocks } = useMemo(() => {
    let artResults = [...articles];
    let stockResults: MarketAsset[] = [];

    // 1. Category Filter
    if (selectedCategory !== 'All') {
      artResults = artResults.filter(
        (a) => a.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // 2. Sector Filter
    if (selectedSector !== 'All Sectors') {
      artResults = artResults.filter(
        (a) => a.sector?.toLowerCase() === selectedSector.toLowerCase()
      );
    }

    // 3. Country Filter
    if (selectedCountry !== 'All Regions') {
      artResults = artResults.filter(
        (a) => a.country?.toLowerCase() === selectedCountry.toLowerCase()
      );
    }

    // 4. Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      artResults = artResults.filter(
        (a) =>
          a.title.toLowerCase().includes(query) ||
          (a.description || '').toLowerCase().includes(query) ||
          a.sourceName.toLowerCase().includes(query) ||
          (a.sector || '').toLowerCase().includes(query) ||
          (a.country || '').toLowerCase().includes(query)
      );

      // Search across both curated list and dynamically discovered stocks
      stockResults = [...marketAssets, ...dynamicStocks].filter(
        (s) =>
          s.symbol.toLowerCase().includes(query) ||
          s.name.toLowerCase().includes(query)
      );
    }

    // 5. Sorting Mechanics
    if (sortBy === 'Importance') {
      const priority = { High: 3, Medium: 2, Low: 1 };
      artResults.sort((a, b) => {
        const diff = priority[b.importanceScore] - priority[a.importanceScore];
        if (diff !== 0) return diff;
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      });
    } else if (sortBy === 'Relevance') {
      artResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
    } else {
      artResults.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    }

    return { filteredArticles: artResults, matchedStocks: stockResults };
  }, [articles, marketAssets, dynamicStocks, selectedCategory, selectedSector, selectedCountry, searchQuery, sortBy]);

  // Extract spotlight "Lead Editorial" article
  const spotlightArticle = useMemo(() => {
    if (filteredArticles.length === 0) return null;
    const highImportance = filteredArticles.find(a => a.importanceScore === 'High');
    return highImportance || filteredArticles[0];
  }, [filteredArticles]);

  // Group remaining articles by section for the elegant frontpage layout
  const sectionedArticles = useMemo(() => {
    const groups = {
      markets: {
        title: 'Markets & Corporate Finance',
        filterTarget: 'Markets',
        categories: ['Markets', 'Stocks'],
        items: [] as NewsArticle[]
      },
      crypto: {
        title: 'Decentralized Finance & Digital Assets',
        filterTarget: 'Crypto',
        categories: ['Crypto'],
        items: [] as NewsArticle[]
      },
      macro: {
        title: 'Macroeconomics & Global Policy',
        filterTarget: 'Economy',
        categories: ['Economy', 'Banking', 'Global Finance'],
        items: [] as NewsArticle[]
      },
      vc: {
        title: 'Venture Capital & Public Listings',
        filterTarget: 'Startups',
        categories: ['Startups', 'IPO'],
        items: [] as NewsArticle[]
      }
    };

    const listToDistribute = spotlightArticle && !searchQuery 
      ? filteredArticles.filter(a => a.id !== spotlightArticle.id)
      : filteredArticles;

    listToDistribute.forEach(article => {
      if (groups.markets.categories.includes(article.category)) {
        groups.markets.items.push(article);
      } else if (groups.crypto.categories.includes(article.category)) {
        groups.crypto.items.push(article);
      } else if (groups.macro.categories.includes(article.category)) {
        groups.macro.items.push(article);
      } else if (groups.vc.categories.includes(article.category)) {
        groups.vc.items.push(article);
      }
    });

    return groups;
  }, [filteredArticles, spotlightArticle, searchQuery]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col antialiased selection:bg-zinc-100 selection:text-black">
      
      {/* Ticker Tape */}
      <TickerTape />

      {/* Main Classical Header */}
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* Categories & Sorting Filters */}
      <FilterBar
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedSector={selectedSector}
        setSelectedSector={setSelectedSector}
        selectedCountry={selectedCountry}
        setSelectedCountry={setSelectedCountry}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      {/* Core Newspaper Columns */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Main Editorial Articles Feed (3 Cols wide) */}
          <div className="lg:col-span-3 flex flex-col gap-8">
            
            {loading && articles.length === 0 ? (
              // Loading Skeleton State
              <div className="flex flex-col gap-6 select-none">
                <div className="w-full h-80 bg-zinc-900/30 border border-zinc-900 rounded-lg animate-pulse p-6 flex flex-col justify-end">
                  <div className="h-4 w-32 bg-zinc-800 rounded mb-3" />
                  <div className="h-6 w-3/4 bg-zinc-800 rounded mb-2" />
                  <div className="h-6 w-1/2 bg-zinc-800 rounded" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-64 bg-zinc-900/20 border border-zinc-900 rounded animate-pulse" />
                  ))}
                </div>
              </div>
            ) : error ? (
              // Error Connection Feedback
              <div className="border border-zinc-900 bg-zinc-950/40 rounded-lg p-12 text-center flex flex-col items-center select-none">
                <WifiOff className="w-10 h-10 text-rose-500 mb-4" />
                <h3 className="text-base font-mono font-bold text-zinc-300">NEWS AGGREGATION TERMINATED</h3>
                <p className="text-zinc-500 text-xs mt-2 max-w-sm leading-relaxed">
                  {error}. Please check your connection parameters or configure keys in the environment.
                </p>
                <button
                  onClick={() => fetchNews(true)}
                  className="mt-6 flex items-center gap-1.5 text-xs font-mono py-1.5 px-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>RE-CONNECT FEEDS</span>
                </button>
              </div>
            ) : filteredArticles.length === 0 && matchedStocks.length === 0 ? (
              // Empty search/filter state
              <div className="border border-dashed border-zinc-900 bg-zinc-950/20 rounded p-16 text-center flex flex-col items-center select-none">
                <FileText className="w-10 h-10 text-zinc-600 mb-4" />
                <h3 className="text-xs font-mono font-bold text-zinc-400">NO FINANCIAL DEBITS RECORDED</h3>
                <p className="text-zinc-500 text-[11px] mt-2 max-w-xs leading-relaxed font-mono">
                  Zero results matching filter/query have bypassed AI validation.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                    setSelectedSector('All Sectors');
                    setSelectedCountry('All Regions');
                  }}
                  className="mt-6 text-[10px] font-mono py-1 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded cursor-pointer transition-colors"
                >
                  RESET SEARCH FILTERS
                </button>
              </div>
            ) : (
              // Full Editorial Print Layout
              <div className="flex flex-col gap-10">
                
                {/* 1. Integrated Search Results (Stocks + News) */}
                {searchQuery && (
                  <section className="flex flex-col gap-6">
                    <div className="flex items-center gap-2 mb-2 border-b border-zinc-900 pb-3">
                      <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      <h3 className="text-xs font-mono font-bold text-zinc-400 tracking-wider uppercase">
                        Unified Search Results: "{searchQuery}"
                      </h3>
                    </div>

                    {/* Matched Stocks Row */}
                    {(matchedStocks.length > 0 || searchingStocks) && (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest px-1">
                          {searchingStocks ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                          <span>{searchingStocks ? 'Syncing Market Data...' : 'Matched Market Assets'}</span>
                        </div>
                        {matchedStocks.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {matchedStocks.map((stock) => {
                              const isPositive = stock.changePercent >= 0;
                              return (
                                <div key={stock.symbol} className="bg-zinc-900/40 border border-zinc-800 p-3 rounded flex justify-between items-center group hover:border-zinc-700 transition-all">
                                  <div>
                                    <div className="text-xs font-mono font-bold text-zinc-100">{stock.symbol}</div>
                                    <div className="text-[10px] text-zinc-500 font-mono truncate max-w-[100px]">{stock.name}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xs font-mono font-bold text-zinc-100">{stock.price.toFixed(2)}</div>
                                    <div className={`text-[10px] font-mono font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                      {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Matched Articles Grid */}
                    {filteredArticles.length > 0 && (
                      <div className="flex flex-col gap-3 mt-4">
                        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest px-1">
                          <FileText className="w-3 h-3" />
                          <span>Related Financial News</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {filteredArticles.map((article) => (
                            <NewsCard
                              key={article.id}
                              article={article}
                              onReadMore={setActiveArticle}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {/* 2. Lead Editorial Spotlight Hero (Only shown on "All" view to ground page design) */}
                {spotlightArticle && selectedCategory === 'All' && selectedSector === 'All Sectors' && selectedCountry === 'All Regions' && !searchQuery && (
                  <section className="w-full bg-zinc-950 border border-zinc-900 rounded-md overflow-hidden hover:border-zinc-800 transition-colors duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-5">
                      
                      {/* Left: Content panel */}
                      <div className="md:col-span-3 p-6 md:p-8 flex flex-col justify-between">
                        <div>
                          
                          {/* Banner row */}
                          <div className="flex items-center gap-2 select-none mb-4">
                            <span className="bg-emerald-950/30 text-emerald-400 border border-emerald-900/60 text-[9px] font-mono font-black tracking-widest py-0.5 px-2 rounded-sm shadow-md">
                              EDITORIAL LEAD
                            </span>
                            
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {spotlightArticle.sourceName.toUpperCase()}
                            </span>

                            {spotlightArticle.country && (
                              <span className="text-[9px] text-zinc-400 font-mono border border-zinc-800 px-1.5 rounded uppercase">
                                {spotlightArticle.country}
                              </span>
                            )}
                          </div>

                          {/* Hero title */}
                          <h2
                            onClick={() => setActiveArticle(spotlightArticle)}
                            className="text-2xl md:text-3xl font-black font-serif text-zinc-100 leading-tight cursor-pointer hover:text-white transition-colors select-text"
                          >
                            {spotlightArticle.title}
                          </h2>

                          {/* Hero abstract */}
                          <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed mt-4 line-clamp-3 select-text font-serif">
                            {spotlightArticle.description || "The global financial grid undergoes critical consolidation. Technical details are breaking in real-time."}
                          </p>

                          {/* Highlight indicators if available */}
                          {spotlightArticle.summary && spotlightArticle.summary.length > 0 && (
                            <ul className="mt-5 hidden sm:flex flex-col gap-2 select-text">
                              {spotlightArticle.summary.slice(0, 2).map((b, i) => (
                                <li key={i} className="text-[11px] text-zinc-400 flex items-start gap-1.5 leading-snug">
                                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                                  <span>{b}</span>
                                </li>
                              ))}
                            </ul>
                          )}

                        </div>

                        {/* Hero footer action */}
                        <div className="mt-8 pt-4 border-t border-zinc-900/60 flex justify-between items-center select-none">
                          <div className="text-[10px] font-mono text-zinc-500">
                            RELEVANCE MATCH: <span className="font-bold text-zinc-300">{spotlightArticle.relevanceScore}%</span>
                            {spotlightArticle.sector && <span className="ml-3 opacity-60">| {spotlightArticle.sector.toUpperCase()}</span>}
                          </div>

                          <button
                            onClick={() => setActiveArticle(spotlightArticle)}
                            className="text-[10px] font-mono py-1.5 px-4 bg-zinc-100 hover:bg-white text-black font-bold rounded-sm transition-all duration-150 cursor-pointer shadow-md"
                          >
                            READ BRIEFING
                          </button>
                        </div>

                      </div>

                      {/* Right: Media box */}
                      <div className="md:col-span-2 relative aspect-[16/10] md:aspect-auto min-h-[220px] md:min-h-[350px] bg-zinc-900 overflow-hidden select-none">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={spotlightArticle.urlToImage || 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=400&auto=format&fit=crop'}
                          alt={spotlightArticle.title}
                          className="object-cover w-full h-full filter brightness-90"
                        />
                        
                        <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-sm border border-zinc-800 text-zinc-300 text-[9px] font-mono py-0.5 px-2 rounded">
                          {spotlightArticle.category.toUpperCase()}
                        </div>
                      </div>

                    </div>
                  </section>
                )}

                {/* 3. Structured Newspaper Layout vs Focused Filter Layout */}
                {selectedCategory === 'All' && selectedSector === 'All Sectors' && selectedCountry === 'All Regions' && !searchQuery ? (
                  // BEAUTIFUL PRINT CATEGORY COLUMNS
                  <div className="flex flex-col gap-12">
                    {Object.entries(sectionedArticles).map(([key, group]) => {
                      if (group.items.length === 0) return null;
                      
                      return (
                        <section key={key} className="flex flex-col border-t border-zinc-900 pt-8 select-none">
                          {/* Section Title & Jump Navigation Link */}
                          <div className="flex justify-between items-end mb-6">
                            <h3 className="text-sm font-mono font-bold tracking-[0.2em] text-zinc-200 uppercase flex items-center gap-2">
                              <span className="h-2 w-2 bg-zinc-300 rounded-sm" />
                              {group.title}
                            </h3>
                            
                            <button
                              onClick={() => setSelectedCategory(group.filterTarget)}
                              className="text-[10px] font-mono font-bold text-zinc-500 hover:text-zinc-200 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <span>VIEW ALL</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Sub-grid (Max 4 items to keep the page clean and perfectly balanced) */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {group.items.slice(0, 4).map((article) => (
                              <NewsCard
                                key={article.id}
                                article={article}
                                onReadMore={setActiveArticle}
                              />
                            ))}
                          </div>
                        </section>
                      );
                    })}
                  </div>
                ) : (
                  // FOCUSED SINGLE COLUMN VIEW (Used when filters or search are active)
                  !searchQuery && (
                    <section className="flex flex-col select-none">
                      <div className="flex items-center gap-2 mb-6 border-b border-zinc-900 pb-3">
                        <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full" />
                        <h3 className="text-xs font-mono font-bold text-zinc-400 tracking-wider uppercase">
                          FOCUSED NEWS DESK — {
                            selectedSector !== 'All Sectors' ? selectedSector : 
                            selectedCountry !== 'All Regions' ? selectedCountry :
                            selectedCategory
                          }
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredArticles.map((article) => (
                          <NewsCard
                            key={article.id}
                            article={article}
                            onReadMore={setActiveArticle}
                          />
                        ))}
                      </div>
                    </section>
                  )
                )}

              </div>
            )}

          </div>

          {/* Markets watch sidebar (1 Col wide) */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            
            {/* Quick Informational Notice */}
            <div className="bg-zinc-900/30 border border-zinc-900 rounded p-4 text-[11px] leading-relaxed text-zinc-500 font-sans select-none">
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-zinc-400 mb-2">
                <Info className="w-3.5 h-3.5 text-zinc-500" />
                <span>EDITORIAL FILTER</span>
              </div>
              <p>
                FinScope employs an automated NLP relevance framework to isolate politics, gossip, and sports. Only capital market developments and business intelligence are aggregated.
              </p>
            </div>

            {/* Market tickers widgets sidebar */}
            <MarketOverview />

          </div>

        </div>
      </main>

      {/* Floating Refresh Trigger */}
      <div className="fixed bottom-6 right-6 z-40 select-none">
        <button
          onClick={() => fetchNews(true)}
          disabled={refreshing || loading}
          className="flex items-center gap-2 py-3 px-5 bg-zinc-100 hover:bg-white text-black font-mono text-xs font-bold rounded-full shadow-2xl transition-all hover:scale-103 cursor-pointer disabled:opacity-50 relative group"
        >
          {refreshing || loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-black" />
          ) : (
            <RefreshCw className="w-4 h-4 text-black group-hover:rotate-45 transition-transform duration-200" />
          )}
          <span>{refreshing ? 'FETCHING...' : 'REFRESH'}</span>
          
          {lastUpdated && !refreshing && (
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          )}
        </button>

        {/* Float Timestamp tag */}
        {lastUpdated && (
          <div className="text-[9px] font-mono text-zinc-500 text-right mt-1.5 mr-2 tracking-wide font-medium bg-black/80 py-0.5 px-2 rounded-sm inline-block float-right select-none border border-zinc-900">
            SYNCED UTC {lastUpdated}
          </div>
        )}
      </div>

      {/* Dedicated Premium Reader Modal */}
      <ArticleReaderModal
        article={activeArticle}
        onClose={() => setActiveArticle(null)}
      />

    </div>
  );
}
