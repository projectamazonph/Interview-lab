import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth-helpers';
import { sanitizeText } from '@/lib/sanitize';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resumes = await db.resume.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ resumes });
  } catch (error) {
    console.error('Resume GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch resumes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rawBody = await request.json();

    // Only allow specific fields, sanitize all text
    const originalText = sanitizeText(rawBody.originalText);
    const targetRole = sanitizeText(rawBody.targetRole);

    if (!originalText) {
      return NextResponse.json({ error: 'Resume text is required' }, { status: 400 });
    }

    const resume = await db.resume.create({
      data: {
        userId: user.id,
        originalText,
        targetRole,
      },
    });

    return NextResponse.json(resume, { status: 201 });
  } catch (error) {
    console.error('Resume POST error:', error);
    return NextResponse.json({ error: 'Failed to create resume' }, { status: 500 });
  }
}
