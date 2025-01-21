declare module 'finnhub' {
  export class DefaultApi {
    apiKey: string;
    stockCandles(
      symbol: string,
      resolution: string,
      from: number,
      to: number,
      callback: (error: Error | null, data: FinnhubResponse) => void
    ): void;
  }

  interface FinnhubResponse {
    c: number[];  // close prices
    h: number[];  // high prices
    l: number[];  // low prices
    o: number[];  // open prices
    s: string;    // status
    t: number[];  // timestamps
    v: number[];  // volumes
  }

  const finnhub: {
    DefaultApi: typeof DefaultApi;
  };
  export default finnhub;
}