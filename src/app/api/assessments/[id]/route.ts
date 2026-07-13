import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth-helpers';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const assessment = await db.assessment.findUnique({ where: { id } });
    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }
    // Strip sensitive fields (answerKey, rubric) for unauthenticated access
    // to prevent leaking assessment answers
    return NextResponse.json({
      id: assessment.id,
      title: assessment.title,
      role: assessment.role,
      difficulty: assessment.difficulty,
      description: assessment.description,
      datasetInfo: assessment.datasetInfo,
    });
  } catch (error) {
    console.error('Assessment GET by ID error:', error);
    return NextResponse.json({ error: 'Failed to fetch assessment' }, { status: 500 });
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
    const { answers } = await request.json();

    const assessment = await db.assessment.findUnique({ where: { id } });
    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    // Log the agent run
    await db.agentRun.create({
      data: {
        userId: user.id,
        agentType: 'practical_test',
        input: JSON.stringify({ assessmentId: id, answers }),
        output: JSON.stringify({ submitted: true }),
      },
    });

    return NextResponse.json({ success: true, assessmentId: id });
  } catch (error) {
    console.error('Assessment POST error:', error);
    return NextResponse.json({ error: 'Failed to submit assessment' }, { status: 500 });
  }
}
