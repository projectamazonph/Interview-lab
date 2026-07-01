import { db } from '@/lib/db';
import { getUserIdFromHeader, verifyAuth } from '@/lib/auth-helpers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const userId = getUserIdFromHeader(request);
    const user = await verifyAuth(userId);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rawBody = await request.json();
    const mode = String(rawBody.mode || '').replace(/<[^>]*>/g, '').trim();
    const targetRole = rawBody.targetRole ? String(rawBody.targetRole).replace(/<[^>]*>/g, '').trim() : null;

    // Validate mode
    const VALID_MODES = ['quick_drill', 'role_interview', 'technical_screen', 'client_communication', 'final_interview', 'practical_debrief'];
    if (!VALID_MODES.includes(mode)) {
      return NextResponse.json({ error: 'Invalid interview mode' }, { status: 400 });
    }

    // Build question query based on mode
    const where: Record<string, unknown> = { status: 'published' };
    let questionCount = 10;

    switch (mode) {
      case 'quick_drill':
        questionCount = 5;
        // Random mix of all types
        break;
      case 'role_interview':
        questionCount = 10;
        if (targetRole && targetRole !== 'General') {
          where.role = { in: [targetRole, 'General'] };
        }
        break;
      case 'technical_screen':
        where.type = { in: ['technical', 'scenario', 'case_study'] };
        where.skillArea = { in: ['PPC', 'reporting', 'optimization', 'keyword_research', 'campaign_structure'] };
        questionCount = 8;
        break;
      case 'client_communication':
        where.type = { in: ['behavioral', 'scenario'] };
        where.skillArea = { in: ['client_communication'] };
        questionCount = 8;
        break;
      case 'final_interview':
        // Mixed behavioral and technical
        if (targetRole && targetRole !== 'General') {
          where.role = { in: [targetRole, 'General'] };
        }
        questionCount = 10;
        break;
      case 'practical_debrief':
        where.type = { in: ['scenario', 'case_study'] };
        where.skillArea = { in: ['PPC', 'optimization', 'campaign_structure'] };
        questionCount = 5;
        break;
    }

    // Use random ordering for variety
    const allQuestions = await db.question.findMany({ where });
    const shuffled = allQuestions.sort(() => Math.random() - 0.5);
    const questions = shuffled.slice(0, questionCount);

    const session = await db.interviewSession.create({
      data: {
        userId: user.id,
        mode,
        targetRole,
        transcript: JSON.stringify({ questions: questions.map(q => q.id) }),
      },
    });

    return NextResponse.json({
      session: {
        id: session.id,
        mode: session.mode,
        targetRole: session.targetRole,
        startedAt: session.startedAt,
      },
      questions: questions.map(q => ({
        id: q.id,
        question: q.question,
        role: q.role,
        difficulty: q.difficulty,
        type: q.type,
        skillArea: q.skillArea,
        answerFormat: q.answerFormat,
        timeLimit: q.timeLimit,
        whyEmployersAsk: q.whyEmployersAsk,
        strongAnswerPoints: q.strongAnswerPoints,
        weakAnswerWarnings: q.weakAnswerWarnings,
      })),
    });
  } catch (error) {
    console.error('Interview POST error:', error);
    return NextResponse.json({ error: 'Failed to create interview' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const userId = getUserIdFromHeader(request);
    const user = await verifyAuth(userId);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessions = await db.interviewSession.findMany({
      where: { userId: user.id },
      orderBy: { startedAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Interview GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch interviews' }, { status: 500 });
  }
}
