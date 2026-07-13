import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth-helpers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const progress = await db.guideProgress.findMany({
      where: { userId: user.id },
    });

    const parsed = progress.map((p) => ({
      id: p.id,
      guideId: p.guideId,
      completed: p.completed,
      checklist: p.checklist ? JSON.parse(p.checklist) : null,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return NextResponse.json({ progress: parsed });
  } catch (error) {
    console.error('GuideProgress GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { guideId, completed, checklist } = body;

    if (!guideId || typeof guideId !== 'string') {
      return NextResponse.json({ error: 'guideId is required' }, { status: 400 });
    }

    // Verify the guide exists
    const guide = await db.guide.findUnique({ where: { id: guideId } });
    if (!guide) {
      return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
    }

    // Build update data, allowing explicit null/true/false for completed
    const updateData: { completed?: boolean; checklist?: string | null } = {};
    if (completed !== undefined) {
      updateData.completed = Boolean(completed);
    }
    // Allow checklist to be explicitly set to null (clear it) or to a new value
    if (checklist !== undefined) {
      updateData.checklist = checklist ? JSON.stringify(checklist) : null;
    }

    const progress = await db.guideProgress.upsert({
      where: {
        userId_guideId: { userId: user.id, guideId },
      },
      create: {
        userId: user.id,
        guideId,
        completed: completed ?? false,
        checklist: checklist ? JSON.stringify(checklist) : null,
      },
      update: updateData,
    });

    return NextResponse.json({
      progress: {
        id: progress.id,
        guideId: progress.guideId,
        completed: progress.completed,
        checklist: progress.checklist ? JSON.parse(progress.checklist) : null,
        createdAt: progress.createdAt,
        updatedAt: progress.updatedAt,
      },
    });
  } catch (error) {
    console.error('GuideProgress POST error:', error);
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
  }
}
