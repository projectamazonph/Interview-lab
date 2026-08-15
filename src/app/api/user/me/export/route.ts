import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth-helpers';
import { NextResponse } from 'next/server';

/**
 * Export all data belonging to the authenticated user.
 * Returns a JSON snapshot of all user-owned records — ready for
 * GDPR / CCPA data portability requests.
 */
export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [profile, interviewSessions, resumes, coverLetters, guideProgress] =
      await Promise.all([
        db.userProfile.findUnique({ where: { userId: user.id } }),
        db.interviewSession.findMany({
          where: { userId: user.id },
          include: { attempts: { include: { question: true } } },
          orderBy: { startedAt: 'desc' },
        }),
        db.resume.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } }),
        db.coverLetter.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } }),
        db.guideProgress.findMany({
          where: { userId: user.id },
          include: { guide: { select: { title: true, slug: true } } },
        }),
      ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscriptionTier: user.subscriptionTier,
        createdAt: user.createdAt,
      },
      profile: profile
        ? {
            ...profile,
            toolsKnown: profile.toolsKnown ? JSON.parse(profile.toolsKnown) : null,
            weakAreas: profile.weakAreas ? JSON.parse(profile.weakAreas) : null,
          }
        : null,
      interviewSessions,
      resumes,
      coverLetters,
      guideProgress,
    };

    return NextResponse.json(exportData, {
      headers: {
        'Content-Disposition': `attachment; filename="interview-lab-data-${user.id}.json"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}
