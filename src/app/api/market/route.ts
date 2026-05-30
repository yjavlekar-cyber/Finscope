import { NextResponse } from 'next/server';
import { MarketAsset } from '@/lib/types';

// Cache for market data
let marketCache: { data: MarketAsset[]; timestamp: number } | null = null;
const CACHE_DURATION = 15000; // 15 seconds cache

/**
 * Generates deterministic mock market values that fluctuate based on current time
 * to create a beautiful, ticking "live" atmosphere in the UI even without API keys.
 */
function getDeterministicMockMarkets(): MarketAsset[] {
  const now = new Date();
  const minutes = now.getMinutes() + (now.getSeconds() / 60);
  
  // Create deterministic fluctuations using sine/cosine curves based on the current hour/minute
  const wave1 = Math.sin(minutes * 0.2) * 0.003;
  const wave2 = Math.cos(minutes * 0.5) * 0.002;
  const cryptoWave = Math.sin(minutes * 0.8) * 0.015;

  const sp500Price = 5280.15 * (1 + wave1 + wave2);
  const nasdaqPrice = 16840.40 * (1 - wave1 + wave2 * 1.5);
  const dowPrice = 39070.80 * (1 + wave2 * 0.8);
  const btcPrice = 67250.00 * (1 + cryptoWave);
  const goldPrice = 2345.60 * (1 - wave2 * 0.3);
  const crudeOilPrice = 77.80 * (1 + wave1 * 0.5);

  const spChangePercent = (wave1 + wave2) * 100;
  const nasdaqChangePercent = (-wave1 + wave2 * 1.5) * 100;
  const dowChangePercent = (wave2 * 0.8) * 100;
  const btcChangePercent = cryptoWave * 100;
  const goldChangePercent = (-wave2 * 0.3) * 100;
  const oilChangePercent = (wave1 * 0.5) * 100;

  const assets: MarketAsset[] = [
    {
      symbol: '.INX',
      name: 'S&P 500 Index',
      price: parseFloat(sp500Price.toFixed(2)),
      change: parseFloat((sp500Price * spChangePercent / 100).toFixed(2)),
      changePercent: parseFloat(spChangePercent.toFixed(2)),
      category: 'Indices',
      sparkline: generateSparklinePoints(5280, spChangePercent)
    },
    {
      symbol: '.IXIC',
      name: 'NASDAQ Composite',
      price: parseFloat(nasdaqPrice.toFixed(2)),
      change: parseFloat((nasdaqPrice * nasdaqChangePercent / 100).toFixed(2)),
      changePercent: parseFloat(nasdaqChangePercent.toFixed(2)),
      category: 'Indices',
      sparkline: generateSparklinePoints(16840, nasdaqChangePercent)
    },
    {
      symbol: '.DJI',
      name: 'Dow Jones Industrial',
      price: parseFloat(dowPrice.toFixed(2)),
      change: parseFloat((dowPrice * dowChangePercent / 100).toFixed(2)),
      changePercent: parseFloat(dowChangePercent.toFixed(2)),
      category: 'Indices',
      sparkline: generateSparklinePoints(39070, dowChangePercent)
    },
    {
      symbol: 'BTC-USD',
      name: 'Bitcoin',
      price: parseFloat(btcPrice.toFixed(2)),
      change: parseFloat((btcPrice * btcChangePercent / 100).toFixed(2)),
      changePercent: parseFloat(btcChangePercent.toFixed(2)),
      category: 'Crypto',
      sparkline: generateSparklinePoints(67250, btcChangePercent, 12)
    },
    {
      symbol: 'GC=F',
      name: 'Gold Troy Ounce',
      price: parseFloat(goldPrice.toFixed(2)),
      change: parseFloat((goldPrice * goldChangePercent / 100).toFixed(2)),
      changePercent: parseFloat(goldChangePercent.toFixed(2)),
      category: 'Commodities',
      sparkline: generateSparklinePoints(2345, goldChangePercent)
    },
    {
      symbol: 'CL=F',
      name: 'Crude Oil WTI',
      price: parseFloat(crudeOilPrice.toFixed(2)),
      change: parseFloat((crudeOilPrice * oilChangePercent / 100).toFixed(2)),
      changePercent: parseFloat(oilChangePercent.toFixed(2)),
      category: 'Commodities',
      sparkline: generateSparklinePoints(77.8, oilChangePercent)
    }
  ];

  return assets;
}

function generateSparklinePoints(base: number, currentChangePercent: number, len = 10): number[] {
  const points: number[] = [];
  const multiplier = currentChangePercent / 100;
  for (let i = 0; i < len; i++) {
    // Generate organic curves climbing/falling to match current percentage
    const stepMultiplier = multiplier * (i / (len - 1));
    const noise = Math.sin(i * 1.5) * 0.001;
    points.push(base * (1 + stepMultiplier + noise));
  }
  return points;
}

/**
 * Connects to live Finnhub API for quote calculations.
 * Finnhub free limits us to stock quotes, so we proxy indices via popular ETFs:
 * S&P 500 -> SPY, NASDAQ -> QQQ, DOW -> DIA
 */
async function fetchLiveFinnhubQuotes(apiKey: string): Promise<MarketAsset[] | null> {
  const symbolMap = [
    { symbol: 'SPY', name: 'S&P 500 ETF (SPY)', displaySymbol: '.INX', category: 'Indices' as const },
    { symbol: 'QQQ', name: 'NASDAQ 100 ETF (QQQ)', displaySymbol: '.IXIC', category: 'Indices' as const },
    { symbol: 'DIA', name: 'Dow Jones ETF (DIA)', displaySymbol: '.DJI', category: 'Indices' as const },
    { symbol: 'AAPL', name: 'Apple Inc.', displaySymbol: 'AAPL', category: 'Stocks' as const },
    { symbol: 'TSLA', name: 'Tesla Inc.', displaySymbol: 'TSLA', category: 'Stocks' as const },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', displaySymbol: 'NVDA', category: 'Stocks' as const }
  ];

  try {
    const promises = symbolMap.map(async item => {
      const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${item.symbol}&token=${apiKey}`);
      if (!res.ok) throw new Error(`Finnhub error on ${item.symbol}`);
      const quote = await res.json();
      
      // c: Current price, d: Change, dp: Change percent
      if (quote.c === 0 || !quote.c) throw new Error('Empty quote returned');

      // Adjust ETF price back to index values for index display representation
      let scalar = 1;
      if (item.symbol === 'SPY') scalar = 10;
      else if (item.symbol === 'QQQ') scalar = 40;
      else if (item.symbol === 'DIA') scalar = 100;

      const price = quote.c * scalar;
      const change = quote.d * scalar;
      const changePercent = quote.dp;

      return {
        symbol: item.displaySymbol,
        name: item.name,
        price: parseFloat(price.toFixed(2)),
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2)),
        category: item.category,
        sparkline: generateSparklinePoints(price, changePercent)
      };
    });

    const parsedAssets: MarketAsset[] = await Promise.all(promises);

    // Complement with live CoinGecko BTC pricing
    let btcAsset: MarketAsset = {
      symbol: 'BTC-USD',
      name: 'Bitcoin',
      price: 67250,
      change: 850,
      changePercent: 1.25,
      category: 'Crypto',
      sparkline: generateSparklinePoints(67250, 1.25)
    };

    try {
      const cryptoRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true');
      if (cryptoRes.ok) {
        const cryptoData = await cryptoRes.json();
        if (cryptoData.bitcoin) {
          const price = cryptoData.bitcoin.usd;
          const changePercent = cryptoData.bitcoin.usd_24h_change || 0;
          const change = price * (changePercent / 100);
          btcAsset = {
            symbol: 'BTC-USD',
            name: 'Bitcoin',
            price: parseFloat(price.toFixed(2)),
            change: parseFloat(change.toFixed(2)),
            changePercent: parseFloat(changePercent.toFixed(2)),
            category: 'Crypto',
            sparkline: generateSparklinePoints(price, changePercent)
          };
        }
      }
    } catch (_) {
      // Gracefully ignore coingecko error, use standard proxy
    }

    parsedAssets.push(btcAsset);

    // Add Commodities fallback since finnhub doesn't support them on free tiers
    const wave = Math.sin(new Date().getMinutes() * 0.1) * 0.5;
    parsedAssets.push({
      symbol: 'GC=F',
      name: 'Gold Troy Ounce',
      price: parseFloat((2350 + wave * 15).toFixed(2)),
      change: parseFloat((wave * 15).toFixed(2)),
      changePercent: parseFloat(wave.toFixed(2)),
      category: 'Commodities',
      sparkline: generateSparklinePoints(2350, wave)
    });

    return parsedAssets;
  } catch (error) {
    console.error('[FinScope Market] Error fetching live Finnhub tickers:', error);
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const querySymbol = searchParams.get('symbol')?.toUpperCase();
  const finnhubKey = process.env.FINNHUB_API_KEY;
  const now = Date.now();

  // Handle single symbol lookup
  if (querySymbol) {
    let asset: MarketAsset | null = null;
    
    if (finnhubKey) {
      try {
        const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${querySymbol}&token=${finnhubKey}`);
        const quote = await res.json();
        if (quote.c && quote.c !== 0) {
          asset = {
            symbol: querySymbol,
            name: `${querySymbol} Inc.`,
            price: parseFloat(quote.c.toFixed(2)),
            change: parseFloat(quote.d.toFixed(2)),
            changePercent: parseFloat(quote.dp.toFixed(2)),
            category: 'Stocks',
            sparkline: generateSparklinePoints(quote.c, quote.dp)
          };
        }
      } catch (e) {
        console.error(`[FinScope Market] Error fetching specific symbol ${querySymbol}:`, e);
      }
    }

    // Deterministic mock for ANY searched symbol if API fails
    if (!asset) {
      const basePrice = Math.abs(querySymbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 500) + 50;
      const fluctuation = Math.sin(now / 10000) * 2;
      asset = {
        symbol: querySymbol,
        name: `${querySymbol} Common Stock`,
        price: parseFloat((basePrice + fluctuation).toFixed(2)),
        change: parseFloat(fluctuation.toFixed(2)),
        changePercent: parseFloat(((fluctuation / basePrice) * 100).toFixed(2)),
        category: 'Stocks',
        sparkline: generateSparklinePoints(basePrice, (fluctuation / basePrice) * 100)
      };
    }

    return NextResponse.json({ asset });
  }

  // Standard multi-asset fetch
  if (marketCache && (now - marketCache.timestamp < CACHE_DURATION)) {
    return NextResponse.json({ assets: marketCache.data, cached: true });
  }

  let assets: MarketAsset[] | null = null;

  if (finnhubKey) {
    assets = await fetchLiveFinnhubQuotes(finnhubKey);
  }

  if (!assets) {
    assets = getDeterministicMockMarkets();
  }

  marketCache = {
    data: assets,
    timestamp: now
  };

  return NextResponse.json({
    assets,
    cached: false,
    lastRefreshed: new Date(now).toISOString()
  });
}
