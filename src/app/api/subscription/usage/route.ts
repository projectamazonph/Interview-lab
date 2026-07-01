import { db } from '@/lib/db';
import { getUserIdFromHeader, verifyAuth } from '@/lib/auth-helpers';
import { PRICING_TIERS, TierKey } from '@/lib/pricing';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const userId = getUserIdFromHeader(request);
    const user = await verifyAuth(userId);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Calculate period boundaries
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Query usage counts for rate-limited features
    const [interviewsThisWeek, resumeReviewsThisMonth, coverLettersThisMonth, practiceTestsThisMonth] = await Promise.all([
      db.interviewSession.count({
        where: {
          userId: user.id,
          startedAt: { gte: weekStart },
        },
      }),
      db.resume.count({
        where: {
          userId: user.id,
          createdAt: { gte: monthStart },
        },
      }),
      db.coverLetter.count({
        where: {
          userId: user.id,
          createdAt: { gte: monthStart },
        },
      }),
      db.agentRun.count({
        where: {
          userId: user.id,
          agentType: 'practice_test',
          createdAt: { gte: monthStart },
        },
      }),
    ]);

    // Get tier limits for context
    const currentTier = (user.subscriptionTier as TierKey) ?? 'free';
    const tierConfig = PRICING_TIERS[currentTier] ?? PRICING_TIERS.free;

    return NextResponse.json({
      tier: currentTier,
      period: {
        weekStart: weekStart.toISOString(),
        monthStart: monthStart.toISOString(),
      },
      usage: {
        interviewsThisWeek,
        resumeReviewsThisMonth,
        coverLettersThisMonth,
        practiceTestsThisMonth,
      },
      limits: {
        interviewsPerWeek: tierConfig.limits.interviewsPerWeek,
        resumeReviewsPerMonth: tierConfig.limits.resumeReviewsPerMonth,
        coverLettersPerMonth: tierConfig.limits.coverLettersPerMonth,
        practiceTestsPerMonth: tierConfig.limits.practiceTestsPerMonth,
      },
      remaining: {
        interviewsThisWeek: tierConfig.limits.interviewsPerWeek === -1
          ? -1
          : Math.max(0, tierConfig.limits.interviewsPerWeek - interviewsThisWeek),
        resumeReviewsThisMonth: tierConfig.limits.resumeReviewsPerMonth === -1
          ? -1
          : Math.max(0, tierConfig.limits.resumeReviewsPerMonth - resumeReviewsThisMonth),
        coverLettersThisMonth: tierConfig.limits.coverLettersPerMonth === -1
          ? -1
          : Math.max(0, tierConfig.limits.coverLettersPerMonth - coverLettersThisMonth),
        practiceTestsThisMonth: tierConfig.limits.practiceTestsPerMonth === -1
          ? -1
          : Math.max(0, tierConfig.limits.practiceTestsPerMonth - practiceTestsThisMonth),
      },
      percentUsed: {
        interviewsThisWeek: tierConfig.limits.interviewsPerWeek === -1
          ? 0
          : Math.round((interviewsThisWeek / tierConfig.limits.interviewsPerWeek) * 100),
        resumeReviewsThisMonth: tierConfig.limits.resumeReviewsPerMonth === -1
          ? 0
          : Math.round((resumeReviewsThisMonth / tierConfig.limits.resumeReviewsPerMonth) * 100),
        coverLettersThisMonth: tierConfig.limits.coverLettersPerMonth === -1
          ? 0
          : Math.round((coverLettersThisMonth / tierConfig.limits.coverLettersPerMonth) * 100),
        practiceTestsThisMonth: tierConfig.limits.practiceTestsPerMonth === -1
          ? 0
          : Math.round((practiceTestsThisMonth / tierConfig.limits.practiceTestsPerMonth) * 100),
      },
    });
  } catch (error) {
    console.error('Subscription usage GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch usage data' }, { status: 500 });
  }
}
