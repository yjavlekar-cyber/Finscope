'use client';

import React, { useEffect, useState } from 'react';
import { MarketAsset } from '@/lib/types';
import { TrendingUp, TrendingDown, RefreshCw, Layers } from 'lucide-react';

export default function MarketOverview() {
  const [assets, setAssets] = useState<MarketAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  async function fetchMarkets(isManual = false) {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch('/api/market');
      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets || []);
        setLastRefreshed(new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    } catch (err) {
      console.error('Failed to fetch market widgets:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchMarkets();
    const interval = setInterval(() => fetchMarkets(false), 15000); // Auto update 15s
    return () => clearInterval(interval);
  }, []);

  // SVG Sparkline Drawing Engine
  const renderSparkline = (points: number[] | undefined, isPositive: boolean) => {
    if (!points || points.length < 2) return null;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    
    const width = 75;
    const height = 24;
    
    const mapped = points.map((val, idx) => {
      const x = (idx / (points.length - 1)) * width;
      // Invert Y because SVG coordinates start from top-left
      const y = height - 2 - ((val - min) / range) * (height - 4);
      return `${x},${y}`;
    }).join(' ');

    const strokeColor = isPositive ? '#34d399' : '#f87171'; // emerald-400 or rose-400

    return (
      <svg width={width} height={height} className="overflow-visible select-none">
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={mapped}
          className="drop-shadow-[0_0_2px_rgba(0,0,0,0.5)]"
          style={{ filter: `drop-shadow(0 0 2px ${strokeColor}40)` }}
        />
      </svg>
    );
  };

  if (loading && assets.length === 0) {
    return (
      <div className="w-full bg-zinc-950 border border-zinc-900 rounded p-4 font-mono text-xs text-zinc-500 flex flex-col items-center gap-3">
        <RefreshCw className="w-4 h-4 animate-spin text-zinc-600" />
        <span>SYNCING FINANCIAL TICKERS...</span>
      </div>
    );
  }

  // Group assets by category
  const categories = {
    Indices: assets.filter(a => a.category === 'Indices'),
    Crypto: assets.filter(a => a.category === 'Crypto'),
    Commodities: assets.filter(a => a.category === 'Commodities'),
    Stocks: assets.filter(a => a.category === 'Stocks'),
  };

  return (
    <aside className="w-full bg-zinc-950 border border-zinc-900 rounded p-4 select-none">
      
      {/* Header section */}
      <div className="flex justify-between items-center border-b border-zinc-900 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-zinc-400" />
          <h2 className="text-xs font-mono font-bold tracking-widest text-zinc-200">
            MARKET WATCH
          </h2>
        </div>
        
        <button
          onClick={() => fetchMarkets(true)}
          disabled={refreshing}
          className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded hover:bg-zinc-900 cursor-pointer"
          title="Force market refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-zinc-400' : ''}`} />
        </button>
      </div>

      {/* Asset Categories Grid */}
      <div className="flex flex-col gap-4">
        {Object.entries(categories).map(([category, items]) => {
          if (items.length === 0) return null;
          return (
            <div key={category} className="flex flex-col">
              <span className="text-[10px] font-mono tracking-widest text-zinc-500 font-bold uppercase mb-2">
                {category}
              </span>
              
              <div className="flex flex-col gap-1.5">
                {items.map((asset) => {
                  const isPositive = asset.changePercent >= 0;
                  return (
                    <div
                      key={asset.symbol}
                      className="flex items-center justify-between py-2 px-2.5 rounded bg-zinc-900/20 border border-zinc-900 hover:border-zinc-800 transition-colors duration-150"
                    >
                      {/* Name/Symbol Column */}
                      <div className="flex flex-col max-w-[90px]">
                        <span className="text-[11px] font-mono font-bold text-zinc-200 truncate">{asset.symbol}</span>
                        <span className="text-[9px] text-zinc-500 font-mono truncate">{asset.name}</span>
                      </div>

                      {/* Sparkline column */}
                      <div className="flex-1 flex justify-center px-2">
                        {renderSparkline(asset.sparkline, isPositive)}
                      </div>

                      {/* Price/Performance Column */}
                      <div className="flex flex-col items-end">
                        <span className="text-[11px] font-mono font-semibold text-zinc-100">
                          {asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        
                        <span
                          className={`flex items-center gap-0.5 text-[9px] font-mono font-bold ${
                            isPositive ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                          {isPositive ? '+' : ''}
                          {asset.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Timestamp */}
      {lastRefreshed && (
        <div className="text-[8px] font-mono text-zinc-600 text-right mt-4 tracking-wider">
          FEED SYNCED AT: UTC {lastRefreshed}
        </div>
      )}

    </aside>
  );
}
