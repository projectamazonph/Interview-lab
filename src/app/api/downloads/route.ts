import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth-helpers';
import { sanitizeText } from '@/lib/sanitize';
import { NextResponse } from 'next/server';
import { unstable_cache, revalidateTag } from 'next/cache';

// Download-center listing changes only via the admin panel — cache the DB
// round-trip and invalidate explicitly on create below.
const getCachedDownloads = unstable_cache(
  (where: Record<string, unknown>) =>
    db.download.findMany({ where, orderBy: [{ category: 'asc' }, { title: 'asc' }] }),
  ['downloads-list'],
  { tags: ['downloads'], revalidate: 300 },
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const category = searchParams.get('category');
    const fileType = searchParams.get('fileType');

    const where: Record<string, unknown> = {};
    if (role && role !== 'all') where.role = { in: [role, 'General'] };
    if (category && category !== 'all') where.category = category;
    if (fileType && fileType !== 'all') where.fileType = fileType;

    const downloads = await getCachedDownloads(where);

    return NextResponse.json({ downloads });
  } catch (error) {
    console.error('Downloads GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch downloads' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getUserFromRequest(request);
    if (!admin || !admin.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized — admin access required' }, { status: 401 });
    }

    const data = await request.json();

    // Sanitize text fields
    const title = sanitizeText(data.title);
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const download = await db.download.create({
      data: {
        title,
        fileType: data.fileType || 'PDF',
        role: data.role || 'General',
        description: sanitizeText(data.description),
        fileName: sanitizeText(data.fileName) || title.toLowerCase().replace(/[^a-z0-9]/g, '-') + '.' + (data.fileType || 'pdf').toLowerCase(),
        accessTier: data.accessTier || 'free',
        category: data.category || 'Other',
      },
    });

    revalidateTag('downloads', { expire: 0 });
    return NextResponse.json(download, { status: 201 });
  } catch (error) {
    console.error('Downloads POST error:', error);
    return NextResponse.json({ error: 'Failed to create download' }, { status: 500 });
  }
}
