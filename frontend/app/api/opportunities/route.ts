import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3001';
    
    const response = await fetch(`${BOT_API_URL}/api/opportunities`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch opportunities');
    }
    
    const opportunities = await response.json();
    return NextResponse.json(opportunities);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch opportunities' },
      { status: 500 }
    );
  }
}
