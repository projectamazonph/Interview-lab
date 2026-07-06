import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth-helpers';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const session = await db.interviewSession.findUnique({
      where: { id },
      include: {
        attempts: {
          include: { question: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      ...session,
      attempts: session.attempts.map((a) => ({
        ...a,
        rubricBreakdown: a.rubricBreakdown ? JSON.parse(a.rubricBreakdown) : null,
      })),
    });
  } catch (error) {
    console.error('Interview GET by ID error:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const session = await db.interviewSession.findUnique({ where: { id } });
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { questionId, userAnswer, aiFeedback, score, rubricBreakdown } = await request.json();

    const attempt = await db.questionAttempt.create({
      data: {
        sessionId: id,
        questionId,
        userAnswer,
        aiFeedback,
        score,
        rubricBreakdown: rubricBreakdown ? JSON.stringify(rubricBreakdown) : null,
      },
    });

    return NextResponse.json({
      ...attempt,
      rubricBreakdown: attempt.rubricBreakdown ? JSON.parse(attempt.rubricBreakdown) : null,
    }, { status: 201 });
  } catch (error) {
    console.error('Interview POST answer error:', error);
    return NextResponse.json({ error: 'Failed to submit answer' }, { status: 500 });
  }
}
