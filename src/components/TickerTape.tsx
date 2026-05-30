'use client';

import React, { useEffect, useState } from 'react';
import { MarketAsset } from '@/lib/types';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function TickerTape() {
  const [assets, setAssets] = useState<MarketAsset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTickers() {
      try {
        const res = await fetch('/api/market');
        if (res.ok) {
          const data = await res.json();
          setAssets(data.assets || []);
        }
      } catch (err) {
        console.error('Failed to load tickers for marquee:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchTickers();
    const interval = setInterval(fetchTickers, 15000); // Ticks every 15s
    return () => clearInterval(interval);
  }, []);

  if (loading && assets.length === 0) {
    return (
      <div className="w-full bg-zinc-950 border-b border-zinc-900 py-2.5 text-xs text-zinc-500 text-center font-mono select-none">
        CONNECTING TO FINSCOPE TICKER FEEDS...
      </div>
    );
  }

  // Duplicate the assets list to ensure a seamless infinite scrolling loop
  const marqueeItems = [...assets, ...assets, ...assets];

  return (
    <div className="w-full bg-black border-b border-zinc-900 py-2 overflow-hidden select-none relative z-50">
      {/* Dynamic inline keyframes for infinite marquee */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-33.333%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 40s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="animate-marquee flex gap-12 items-center">
        {marqueeItems.map((asset, index) => {
          const isPositive = asset.changePercent >= 0;
          return (
            <div
              key={`${asset.symbol}-${index}`}
              className="flex items-center gap-2 font-mono text-xs cursor-pointer hover:bg-zinc-900/50 py-0.5 px-2 rounded transition-colors duration-150"
            >
              <span className="text-zinc-400 font-bold tracking-tight">{asset.symbol}</span>
              <span className="text-zinc-500">{asset.name}</span>
              <span className="text-zinc-100 font-semibold">{asset.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              
              <span
                className={`flex items-center gap-0.5 font-bold ${
                  isPositive ? 'text-emerald-400 drop-shadow-[0_0_4px_rgba(52,211,153,0.2)]' : 'text-rose-400 drop-shadow-[0_0_4px_rgba(248,113,113,0.2)]'
                }`}
              >
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isPositive ? '+' : ''}
                {asset.changePercent.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
