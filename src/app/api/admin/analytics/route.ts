import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth-helpers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const admin = await getUserFromRequest(request);
    if (!admin || !admin.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized — admin access required' }, { status: 401 });
    }

    // Platform-wide stats
    const [
      totalUsers,
      totalQuestions,
      totalGuides,
      totalDownloads,
      totalSessions,
      totalAttempts,
      totalResumes,
      totalCoverLetters,
      avgScoreResult,
      usersByTier,
      questionsByRole,
      questionsByDifficulty,
      questionsByStatus,
      recentUsers,
      topDownloaded,
      sessionsLast30Days,
    ] = await Promise.all([
      db.user.count(),
      db.question.count(),
      db.guide.count(),
      db.download.count(),
      db.interviewSession.count(),
      db.questionAttempt.count(),
      db.resume.count(),
      db.coverLetter.count(),
      db.questionAttempt.aggregate({
        where: { score: { not: null } },
        _avg: { score: true },
      }),
      db.user.groupBy({
        by: ['subscriptionTier'],
        _count: { id: true },
      }),
      db.question.groupBy({
        by: ['role'],
        _count: { id: true },
      }),
      db.question.groupBy({
        by: ['difficulty'],
        _count: { id: true },
      }),
      db.question.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      db.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, email: true, name: true, subscriptionTier: true, isAdmin: true, createdAt: true },
      }),
      db.download.findMany({
        orderBy: { downloadCount: 'desc' },
        take: 10,
        select: { id: true, title: true, downloadCount: true, fileType: true, category: true },
      }),
      db.interviewSession.count({
        where: {
          startedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    // Format grouped data as records
    const usersByTierMap: Record<string, number> = {};
    for (const item of usersByTier) {
      usersByTierMap[item.subscriptionTier] = item._count.id;
    }

    const questionsByRoleMap: Record<string, number> = {};
    for (const item of questionsByRole) {
      questionsByRoleMap[item.role] = item._count.id;
    }

    const questionsByDifficultyMap: Record<string, number> = {};
    for (const item of questionsByDifficulty) {
      questionsByDifficultyMap[item.difficulty] = item._count.id;
    }

    const questionsByStatusMap: Record<string, number> = {};
    for (const item of questionsByStatus) {
      questionsByStatusMap[item.status] = item._count.id;
    }

    return NextResponse.json({
      stats: {
        totalUsers,
        totalQuestions,
        totalGuides,
        totalDownloads,
        totalSessions,
        totalAttempts,
        totalResumes,
        totalCoverLetters,
        avgScore: Math.round((avgScoreResult._avg.score || 0) * 10) / 10,
        sessionsLast30Days,
      },
      breakdowns: {
        usersByTier: usersByTierMap,
        questionsByRole: questionsByRoleMap,
        questionsByDifficulty: questionsByDifficultyMap,
        questionsByStatus: questionsByStatusMap,
      },
      recentUsers,
      topDownloaded,
    });
  } catch (error) {
    console.error('Admin Analytics GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
