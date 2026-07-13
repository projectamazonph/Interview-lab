import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const total = await db.question.count({ where: { status: 'published' } });
    return NextResponse.json({ total });
  } catch (error) {
    console.error('Question count error:', error);
    return NextResponse.json({ total: 0 });
  }
}
