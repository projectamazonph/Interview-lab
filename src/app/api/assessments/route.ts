import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const difficulty = searchParams.get('difficulty');

    const where: Record<string, unknown> = {};
    if (role && role !== 'all') where.role = role;
    if (difficulty && difficulty !== 'all') where.difficulty = difficulty;

    const assessments = await db.assessment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ assessments });
  } catch (error) {
    console.error('Assessments GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch assessments' }, { status: 500 });
  }
}
