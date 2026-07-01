import { db } from '@/lib/db';
import { getUserIdFromHeader, verifyAuth } from '@/lib/auth-helpers';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromHeader(request);
    const user = await verifyAuth(userId);
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

    let body: { transcript?: string } = {};
    try {
      body = await request.json();
    } catch {
      // No body provided, that's OK
    }

    const attempts = await db.questionAttempt.findMany({
      where: { sessionId: id },
    });

    const overallScore = attempts.length > 0
      ? attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length
      : 0;

    const updateData: Record<string, unknown> = {
      completedAt: new Date(),
      overallScore,
    };
    if (body.transcript) {
      // Transcript must be stored as a string — stringify if it's an object/array
      updateData.transcript = typeof body.transcript === 'string'
        ? body.transcript
        : JSON.stringify(body.transcript);
    }

    const updatedSession = await db.interviewSession.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      sessionId: updatedSession.id,
      overallScore,
      totalQuestions: attempts.length,
      completedAt: updatedSession.completedAt,
    });
  } catch (error) {
    console.error('Interview complete error:', error);
    return NextResponse.json({ error: 'Failed to complete session' }, { status: 500 });
  }
}
