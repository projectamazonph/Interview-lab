import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth-helpers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [
      dbUser,
      profile,
      interviewSessions,
      resumes,
      coverLetters,
      questionAttempts,
      totalSessions,
      completedSessions,
      totalAttempts,
      avgScoreResult,
    ] = await Promise.all([
      db.user.findUnique({ where: { id: user.id } }),
      db.userProfile.findUnique({ where: { userId: user.id } }),
      db.interviewSession.findMany({
        where: { userId: user.id },
        orderBy: { startedAt: 'desc' },
        take: 5,
      }),
      db.resume.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      db.coverLetter.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      db.questionAttempt.findMany({
        where: { session: { userId: user.id } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { question: true },
      }),
      db.interviewSession.count({ where: { userId: user.id } }),
      db.interviewSession.count({
        where: { userId: user.id, completedAt: { not: null } },
      }),
      db.questionAttempt.count({
        where: { session: { userId: user.id } },
      }),
      db.questionAttempt.aggregate({
        where: { session: { userId: user.id }, score: { not: null } },
        _avg: { score: true },
      }),
    ]);
    const avgScore = avgScoreResult._avg.score || 0;

    const latestResumeScore = resumes.length > 0 ? resumes[0].score : null;

    return NextResponse.json({
      user: dbUser ? {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        subscriptionTier: dbUser.subscriptionTier,
        isAdmin: dbUser.isAdmin,
        createdAt: dbUser.createdAt,
      } : null,
      profile: profile ? {
        ...profile,
        toolsKnown: profile.toolsKnown ? JSON.parse(profile.toolsKnown) : null,
        weakAreas: profile.weakAreas ? JSON.parse(profile.weakAreas) : null,
      } : null,
      stats: {
        totalSessions,
        completedSessions,
        totalAttempts,
        avgScore: Math.round(avgScore * 10) / 10,
        latestResumeScore,
      },
      recentSessions: interviewSessions,
      recentResumes: resumes,
      recentCoverLetters: coverLetters,
      recentAttempts: questionAttempts,
    });
  } catch (error) {
    console.error('Dashboard GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
