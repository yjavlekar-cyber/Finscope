# FinScope 📰

FinScope is a clean, modern, ultra-fast **finance-only e-newspaper** web application. Styled as a premium digital financial journal (combining *The Financial Times* editorial grids with *Bloomberg Terminal* monospace visual density), it aggregates, filters, deduplicates, and analyzes market developments with zero advertisement clutter, zero popups, and zero entertainment gossip.

---

## Key Core Features

1. **Finance-Only Semantic Filtering**
   * Uses an automated keyword classification framework to isolate macroeconomics, banking, startups, venture capital, IPOs, cryptocurrency, and stock markets.
   * Strips out celebrity gossip, sports events, pop-culture, gaming, and generic tech drama.

2. **Hybrid Operational Baseline**
   * **Baseline Mode (Immediate Uptime)**: Works out of the box using public Google News RSS feeds (CNBC, Reuters, Bloomberg, FT) and local Natural Language Processing heuristics.
   * **Premium AI Mode (Configurable)**: Upgrades seamlessly to high-frequency NewsAPI queries, Finnhub stock feeds, and Gemini-2.5-Flash processing once API keys are added.

3. **In-House NLP Heuristic Engine (`src/lib/analyzer.ts`)**
   * **Sorensen-Dice Similarity Check**: Detects high-overlap headlines within a 24-hour feed to automatically drop duplicate reporting.
   * **VADER-Lite Sentiment Lexicon**: Scans titles and abstracts against over 60 positive/negative financial markers (e.g. *earnings-beat*, *IPO*, *bankruptcy*, *default*) to calculate immediate Bullish, Bearish, or Neutral sentiments.

4. **Gemini AI Batch Summarizer (`src/lib/gemini.ts`)**
   * Groups breaking events into high-density slices (batches of 8) and passes them to `gemini-2.5-flash` to:
     * Generate 3 concise, bulleted macroeconomic impact takeaways.
     * Strip clickbait suffixes (e.g. ` - Reuters`, ` - Bloomberg`).
     * Rate strict financial relevance density (0% to 100%).

5. **Ticking Financial Tickers & Sparklines**
   * Scroll marquee at the top showing real-time ticks.
   * Sidebar market watchlist drawing highly responsive mini-history graphs using custom **SVG sparklines** mapped directly in React.
   * ETF proxying (`SPY`, `QQQ`, `DIA`) to bypass index-feed limitations on free Finnhub tiers.
   * Deterministic clock-synchronized simulator that guarantees realistic ticking curves if API keys are not configured.

---

## Technology Stack

* **Core Framework**: Next.js 16 (App Router)
* **Language**: TypeScript 5
* **Styling Engine**: Tailwind CSS v4 (Dark-mode first default)
* **Iconography**: Lucide React
* **Hosting Target**: Vercel

---

## Directory Architecture

```
finscope/
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root context, Playfair Display serif font, and SEO metadata
│   │   ├── page.tsx           # Home view managing editorial spotlight, search, & polling
│   │   ├── globals.css        # Tailwind v4 configuration, custom scrollbars
│   │   └── api/
│   │       ├── news/
│   │       │   └── route.ts   # Core news api (IP token-bucket rate limiter, 3-minute cache)
│   │       └── market/
│   │           └── route.ts   # Market consolidating api (15-second cache, live ETF proxies)
│   ├── components/
│   │   ├── TickerTape.tsx     # Infinite-loop scrolling financial marquee
│   │   ├── Header.tsx         # Traditional nameplate with system clock and search
│   │   ├── FilterBar.tsx      # Chronological, relevance, and editorial sorters
│   │   ├── NewsCard.tsx       # Sentiment-glowing grid cards with visual badges
│   │   ├── MarketOverview.tsx # Watchlist sidebar with direct SVG sparklines
│   │   └── ArticleReaderModal.tsx # Premium overlay displaying AI takeaways & source redirects
│   └── lib/
│       ├── parser.ts          # RSS aggregator and NewsAPI proxy decoder
│       ├── analyzer.ts        # Local text deduplication, VADER sentiment, & relevance checkers
│       ├── gemini.ts          # Gemini API HTTP client with batch REST architecture
│       └── types.ts           # Unified TypeScript interfaces
├── .env.local.example         # Setup template for API keys
├── package.json               # Package manifests and runner scripts
└── tsconfig.json              # TypeScript compiler settings
```

---

## Developer Quickstart

### 1. Clone & Install Dependencies
Navigate to your project workspace directory and run:
```bash
npm install
```

### 2. Configure Environment Keys
To unlock live tickers, real-time NewsAPI aggregates, and Gemini AI briefings, copy the environment template to your local environment file:
```bash
cp .env.local.example .env.local
```
Open `.env.local` in your text editor and add your credentials:
```env
GEMINI_API_KEY=AIzaSy...     # Get from Google AI Studio
NEWS_API_KEY=your_key...     # Get from NewsAPI.org
FINNHUB_API_KEY=your_key...  # Get from Finnhub.io
```
*(If left blank, FinScope operates on fallback RSS pipelines and deterministic simulated price curves immediately!)*

### 3. Launch Development Server
```bash
npm run dev
```
Open your browser to [http://localhost:3000](http://localhost:3000) to view the live dashboard.

### 4. Compile Production Build
```bash
npm run build
```

---

## Vercel Deployment Guide

FinScope is fully optimized for immediate serverless deployment on Vercel:

1. Push your codebase to a GitHub, GitLab, or Bitbucket repository.
2. Log in to [Vercel](https://vercel.com/) and click **Add New** > **Project**.
3. Import your FinScope repository.
4. Expand the **Environment Variables** section and configure your keys:
   * `GEMINI_API_KEY`
   * `NEWS_API_KEY`
   * `FINNHUB_API_KEY`
5. Click **Deploy**. Vercel will compile the Next.js routes and host your serverless API routes instantly!

---

## Security & Caching Details

* **Cache Protection**: In-memory server-side caches block rapid repeating requests, keeping NewsAPI and Gemini consumption at minimal levels (3-minute news cache, 15-second market cache).
* **Token-Bucket Rate Limiter**: The `/api/news` endpoint utilizes a memory bucket tracking client IP. If a single IP triggers more than 15 refreshes in a single minute, the API returns a graceful HTTP `429 Too Many Requests` error.
