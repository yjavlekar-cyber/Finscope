'use client';

import React, { useEffect } from 'react';
import { NewsArticle } from '@/lib/types';
import { X, ExternalLink, Calendar, Shield, Cpu, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ArticleReaderModalProps {
  article: NewsArticle | null;
  onClose: () => void;
}

export default function ArticleReaderModal({ article, onClose }: ArticleReaderModalProps) {
  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (article) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [article]);

  if (!article) return null;

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (_) {
      return 'RECENT';
    }
  };

  const getSentimentLabel = (sentiment: NewsArticle['sentiment']) => {
    switch (sentiment) {
      case 'Bullish':
        return {
          text: 'BULLISH / MARKET-POSITIVE',
          color: 'text-emerald-400 border-emerald-900/60 bg-emerald-950/20',
          icon: <TrendingUp className="w-4 h-4 text-emerald-400" />
        };
      case 'Bearish':
        return {
          text: 'BEARISH / MARKET-NEGATIVE',
          color: 'text-rose-400 border-rose-900/60 bg-rose-950/20',
          icon: <TrendingDown className="w-4 h-4 text-rose-400" />
        };
      default:
        return {
          text: 'NEUTRAL SENTIMENT',
          color: 'text-zinc-400 border-zinc-800 bg-zinc-900/30',
          icon: <Minus className="w-4 h-4 text-zinc-500" />
        };
    }
  };

  const sentimentLabel = getSentimentLabel(article.sentiment);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-text overflow-y-auto">
      {/* Dark Blur Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-md transition-opacity duration-300"
      />

      {/* Reader Container */}
      <div className="relative w-full max-w-3xl bg-zinc-950 border border-zinc-900 rounded-md shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-[scaleUp_0.2s_ease-out]">
        <style>{`
          @keyframes scaleUp {
            from { transform: scale(0.96); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `}</style>

        {/* Modal Header Actions */}
        <div className="flex justify-between items-center px-6 py-4 bg-zinc-950 border-b border-zinc-900 sticky top-0 z-10 select-none">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest text-zinc-500 font-bold uppercase">
              FINSCOPE EDITOR DESK
            </span>
            <span className="h-1 w-1 rounded-full bg-zinc-800" />
            <span className="text-[9px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 py-0.5 px-2 rounded-sm uppercase">
              {article.category}
            </span>
          </div>
          
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded transition-colors cursor-pointer"
            title="Close briefing"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-6 md:p-8 flex-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          
          {/* Main Headline */}
          <h1 className="text-2xl md:text-3xl font-black text-zinc-100 font-serif leading-tight mb-4">
            {article.title}
          </h1>

          {/* Article Meta row */}
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-400 font-mono pb-6 border-b border-zinc-900/60 mb-6 select-none">
            <div className="font-bold text-zinc-200 uppercase tracking-wider">{article.sourceName}</div>
            <div className="h-3 w-px bg-zinc-800" />
            <div className="flex items-center gap-1.5 text-zinc-500">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(article.publishedAt)}</span>
            </div>
            
            {/* Relevance Indicator */}
            <div className="h-3 w-px bg-zinc-800" />
            <div className="text-zinc-500">
              RELEVANCE: <span className="text-zinc-300 font-bold">{article.relevanceScore}%</span>
            </div>
          </div>

          {/* Large Media Banner */}
          <div className="w-full aspect-[16/9] bg-zinc-900 border border-zinc-900 rounded overflow-hidden mb-6 select-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.urlToImage || 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=400&auto=format&fit=crop'}
              alt={article.title}
              className="object-cover w-full h-full filter brightness-95"
            />
          </div>

          {/* Sentiment Panel */}
          <div className={`flex items-center gap-2.5 border py-2.5 px-4 rounded mb-6 select-none ${sentimentLabel.color}`}>
            {sentimentLabel.icon}
            <span className="text-[10px] font-mono font-bold tracking-wider">{sentimentLabel.text}</span>
          </div>

          {/* AI Core Bullet Briefing Container */}
          <div className="bg-zinc-900/30 border border-zinc-900/80 rounded p-6 mb-6">
            <div className="flex items-center gap-2 text-zinc-300 text-[10px] font-mono font-bold mb-4 tracking-wider select-none">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>FINSCOPE AI EXECUTIVE BRIEFING</span>
            </div>

            <ul className="flex flex-col gap-3.5">
              {(article.summary || [article.description || 'No detailed briefing summary is available.']).map((bullet, idx) => (
                <li key={idx} className="flex gap-2.5 items-start text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans select-text">
                  <ChevronRight className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Core Content Body (Fallback or Full abstract) */}
          <div className="prose prose-invert max-w-none text-zinc-300 text-sm leading-relaxed font-serif select-text mt-4">
            <p>
              {article.description && !article.summary 
                ? article.description 
                : "Additional market analysis, order book adjustments, and relevant corporate actions are updated continuously. Subscriptions to premium real-time order sheets can be integrated in later modules."
              }
            </p>
          </div>

        </div>

        {/* Modal Actions Footer */}
        <div className="px-6 py-4 bg-zinc-950 border-t border-zinc-900 flex flex-col sm:flex-row justify-between items-center gap-4 sticky bottom-0 z-10 select-none">
          <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
            <Shield className="w-3.5 h-3.5 text-zinc-600" />
            <span>SECURED ENCRYPTED TRANSACTION READINGS</span>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none text-[11px] font-mono tracking-wider py-2 px-5 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 rounded cursor-pointer transition-colors"
            >
              DISMISS
            </button>
            
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-[11px] font-mono tracking-wider py-2 px-5 bg-zinc-100 text-black font-bold hover:bg-white rounded transition-colors cursor-pointer"
            >
              <span>FULL COVERAGE</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
