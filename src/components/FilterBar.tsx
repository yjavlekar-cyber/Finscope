'use client';

import React from 'react';
import { SlidersHorizontal, Award, CalendarClock, Activity, Tag, Globe2 } from 'lucide-react';

interface FilterBarProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedSector: string;
  setSelectedSector: (sector: string) => void;
  selectedCountry: string;
  setSelectedCountry: (country: string) => void;
  sortBy: 'Latest' | 'Importance' | 'Relevance';
  setSortBy: (sort: 'Latest' | 'Importance' | 'Relevance') => void;
}

const CATEGORIES = [
  'All',
  'Markets',
  'Stocks',
  'Crypto',
  'Economy',
  'Banking',
  'Startups',
  'IPO',
  'Global Finance'
];

const SECTORS = [
  'All Sectors',
  'Technology',
  'Healthcare',
  'Energy',
  'Finance',
  'Consumer',
  'Manufacturing',
  'Real Estate'
];

const COUNTRIES = [
  'All Regions',
  'USA',
  'India',
  'China',
  'UK',
  'Europe',
  'Japan',
  'Global'
];

export default function FilterBar({
  selectedCategory,
  setSelectedCategory,
  selectedSector,
  setSelectedSector,
  selectedCountry,
  setSelectedCountry,
  sortBy,
  setSortBy
}: FilterBarProps) {
  return (
    <div className="w-full bg-zinc-950/60 backdrop-blur-md border-b border-zinc-900 py-3 px-4 sm:px-8 sticky top-0 z-40 select-none">
      <div className="max-w-7xl mx-auto flex flex-col gap-4">
        
        {/* Row 1: Main Categories & Sorting */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
          {/* Category Scroll Container */}
          <div className="w-full lg:w-auto overflow-x-auto flex gap-1.5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent py-1 select-none">
            {CATEGORIES.map((category) => {
              const isSelected = selectedCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`text-[11px] font-mono tracking-wider py-1.5 px-3.5 border transition-all duration-150 whitespace-nowrap cursor-pointer rounded-sm ${
                    isSelected
                      ? 'bg-zinc-100 text-black border-zinc-100 font-bold shadow-[0_0_12px_rgba(255,255,255,0.15)]'
                      : 'bg-zinc-900/40 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  {category.toUpperCase()}
                </button>
              );
            })}
          </div>

          {/* Sorting Toggles */}
          <div className="flex gap-2 items-center w-full lg:w-auto justify-end border-t border-zinc-900 lg:border-t-0 pt-3 lg:pt-0">
            <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-mono mr-2">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>SORT:</span>
            </div>

            <button
              onClick={() => setSortBy('Latest')}
              className={`flex items-center gap-1.5 text-[10px] font-mono py-1 px-3 border transition-colors cursor-pointer rounded ${
                sortBy === 'Latest'
                  ? 'bg-zinc-800 text-zinc-100 border-zinc-700'
                  : 'bg-transparent text-zinc-500 border-zinc-900 hover:text-zinc-300'
              }`}
            >
              <CalendarClock className="w-3 h-3" />
              <span>CHRONO</span>
            </button>

            <button
              onClick={() => setSortBy('Importance')}
              className={`flex items-center gap-1.5 text-[10px] font-mono py-1 px-3 border transition-colors cursor-pointer rounded ${
                sortBy === 'Importance'
                  ? 'bg-zinc-800 text-zinc-100 border-zinc-700'
                  : 'bg-transparent text-zinc-500 border-zinc-900 hover:text-zinc-300'
              }`}
            >
              <Award className="w-3 h-3" />
              <span>EDITORIAL</span>
            </button>

            <button
              onClick={() => setSortBy('Relevance')}
              className={`flex items-center gap-1.5 text-[10px] font-mono py-1 px-3 border transition-colors cursor-pointer rounded ${
                sortBy === 'Relevance'
                  ? 'bg-zinc-800 text-zinc-100 border-zinc-700'
                  : 'bg-transparent text-zinc-500 border-zinc-900 hover:text-zinc-300'
              }`}
            >
              <Activity className="w-3 h-3" />
              <span>DENSITY</span>
            </button>
          </div>
        </div>

        {/* Row 2: Sector & Country Filters (Collapsible/Secondary) */}
        <div className="flex flex-col sm:flex-row gap-6 border-t border-zinc-900/50 pt-3">
          {/* Sector Filter */}
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center gap-1.5 text-zinc-500 text-[9px] font-mono uppercase tracking-widest flex-shrink-0">
              <Tag className="w-3 h-3" />
              <span>Sector:</span>
            </div>
            <div className="overflow-x-auto flex gap-1.5 no-scrollbar">
              {SECTORS.map((sector) => (
                <button
                  key={sector}
                  onClick={() => setSelectedSector(sector)}
                  className={`text-[9px] font-mono py-1 px-2.5 rounded-full border transition-all whitespace-nowrap cursor-pointer ${
                    selectedSector === sector
                      ? 'bg-zinc-200 text-black border-zinc-200 font-bold'
                      : 'bg-zinc-900/60 text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  {sector.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Country Filter */}
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center gap-1.5 text-zinc-500 text-[9px] font-mono uppercase tracking-widest flex-shrink-0">
              <Globe2 className="w-3 h-3" />
              <span>Region:</span>
            </div>
            <div className="overflow-x-auto flex gap-1.5 no-scrollbar">
              {COUNTRIES.map((country) => (
                <button
                  key={country}
                  onClick={() => setSelectedCountry(country)}
                  className={`text-[9px] font-mono py-1 px-2.5 rounded-full border transition-all whitespace-nowrap cursor-pointer ${
                    selectedCountry === country
                      ? 'bg-zinc-200 text-black border-zinc-200 font-bold'
                      : 'bg-zinc-900/60 text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  {country.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
