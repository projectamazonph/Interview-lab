import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const difficulty = searchParams.get('difficulty');
    const type = searchParams.get('type');
    const skillArea = searchParams.get('skillArea');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Record<string, unknown> = { status: 'published' };
    if (role && role !== 'all') where.role = role;
    if (difficulty && difficulty !== 'all') where.difficulty = difficulty;
    if (type && type !== 'all') where.type = type;
    if (skillArea && skillArea !== 'all') where.skillArea = skillArea;
    if (search) {
      where.question = { contains: search };
    }

    const [questions, total] = await Promise.all([
      db.question.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.question.count({ where }),
    ]);

    return NextResponse.json({ questions, total });
  } catch (error) {
    console.error('Questions GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}
