// Keep just these imports
import { IndexData, IndicatorsData } from '@/src/types';

const api_key = process.env.FINNHUB_API_KEY as string;
const finnhubClient = new (require('finnhub')).DefaultApi({
  apiKey: api_key,
  isJsonMime: (input: string) => input === 'application/json'
});

interface FinnhubCandles {
  c: number[];  // close prices
  h: number[];  // high prices
  l: number[];  // low prices
  o: number[];  // open prices
  s: string;    // status
  t: number[];  // timestamps
  v: number[];  // volumes
}
interface HistoricalRow {
  close: number;
  date: Date;
  open: number;
  high: number;
  low: number;
  volume: number;
}

// Helper functions
function calculateMovingAverage(data: number[], window: number): number[] {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) {
      result.push(NaN);
      continue;
    }
    const sum = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
    result.push(sum / window);
  }
  return result;
}

function calculateStandardDeviation(data: number[]): number {
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const squaredDiffs = data.map(x => Math.pow(x - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / data.length;
  return Math.sqrt(variance);
}

// Market indicators
async function calculateMarketMomentum(data: HistoricalRow[]): Promise<number> {
  try {
    const prices = data.map(d => d.close);
    const ma125 = calculateMovingAverage(prices, 125);
    const currentPrice = prices[prices.length - 1];
    const currentMA = ma125[ma125.length - 1];
    
    const pctDiff = ((currentPrice - currentMA) / currentMA) * 100;
    return Math.min(Math.max((pctDiff + 5) * 10, 0), 100);
  } catch (_error) {
    console.error('Error calculating momentum:', _error);
    return 50;
  }
}

async function calculateVolatility(data: HistoricalRow[]): Promise<number> {
  try {
    const prices = data.map(d => d.close);
    const returns = prices.slice(1).map((price, i) => 
      (price - prices[i]) / prices[i]
    );
    
    const std = calculateStandardDeviation(returns);
    const annualizedVol = std * Math.sqrt(252) * 100;
    
    return Math.min(Math.max(100 - (annualizedVol * 2), 0), 100);
  } catch (_error) {
    console.error('Error calculating volatility:', _error);
    return 50;
  }
}

export async function calculateFearGreedIndex(): Promise<IndexData> {
    try {
      const endDate = Math.floor(new Date().getTime() / 1000);
      const startDate = Math.floor(new Date().setMonth(new Date().getMonth() - 1) / 1000);
  
      // Using OMXS30.ST for OMX Stockholm 30 Index
      const stockCandles = await new Promise<FinnhubCandles>((resolve, reject) => {
        finnhubClient.stockCandles("OMXS30.ST", "D", startDate, endDate, (error: Error | null, data: FinnhubCandles) => {
          if (error) {
            reject(error);
          } else {
            resolve(data);
          }
        });
      });
  
      // Convert Finnhub data to our HistoricalRow format
      const omxData: HistoricalRow[] = stockCandles.c.map((close, index) => ({
        close,
        date: new Date(stockCandles.t[index] * 1000),
        open: stockCandles.o[index],
        high: stockCandles.h[index],
        low: stockCandles.l[index],
        volume: stockCandles.v[index]
      }));
  
      if (!omxData || omxData.length === 0) {
        throw new Error('No market data available');
      }
  
      const momentum = await calculateMarketMomentum(omxData);
      const volatility = await calculateVolatility(omxData);
  
      const indicators: IndicatorsData = {
        'Market Momentum': { value: momentum, weight: 0.5 },
        'Market Volatility': { value: volatility, weight: 0.5 }
      };
  
      let totalValue = 0;
      let totalWeight = 0;
  
      Object.values(indicators).forEach(indicator => {
        totalValue += indicator.value * indicator.weight;
        totalWeight += indicator.weight;
      });
  
      const currentIndex = Math.round(totalValue / totalWeight);
  
      return {
        timestamp: new Date().toISOString(),
        currentIndex: Math.min(Math.max(currentIndex, 0), 100),
        indicators
      };
    } catch (_error) {
      console.error('Error calculating fear & greed index:', _error);
      return {
        timestamp: new Date().toISOString(),
        currentIndex: 50,
        indicators: {
          'Market Momentum': { value: 50, weight: 0.5 },
          'Market Volatility': { value: 50, weight: 0.5 }
        }
      };
    }
  }