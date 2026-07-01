import { db } from '@/lib/db';
import { getUserIdFromHeader, verifyAdmin } from '@/lib/auth-helpers';
import { sanitizeText } from '@/lib/sanitize';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const guide = await db.guide.findUnique({ where: { id } });
    if (!guide) {
      return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
    }
    if (guide.status !== 'published') {
      return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
    }
    return NextResponse.json(guide);
  } catch (error) {
    console.error('Guide GET by ID error:', error);
    return NextResponse.json({ error: 'Failed to fetch guide' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromHeader(request);
    const admin = await verifyAdmin(userId);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();

    const update: Record<string, unknown> = {};
    if (data.title !== undefined) update.title = sanitizeText(data.title);
    if (data.slug !== undefined) update.slug = sanitizeText(data.slug);
    if (data.level !== undefined) update.level = data.level;
    if (data.role !== undefined) update.role = data.role;
    if (data.content !== undefined) update.content = sanitizeText(data.content);
    if (data.status !== undefined) update.status = data.status;

    const guide = await db.guide.update({
      where: { id },
      data: update,
    });

    return NextResponse.json(guide);
  } catch (error) {
    console.error('Guide PUT error:', error);
    return NextResponse.json({ error: 'Failed to update guide' }, { status: 500 });
  }
}
