import { db } from '@/lib/db';
import { getUserIdFromHeader, verifyAuth } from '@/lib/auth-helpers';
import { NextResponse } from 'next/server';

export async function GET(
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
    const resume = await db.resume.findUnique({ where: { id } });
    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    if (resume.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      ...resume,
      truthFlags: resume.truthFlags ? JSON.parse(resume.truthFlags) : null,
    });
  } catch (error) {
    console.error('Resume GET by ID error:', error);
    return NextResponse.json({ error: 'Failed to fetch resume' }, { status: 500 });
  }
}

export async function PUT(
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

    const existing = await db.resume.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    if (existing.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();

    const resume = await db.resume.update({
      where: { id },
      data: {
        score: data.score,
        improvedVersion: data.improvedVersion,
        truthFlags: data.truthFlags ? JSON.stringify(data.truthFlags) : undefined,
      },
    });

    return NextResponse.json({
      ...resume,
      truthFlags: resume.truthFlags ? JSON.parse(resume.truthFlags) : null,
    });
  } catch (error) {
    console.error('Resume PUT error:', error);
    return NextResponse.json({ error: 'Failed to update resume' }, { status: 500 });
  }
}
