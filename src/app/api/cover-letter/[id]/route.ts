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
    const coverLetter = await db.coverLetter.findUnique({ where: { id } });
    if (!coverLetter) {
      return NextResponse.json({ error: 'Cover letter not found' }, { status: 404 });
    }

    if (coverLetter.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      ...coverLetter,
      truthFlags: coverLetter.truthFlags ? JSON.parse(coverLetter.truthFlags) : null,
    });
  } catch (error) {
    console.error('CoverLetter GET by ID error:', error);
    return NextResponse.json({ error: 'Failed to fetch cover letter' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const existing = await db.coverLetter.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Cover letter not found' }, { status: 404 });
    }

    if (existing.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();

    const coverLetter = await db.coverLetter.update({
      where: { id },
      data: {
        generatedLetter: data.generatedLetter,
        truthFlags: data.truthFlags ? JSON.stringify(data.truthFlags) : undefined,
      },
    });

    return NextResponse.json({
      ...coverLetter,
      truthFlags: coverLetter.truthFlags ? JSON.parse(coverLetter.truthFlags) : null,
    });
  } catch (error) {
    console.error('CoverLetter PUT error:', error);
    return NextResponse.json({ error: 'Failed to update cover letter' }, { status: 500 });
  }
}
