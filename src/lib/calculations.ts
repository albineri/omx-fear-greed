import yahooFinance from 'yahoo-finance2';
import { IndexData, IndicatorsData } from '@/types';

interface HistoricalRow {
  close: number;
  date: string;
}

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

// Keep your other helper functions and update their parameter types similarly
// ...

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

    Object.entries(indicators).forEach(([_key, indicator]) => {
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