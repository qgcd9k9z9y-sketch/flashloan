import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { opportunityId, userPublicKey } = await request.json();
    const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3001';
    
    const response = await fetch(`${BOT_API_URL}/api/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opportunityId, userPublicKey }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Execute API error:', error);
    return NextResponse.json(
      { error: 'Failed to execute arbitrage', details: (error as Error).message },
      { status: 500 }
    );
  }
}
