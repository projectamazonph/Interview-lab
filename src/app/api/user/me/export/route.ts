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
    const [
      account,
      profile,
      interviewSessions,
      resumes,
      coverLetters,
      guideProgress,
      agentRuns,
      subscription,
      payments,
      verificationTokens,
      rateLimitEntries,
    ] = await Promise.all([
      db.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          name: true,
          subscriptionTier: true,
          isAdmin: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
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
      db.agentRun.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } }),
      db.subscription.findUnique({ where: { userId: user.id } }),
      db.payment.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } }),
      db.verificationToken.findMany({
        where: { email: user.email },
        select: { id: true, email: true, expiresAt: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      db.rateLimitEntry.findMany({
        where: { key: { endsWith: `:${user.id}` } },
        select: { id: true, key: true, count: true, resetTime: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: account,
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
      agentRuns,
      subscription,
      payments,
      verificationTokens,
      rateLimitEntries,
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
