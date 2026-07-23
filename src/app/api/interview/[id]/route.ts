import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth-helpers';
import { checkRateLimit } from '@/lib/rate-limit';
import { scoreInterviewAnswer } from '@/lib/ai/coach';
import { NextResponse } from 'next/server';

const AI_RATE_LIMIT_MAX = Number(process.env.AI_RATE_LIMIT_MAX) || 20;
const AI_RATE_LIMIT_WINDOW_MS = 10 * 60_000;

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

    const rl = await checkRateLimit(user.id, 'ai', AI_RATE_LIMIT_MAX, AI_RATE_LIMIT_WINDOW_MS);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many AI requests. Please try again in a few minutes.' },
        { status: 429, headers: { 'Retry-After': '600' } }
      );
    }

    const { questionId, userAnswer } = await request.json();
    if (!questionId || typeof userAnswer !== 'string' || !userAnswer.trim()) {
      return NextResponse.json({ error: 'questionId and userAnswer are required' }, { status: 400 });
    }

    // Question must belong to this session's assigned set — prevents
    // recording an attempt against a question never issued in this session.
    const assignedQuestionIds: string[] = session.transcript
      ? (JSON.parse(session.transcript).questions ?? [])
      : [];
    if (!assignedQuestionIds.includes(questionId)) {
      return NextResponse.json({ error: 'Question is not part of this session' }, { status: 400 });
    }

    const question = await db.question.findUnique({ where: { id: questionId } });
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Score is always computed server-side from the model — never trust a
    // client-supplied score/feedback, which would let a user forge their own
    // interview results.
    const coachResult = await scoreInterviewAnswer(
      question.question,
      userAnswer,
      `Role: ${question.role}, Type: ${question.type}, Skill: ${question.skillArea}`,
    );

    const attempt = await db.questionAttempt.create({
      data: {
        sessionId: id,
        questionId,
        userAnswer,
        aiFeedback: JSON.stringify(coachResult),
        score: coachResult.score,
        rubricBreakdown: JSON.stringify(coachResult.rubricBreakdown),
      },
    });

    return NextResponse.json({
      ...attempt,
      rubricBreakdown: coachResult.rubricBreakdown,
      whatWorked: coachResult.whatWorked,
      whatToImprove: coachResult.whatToImprove,
      strongerSampleAnswer: coachResult.strongerSampleAnswer,
      followUpQuestion: coachResult.followUpQuestion,
    }, { status: 201 });
  } catch (error) {
    console.error('Interview POST answer error:', error);
    return NextResponse.json({ error: 'Failed to submit answer' }, { status: 500 });
  }
}
