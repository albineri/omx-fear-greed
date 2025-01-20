// app/api/index/route.ts
import { NextResponse } from 'next/server';
import { calculateFearGreedIndex } from '@/src/lib/calculations';

// Revalidate the data every 5 minutes
export const revalidate = 300;

export async function GET() {
  try {
    // For testing, return a hardcoded value first
    const testData = {
      timestamp: new Date().toISOString(),
      currentIndex: 20, // This gives us a value in the "Fear" range
      indicators: {
        'Market Momentum': { value: 20, weight: 0.5 },
        'Market Volatility': { value: 20, weight: 0.5 }
      }
    };
    
    return NextResponse.json(testData);

    // Once we confirm this works, we can switch back to the real calculation:
    // const data = await calculateFearGreedIndex();
    // return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate index' },
      { status: 500 }
    );
  }
}