// src/types/index.ts

export interface MarketIndicator {
    value: number;
    weight: number;
  }
  
  export interface IndicatorsData {
    [key: string]: MarketIndicator;
  }
  
  export interface IndexData {
    timestamp: string;
    currentIndex: number;
    indicators: IndicatorsData;
  }
  
  export interface HistoricalDataPoint {
    date: string;
    value: number;
  }
  
  export type SentimentLevel = 
    | 'Extrem Rädsla' 
    | 'Rädsla' 
    | 'Neutral' 
    | 'Girighet' 
    | 'Extrem Girighet';