declare module 'finnhub' {
  export interface DefaultApiConfig {
    apiKey: string;
    isJsonMime: (input: string) => boolean;
  }

  export interface FinnhubResponse {
    c: number[];  // close prices
    h: number[];  // high prices
    l: number[];  // low prices
    o: number[];  // open prices
    s: string;    // status
    t: number[];  // timestamps
    v: number[];  // volumes
  }

  export class DefaultApi {
    constructor(config: DefaultApiConfig);
    stockCandles(
      symbol: string,
      resolution: string,
      from: number,
      to: number,
      callback: (error: Error | null, data: FinnhubResponse) => void
    ): void;
  }
}