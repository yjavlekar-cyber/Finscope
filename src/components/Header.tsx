'use client';

import React, { useEffect, useState } from 'react';
import { Search, Globe, Clock, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function Header({ searchQuery, setSearchQuery }: HeaderProps) {
  const [time, setTime] = useState<string>('');

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

  const getFormattedDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return new Date().toLocaleDateString('en-US', options).toUpperCase();
  };

  return (
    <header className="w-full bg-zinc-950 border-b border-zinc-900 pt-6 pb-4 px-4 sm:px-8 select-none relative">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-6">
        
        {/* Top Meta Line: Edition, Live Clock & Verification Badge */}
        <div className="w-full flex flex-col sm:flex-row justify-between items-center text-[10px] text-zinc-500 font-mono tracking-widest border-b border-zinc-900/60 pb-3 gap-2">
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-zinc-500" />
            <span>GLOBAL EDITION — LONDON • NEW YORK • TOKYO</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-emerald-400 bg-emerald-950/20 border border-emerald-900/40 py-0.5 px-2 rounded-full">
              <ShieldCheck className="w-3 h-3" />
              <span>AD-FREE PLATFORM</span>
            </div>
            
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Clock className="w-3 h-3 text-zinc-500" />
              <span>UTC {time || '--:--:--'}</span>
            </div>
          </div>
        </div>

        {/* Main Newspaper Nameplate Banner */}
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
            {getFormattedDate()}
          </div>

          {/* Search Input Container */}
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-zinc-500" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Apple earnings, Bitcoin, Fed..."
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
          </div>
        </div>
      </div>
    </header>
  );
}
