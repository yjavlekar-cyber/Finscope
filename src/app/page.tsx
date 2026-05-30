'use client';

import React, { useEffect, useState, useMemo } from 'react';
import TickerTape from '@/components/TickerTape';
import Header from '@/components/Header';
import FilterBar from '@/components/FilterBar';
import NewsCard from '@/components/NewsCard';
import MarketOverview from '@/components/MarketOverview';
import ArticleReaderModal from '@/components/ArticleReaderModal';
import { NewsArticle } from '@/lib/types';
import { RefreshCw, FileText, Info, Loader2, Sparkles, WifiOff } from 'lucide-react';

export default function Home() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Search, Category, and Sorting State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
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

  // Initial load and 60 seconds auto-polling
  useEffect(() => {
    fetchNews(false);
    
    const interval = setInterval(() => {
      console.log('[FinScope Poller] Running automatic news synchronization...');
      fetchNews(false);
    }, 60000); // 60s auto refresh

    return () => clearInterval(interval);
  }, []);

  // Filtered & Sorted Articles calculation
  const processedArticles = useMemo(() => {
    let result = [...articles];

    // 1. Category Filter
    if (selectedCategory !== 'All') {
      result = result.filter(
        (a) => a.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // 2. Search query filter (checks Title, Description, and Source)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(query) ||
          (a.description || '').toLowerCase().includes(query) ||
          a.sourceName.toLowerCase().includes(query)
      );
    }

    // 3. Sorting Mechanics
    if (sortBy === 'Importance') {
      // High importance first, then Medium, then Low. Keep chronological inside each tier.
      const priority = { High: 3, Medium: 2, Low: 1 };
      result.sort((a, b) => {
        const diff = priority[b.importanceScore] - priority[a.importanceScore];
        if (diff !== 0) return diff;
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      });
    } else if (sortBy === 'Relevance') {
      // Sort strictly by computed relevance density percentage
      result.sort((a, b) => b.relevanceScore - a.relevanceScore);
    } else {
      // Default: Latest chronological first
      result.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    }

    return result;
  }, [articles, selectedCategory, searchQuery, sortBy]);

  // Extract spotlight "Lead Editorial" article (Highest importance breaking piece in current view)
  const spotlightArticle = useMemo(() => {
    if (processedArticles.length === 0) return null;
    
    // Look for first breaking/High article in active set, default to first item
    const highImportance = processedArticles.find(a => a.importanceScore === 'High');
    return highImportance || processedArticles[0];
  }, [processedArticles]);

  // Rest of grid articles (excludes the featured spotlight editorial)
  const gridArticles = useMemo(() => {
    if (!spotlightArticle) return [];
    return processedArticles.filter(a => a.id !== spotlightArticle.id);
  }, [processedArticles, spotlightArticle]);

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
            ) : processedArticles.length === 0 ? (
              // Empty search/filter state
              <div className="border border-dashed border-zinc-900 bg-zinc-950/20 rounded p-16 text-center flex flex-col items-center select-none">
                <FileText className="w-10 h-10 text-zinc-600 mb-4" />
                <h3 className="text-xs font-mono font-bold text-zinc-400">NO FINANCIAL DEBITS RECORDED</h3>
                <p className="text-zinc-500 text-[11px] mt-2 max-w-xs leading-relaxed font-mono">
                  Zero articles matching category "{selectedCategory.toUpperCase()}" with query "{searchQuery}" have bypassed AI validation.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                  className="mt-6 text-[10px] font-mono py-1 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded cursor-pointer transition-colors"
                >
                  RESET SEARCH FILTERS
                </button>
              </div>
            ) : (
              // Full Editorial Print Layout
              <div className="flex flex-col gap-8">
                
                {/* 1. Lead Editorial Spotlight Hero */}
                {spotlightArticle && !searchQuery && (
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

                {/* 2. Secondary Editorial Grid */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {gridArticles.map((article) => (
                    <NewsCard
                      key={article.id}
                      article={article}
                      onReadMore={setActiveArticle}
                    />
                  ))}
                </section>

              </div>
            )}

          </div>

          {/* Markets sidebar (1 Col wide) */}
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
