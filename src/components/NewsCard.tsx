'use client';

import React from 'react';
import { NewsArticle } from '@/lib/types';
import { TrendingUp, TrendingDown, Minus, Clock, ExternalLink, Bookmark } from 'lucide-react';

interface NewsCardProps {
  article: NewsArticle;
  onReadMore: (article: NewsArticle) => void;
}

export default function NewsCard({ article, onReadMore }: NewsCardProps) {
  // Format relative time
  const getRelativeTime = (isoString: string) => {
    try {
      const now = new Date();
      const past = new Date(isoString);
      const diffMs = now.getTime() - past.getTime();
      const diffMins = Math.floor(diffMs / (60 * 1000));
      const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
      const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

      if (diffMins < 1) return 'JUST NOW';
      if (diffMins < 60) return `${diffMins}M AGO`;
      if (diffHours < 24) return `${diffHours}H AGO`;
      return `${diffDays}D AGO`;
    } catch (_) {
      return 'RECENT';
    }
  };

  const getSentimentStyles = (sentiment: NewsArticle['sentiment']) => {
    switch (sentiment) {
      case 'Bullish':
        return {
          bg: 'bg-emerald-950/30 border-emerald-900/40 text-emerald-400',
          badge: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
          glow: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.08)] hover:border-emerald-800/50',
          icon: <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
        };
      case 'Bearish':
        return {
          bg: 'bg-rose-950/30 border-rose-900/40 text-rose-400',
          badge: 'border-rose-500/30 text-rose-400 bg-rose-500/10',
          glow: 'hover:shadow-[0_0_20px_rgba(244,63,94,0.08)] hover:border-rose-800/50',
          icon: <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
        };
      default:
        return {
          bg: 'bg-zinc-900/40 border-zinc-800/80 text-zinc-400',
          badge: 'border-zinc-800 text-zinc-400 bg-zinc-900/50',
          glow: 'hover:shadow-[0_0_20px_rgba(255,255,255,0.03)] hover:border-zinc-700/50',
          icon: <Minus className="w-3.5 h-3.5 text-zinc-500" />
        };
    }
  };

  const sentimentStyles = getSentimentStyles(article.sentiment);

  return (
    <article
      className={`group flex flex-col bg-zinc-950 border border-zinc-900 rounded overflow-hidden transition-all duration-300 ${sentimentStyles.glow}`}
    >
      
      {/* Article Image Header with Sentiment Underglow */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-zinc-900 select-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={article.urlToImage || 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=400&auto=format&fit=crop'}
          alt={article.title}
          loading="lazy"
          className="object-cover w-full h-full group-hover:scale-103 transition-transform duration-500 filter brightness-90 group-hover:brightness-100"
          onError={(e) => {
            // If image fails, replace with dynamic canvas placeholder
            e.currentTarget.src = 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=600&auto=format&fit=crop';
          }}
        />
        
        {/* Importance Ribbon */}
        {article.importanceScore === 'High' && (
          <div className="absolute top-2.5 left-2.5 bg-amber-500 text-black text-[9px] font-mono font-black tracking-widest py-0.5 px-2 rounded-sm shadow-md">
            BREAKING
          </div>
        )}

        {/* Dynamic Category Tag */}
        <div className="absolute bottom-2.5 left-2.5 bg-black/80 backdrop-blur-sm border border-zinc-800 text-zinc-300 text-[9px] font-mono py-0.5 px-2 rounded">
          {article.category.toUpperCase()}
        </div>

        {/* Sentiment Badge overlay */}
        <div className={`absolute top-2.5 right-2.5 flex items-center gap-1 border py-0.5 px-2 text-[9px] font-mono rounded backdrop-blur-md shadow-md ${sentimentStyles.badge}`}>
          {sentimentStyles.icon}
          <span className="font-bold">{article.sentiment.toUpperCase()}</span>
        </div>
      </div>

      {/* Article Body */}
      <div className="flex-1 flex flex-col p-4">
        
        {/* Headline Meta Info */}
        <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono tracking-tight mb-2.5 select-none">
          <div className="flex items-center gap-1">
            <span className="text-zinc-300 font-bold uppercase">{article.sourceName}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-zinc-600" />
            <span>{getRelativeTime(article.publishedAt)}</span>
          </div>
        </div>

        {/* Main Headline */}
        <h3
          onClick={() => onReadMore(article)}
          className="text-[15px] sm:text-[16px] font-bold text-zinc-100 font-serif leading-snug cursor-pointer group-hover:text-white transition-colors line-clamp-2 select-text"
        >
          {article.title}
        </h3>

        {/* Sub-description / Summary preview */}
        <p className="text-zinc-400 text-xs mt-3 mb-5 leading-relaxed line-clamp-3 select-text">
          {article.description || 'No detailed abstract is provided by the outlet. View editorial dashboard for full highlights.'}
        </p>

        {/* Card Actions Footer */}
        <div className="mt-auto pt-3 border-t border-zinc-900/60 flex justify-between items-center select-none">
          
          {/* Density score indicator */}
          <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-500">
            <span>REL:</span>
            <span className={`font-bold ${article.relevanceScore > 75 ? 'text-zinc-300' : 'text-zinc-500'}`}>
              {article.relevanceScore}%
            </span>
          </div>

          <div className="flex gap-2">
            {/* Read highlights modal button */}
            <button
              onClick={() => onReadMore(article)}
              className="text-[10px] font-mono py-1 px-3 border border-zinc-800 text-zinc-300 bg-zinc-900/30 hover:bg-zinc-100 hover:text-black hover:border-zinc-100 rounded transition-all duration-150 cursor-pointer"
            >
              READ BRIEFING
            </button>
            
            {/* View Raw Article external link */}
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 border border-zinc-900/80 hover:border-zinc-800 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
              title="Read original coverage"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>

      </div>

    </article>
  );
}
