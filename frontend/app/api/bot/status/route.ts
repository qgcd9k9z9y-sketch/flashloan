import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3001';
    
    const response = await fetch(`${BOT_API_URL}/api/status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error('Bot API unavailable');
    }
    
    const status = await response.json();
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch bot status' },
      { status: 500 }
    );
  }
}
