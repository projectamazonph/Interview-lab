import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth-helpers';
import { sanitizeText } from '@/lib/sanitize';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');
    const role = searchParams.get('role');

    const where: Record<string, unknown> = { status: 'published' };
    if (level && level !== 'all') where.level = level;
    if (role && role !== 'all') where.role = { in: [role, 'General'] };

    const guides = await db.guide.findMany({
      where,
      orderBy: [{ level: 'asc' }, { title: 'asc' }],
    });

    return NextResponse.json({ guides });
  } catch (error) {
    console.error('Guides GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch guides' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized — admin access required' }, { status: 401 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.title || !data.slug || !data.content) {
      return NextResponse.json({ error: 'Title, slug, and content are required' }, { status: 400 });
    }

    // Validate and sanitize fields
    const sanitizedTitle = sanitizeText(data.title);
    const sanitizedSlug = sanitizeText(data.slug);
    const sanitizedContent = sanitizeText(data.content);
    if (!sanitizedTitle || !sanitizedSlug || !sanitizedContent) {
      return NextResponse.json({ error: 'Title, slug, and content must be valid text' }, { status: 400 });
    }

    const VALID_LEVELS = ['beginner', 'intermediate', 'advanced'];
    const VALID_STATUSES = ['draft', 'published'];
    if (data.level && !VALID_LEVELS.includes(data.level)) {
      return NextResponse.json({ error: 'Invalid level value' }, { status: 400 });
    }
    if (data.status && !VALID_STATUSES.includes(data.status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    const guide = await db.guide.create({
      data: {
        title: sanitizedTitle,
        slug: sanitizedSlug,
        level: data.level || 'beginner',
        role: data.role || 'General',
        content: sanitizedContent,
        status: data.status || 'draft',
      },
    });

    return NextResponse.json(guide, { status: 201 });
  } catch (error) {
    console.error('Guides POST error:', error);
    return NextResponse.json({ error: 'Failed to create guide' }, { status: 500 });
  }
}
