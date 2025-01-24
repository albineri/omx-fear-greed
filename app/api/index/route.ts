import { calculateFearGreedIndex } from '@/src/lib/calculations';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const data = await calculateFearGreedIndex();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch market data' }, 
      { status: 500 }
    );
  }
}