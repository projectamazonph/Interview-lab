import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth-helpers';
import { checkGuideAccess } from '@/lib/subscription-guard';
import { sanitizeText } from '@/lib/sanitize';
import { NextResponse } from 'next/server';
import { unstable_cache, revalidateTag } from 'next/cache';

// Guides change rarely (admin-authored content) and are read on every
// learning-path page view — cache the DB round-trip and invalidate
// explicitly from the admin create/update paths below.
const getCachedGuides = unstable_cache(
  (where: Record<string, unknown>) =>
    db.guide.findMany({ where, orderBy: [{ level: 'asc' }, { title: 'asc' }] }),
  ['guides-list'],
  { tags: ['guides'], revalidate: 300 },
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');
    const role = searchParams.get('role');

    // Auth required for non-beginner guides
    const user = await getUserFromRequest(request);

    if (level && level !== 'beginner' && level !== 'all') {
      if (!user) {
        return NextResponse.json(
          { error: 'Authentication required for premium guides.' },
          { status: 401 }
        );
      }
      const access = checkGuideAccess(user.subscriptionTier, level);
      if (!access.allowed) {
        return NextResponse.json(
          { error: access.reason || 'Subscription required for premium guides.' },
          { status: 403 }
        );
      }
    }

    const where: Record<string, unknown> = { status: 'published' };
    if (level && level !== 'all') where.level = level;
    if (role && role !== 'all') where.role = { in: [role, 'General'] };

    const guides = await getCachedGuides(where);

    // Strip content for guides the user doesn't have access to
    const userTier = user?.subscriptionTier ?? 'free';
    const sanitized = guides.map((guide: Record<string, unknown>) => {
      const access = checkGuideAccess(userTier, guide.level as string);
      if (access.allowed) return guide;
      // Return only metadata without content
      const { content: _content, ...meta } = guide;
      return { ...meta, content: null, locked: true };
    });

    return NextResponse.json({ guides: sanitized });
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

    revalidateTag('guides', { expire: 0 });
    return NextResponse.json(guide, { status: 201 });
  } catch (error) {
    console.error('Guides POST error:', error);
    return NextResponse.json({ error: 'Failed to create guide' }, { status: 500 });
  }
}
