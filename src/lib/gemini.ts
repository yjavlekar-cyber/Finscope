import { NewsArticle } from './types';
import { analyzeSentiment, evaluateRelevance, classifyCategory } from './analyzer';

interface AIBatchResult {
  index: number;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  importance: 'High' | 'Medium' | 'Low';
  summary: string[];
  relevanceScore: number;
  cleanedTitle: string;
  sector: string;
  country: string;
}

/**
 * Uses Gemini API to enrich news articles in batches for maximum speed and efficiency.
 */
export async function enrichArticlesWithAI(articles: NewsArticle[]): Promise<NewsArticle[]> {
  const apiKey = process.env.GEMINI_API_KEY;

  // Fallback: If no Gemini key, use heuristic calculations
  if (!apiKey) {
    console.log('[FinScope AI] GEMINI_API_KEY not found. Operating in local heuristic baseline mode.');
    return articles.map(article => {
      const sentiment = analyzeSentiment(article.title, article.description || '');
      const relevance = evaluateRelevance(article.title, article.description || '');
      
      // Heuristic importance rating
      let importance: 'High' | 'Medium' | 'Low' = 'Low';
      const text = `${article.title} ${article.description}`.toLowerCase();
      if (relevance.score > 70 || text.includes('fed ') || text.includes('interest rate') || text.includes('gdp') || text.includes('merger') || text.includes('acquisition') || text.includes('earnings beat') || text.includes('crash') || text.includes('rally')) {
        importance = 'High';
      } else if (relevance.score > 40) {
        importance = 'Medium';
      }

      // Heuristic bullet highlights (splits sentences)
      const rawSummary = (article.description || '').split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
      const summary = rawSummary.slice(0, 3).map(s => s.startsWith('- ') ? s.slice(2) : s);

      return {
        ...article,
        sentiment,
        relevanceScore: relevance.score,
        importanceScore: importance,
        summary: summary.length > 0 ? summary : [article.description || 'No further description available.'],
        category: classifyCategory(article.title, article.description || ''),
        sector: 'General Finance',
        country: 'Global'
      };
    });
  }

  // Slice articles in batches of 8 for optimal latency and token boundaries
  const batchSize = 8;
  const processedArticles: NewsArticle[] = [];

  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize);
    
    // Prepare concise batch payload to avoid feeding huge chunks to the model
    const batchPayload = batch.map((art, idx) => ({
      index: idx,
      title: art.title,
      description: art.description || '',
      source: art.sourceName
    }));

    const prompt = `You are a senior financial analyst and news editor at FinScope. 
    Analyze this batch of finance news articles. 
    For each article, clean the title of any sensational clickbait or garbage endings (like " - Bloomberg" or "Reuters").
    Determine the financial sentiment (Bullish, Bearish, or Neutral) and importance level (High, Medium, or Low).
    Provide a relevance score (0-100) indicating how strictly relevant it is to markets/finance.
    Provide exactly 3 bullet-point highlights summarizing the macroeconomic or microeconomic impact (max 15 words per bullet).
    Identify the Sector (e.g., Technology, Healthcare, Energy, Finance, Consumer, Crypto, Manufacturing).
    Identify the Country/Region (e.g., USA, UK, India, China, Europe, Global).

    Input articles:
    ${JSON.stringify(batchPayload, null, 2)}

    Return a JSON array containing objects matching this EXACT TypeScript schema:
    Array<{
      index: number;
      sentiment: "Bullish" | "Bearish" | "Neutral";
      importance: "High" | "Medium" | "Low";
      summary: string[];
      relevanceScore: number;
      cleanedTitle: string;
      sector: string;
      country: string;
    }>`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1, // low temperature for precise facts and structure
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API responded with status ${response.status}`);
      }

      const responseData = await response.json();
      const rawText = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!rawText) {
        throw new Error('Gemini API returned an empty candidate or body structure');
      category: classifyCategory(article.title, article.description || ''),
      sector: 'Finance',
      country: 'Global'
      };
      });
      }
      ...
      const aiResult = aiResults.find(r => r.index === index) || {
        sentiment: analyzeSentiment(article.title, article.description || ''),
        importance: 'Medium',
        summary: [article.description || ''],
        relevanceScore: 75,
        cleanedTitle: article.title,
        sector: 'Finance',
        country: 'Global'
      };

      processedArticles.push({
        ...article,
        title: aiResult.cleanedTitle || article.title,
        sentiment: aiResult.sentiment,
        relevanceScore: aiResult.relevanceScore,
        importanceScore: aiResult.importance,
        summary: aiResult.summary && aiResult.summary.length > 0 ? aiResult.summary : [article.description || ''],
        category: classifyCategory(article.title, article.description || ''),
        sector: aiResult.sector || 'Finance',
        country: aiResult.country || 'Global'
      });
    } catch (error) {
      console.error('[FinScope AI] Error processing batch with Gemini. Falling back to heuristics:', error);
      
      // Fallback batch to heuristic
      batch.forEach(article => {
        const sentiment = analyzeSentiment(article.title, article.description || '');
        const relevance = evaluateRelevance(article.title, article.description || '');
        const summary = (article.description || '').split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10).slice(0, 3);
        
        processedArticles.push({
          ...article,
          sentiment,
          relevanceScore: relevance.score,
          importanceScore: relevance.score > 70 ? 'High' : 'Medium',
          summary: summary.length > 0 ? summary : [article.description || ''],
          category: classifyCategory(article.title, article.description || ''),
          sector: 'Markets',
          country: 'Global'
        });
      });
    }
  }

  return processedArticles;
}
