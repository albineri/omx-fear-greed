import { IndexData, IndicatorsData } from '@/src/types';
import axios from 'axios';

interface AlphaVantageData {
  'Time Series (Daily)': {
    [key: string]: {
      '1. open': string;
      '2. high': string;
      '3. close': string;
      '4. low': string;
      '5. volume': string;
    }
  }
}

interface HistoricalRow {
  close: number;
  date: Date;
  open: number;
  high: number;
  low: number;
  volume: number;
}

const api_key = process.env.ALPHA_VANTAGE_API_KEY as string;
if (!api_key) {
  console.error('ALPHA_VANTAGE_API_KEY environment variable is not set');
  throw new Error('Missing API key');
}

// Helper functions remain the same
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

// Market indicators remain the same
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
    console.log("Starting API call, API key exists:", !!process.env.ALPHA_VANTAGE_API_KEY);

    const response = await axios.get<AlphaVantageData>(
      `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=^OMX&apikey=${api_key}`
    );

    if (!response.data['Time Series (Daily)']) {
      throw new Error('No market data available');
    }

    // Convert Alpha Vantage data to our format
    const omxData: HistoricalRow[] = Object.entries(response.data['Time Series (Daily)'])
      .map(([date, data]) => ({
        date: new Date(date),
        open: parseFloat(data['1. open']),
        high: parseFloat(data['2. high']),
        low: parseFloat(data['3. low']),
        close: parseFloat(data['4. close']),
        volume: parseFloat(data['5. volume'])
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

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