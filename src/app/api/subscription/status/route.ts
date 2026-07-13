import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth-helpers';
import { PRICING_TIERS, TierKey } from '@/lib/pricing';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get subscription record
    const subscription = await db.subscription.findUnique({
      where: { userId: user.id },
    });

    // Determine current tier from user record (source of truth)
    const currentTier = (user.subscriptionTier as TierKey) ?? 'free';
    const tierConfig = PRICING_TIERS[currentTier] ?? PRICING_TIERS.free;

    // Calculate current period usage
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [interviewsThisWeek, resumeReviewsThisMonth, coverLettersThisMonth] = await Promise.all([
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
    ]);

    // Calculate practice tests this month (from AgentRun with agentType 'practice_test')
    const practiceTestsThisMonth = await db.agentRun.count({
      where: {
        userId: user.id,
        agentType: 'practice_test',
        createdAt: { gte: monthStart },
      },
    });

    // Get recent payments
    const recentPayments = await db.payment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return NextResponse.json({
      tier: currentTier,
      tierName: tierConfig.name,
      status: subscription?.status ?? 'active',
      subscription: subscription
        ? {
            id: subscription.id,
            tier: subscription.tier,
            status: subscription.status,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            createdAt: subscription.createdAt,
          }
        : null,
      limits: tierConfig.limits,
      usage: {
        interviewsThisWeek,
        resumeReviewsThisMonth,
        coverLettersThisMonth,
        practiceTestsThisMonth,
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
      recentPayments,
    });
  } catch (error) {
    console.error('Subscription status GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription status' }, { status: 500 });
  }
}
