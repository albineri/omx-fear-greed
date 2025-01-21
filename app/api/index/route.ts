import { NextResponse } from 'next/server';
import { calculateFearGreedIndex } from '@/src/lib/calculations';

export const revalidate = 300;

export async function GET() {
  try {
    const data = await calculateFearGreedIndex();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate index' },
      { status: 500 }
    );
  }
}