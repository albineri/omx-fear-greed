import yahooFinance from 'yahoo-finance2';
import { IndexData, IndicatorsData } from '@/src/types';

interface HistoricalRow {
  close: number;
  date: string;
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
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);

    const omxData = await yahooFinance.historical('^OMX', {
      period1: startDate.toISOString(),
      period2: endDate.toISOString()
    }) as HistoricalRow[];

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