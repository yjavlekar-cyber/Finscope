'use client';

import React, { useEffect, useState } from 'react';
import { Search, Globe, Clock, ShieldCheck, RefreshCw, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { MarketAsset } from '@/lib/types';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  matchedStocks: MarketAsset[];
  searchingStocks: boolean;
}

export default function Header({ searchQuery, setSearchQuery, matchedStocks, searchingStocks }: HeaderProps) {
  const [time, setTime] = useState<string>('');
  const [formattedDate, setFormattedDate] = useState<string>('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      setTime(
        now.toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    }
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    setFormattedDate(new Date().toLocaleDateString('en-US', options).toUpperCase());
  }, []);

  return (
    <header className="w-full bg-zinc-950 border-b border-zinc-900 pt-6 pb-4 px-4 sm:px-8 select-none relative z-50">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-6">
        
        {/* Top Meta Line */}
        <div className="w-full flex flex-col sm:flex-row justify-between items-center text-[10px] text-zinc-500 font-mono tracking-widest border-b border-zinc-900/60 pb-3 gap-2">
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-zinc-500" />
            <span>GLOBAL EDITION — LONDON • NEW YORK • TOKYO</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-emerald-400 bg-emerald-950/20 border border-emerald-900/40 py-0.5 px-2 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>AD-FREE PLATFORM</span>
            </div>
            
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              <span>UTC {time || '--:--:--'}</span>
            </div>
          </div>
        </div>

        {/* Nameplate */}
        <div className="text-center my-2">
          <h1 className="text-4xl sm:text-6xl font-black tracking-[0.25em] text-zinc-100 font-serif select-none uppercase transition-all duration-300">
            FINSCOPE
          </h1>
          <p className="text-[11px] sm:text-xs font-mono tracking-[0.4em] text-zinc-500 mt-2.5 uppercase">
            AI-Powered Digital Financial Journal
          </p>
        </div>

        {/* Date line & Search bar Section */}
        <div className="w-full flex flex-col md:flex-row justify-between items-center border-t border-b border-zinc-900 py-3 gap-4">
          <div className="text-[11px] font-bold text-zinc-400 font-serif tracking-widest text-center md:text-left">
            {formattedDate || 'LOADING DATE...'}
          </div>

          {/* Search Input Container */}
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-zinc-500" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search RELIANCE, Bitcoin, AAPL..."
              className="w-full pl-9 pr-4 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 focus:bg-zinc-900 transition-all font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-zinc-300 text-xs font-mono"
              >
                CLEAR
              </button>
            )}

            {/* Dropdown Suggestions */}
            {(searchQuery && isFocused) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-950 border border-zinc-800 rounded-md shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-2 border-b border-zinc-900 bg-zinc-900/20 text-[9px] font-mono text-zinc-500 uppercase tracking-widest flex justify-between items-center">
                  <span>Market Intelligence</span>
                  {searchingStocks && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                </div>

                <div className="max-h-60 overflow-y-auto no-scrollbar">
                  {searchingStocks && matchedStocks.length === 0 && (
                    <div className="p-4 text-center text-zinc-500 text-[10px] font-mono">
                      SYNCING MARKET DATA...
                    </div>
                  )}

                  {matchedStocks.length > 0 ? (
                    matchedStocks.map((stock) => {
                      const isPositive = stock.changePercent >= 0;
                      return (
                        <div 
                          key={stock.symbol} 
                          className="p-3 border-b border-zinc-900/50 hover:bg-zinc-900/40 flex justify-between items-center group cursor-pointer transition-colors"
                        >
                          <div>
                            <div className="text-[11px] font-mono font-bold text-zinc-100">{stock.symbol}</div>
                            <div className="text-[9px] text-zinc-500 font-mono truncate max-w-[120px] uppercase">{stock.name}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[11px] font-mono font-bold text-zinc-100">${stock.price.toLocaleString()}</div>
                            <div className={`text-[9px] font-mono font-bold flex items-center justify-end gap-0.5 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {isPositive ? <TrendingUp className="w-2 h-2" /> : <TrendingDown className="w-2 h-2" />}
                              {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : !searchingStocks && (
                    <div className="p-4 text-center text-zinc-600 text-[10px] font-mono italic">
                      NO TICKERS FOUND FOR "{searchQuery.toUpperCase()}"
                    </div>
                  )}
                </div>

                <div className="p-2 bg-zinc-900/40 text-[9px] font-mono text-zinc-500 text-center border-t border-zinc-900">
                  PRESS ENTER FOR FULL NEWS ANALYSIS
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
