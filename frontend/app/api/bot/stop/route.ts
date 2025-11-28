import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3001';
    
    const response = await fetch(`${BOT_API_URL}/api/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error('Failed to stop bot');
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to stop bot' },
      { status: 500 }
    );
  }
}
