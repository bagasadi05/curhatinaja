import { NextRequest, NextResponse } from 'next/server';
import { provideUrgentSupport } from '@/ai/flows/provide-urgent-support';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await provideUrgentSupport(body);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 