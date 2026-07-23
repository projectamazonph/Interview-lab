import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth-helpers';
import { checkQuestionBankAccess } from '@/lib/subscription-guard';
import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';

// The question bank is read on nearly every page view and changes only via
// the admin panel, so the DB round-trip is cached and shared across
// requests/users for a filter combination — invalidated explicitly by
// revalidateTag('questions') in the admin routes rather than left to expire.
// Field-stripping for free vs. premium tiers happens *after* this cache, on
// every request, so the cache itself never leaks premium-only fields.
const getCachedQuestionPage = unstable_cache(
  async (where: Record<string, unknown>, limit: number, offset: number) => {
    const [questions, total] = await Promise.all([
      db.question.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.question.count({ where }),
    ]);
    return { questions, total };
  },
  ['questions-page'],
  { tags: ['questions'], revalidate: 300 },
);

const QUESTION_SAFE_FIELDS = {
  id: true,
  role: true,
  difficulty: true,
  type: true,
  skillArea: true,
  question: true,
  answerFormat: true,
  status: true,
  createdAt: true,
} as const;

const _PREMIUM_FIELDS = {
  whyEmployersAsk: true,
  strongAnswerPoints: true,
  weakAnswerWarnings: true,
  sampleAnswer: true,
  advancedQuestions: true,
} as const;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const difficulty = searchParams.get('difficulty');
    const type = searchParams.get('type');
    const skillArea = searchParams.get('skillArea');
    const search = searchParams.get('search');
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50'), 1), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

    // Check authentication and subscription for non-free content
    const user = await getUserFromRequest(request);

    const where: Record<string, unknown> = { status: 'published' };
    if (role && role !== 'all') where.role = role;
    if (difficulty && difficulty !== 'all') where.difficulty = difficulty;
    if (type && type !== 'all') where.type = type;
    if (skillArea && skillArea !== 'all') where.skillArea = skillArea;
    if (search) {
      where.question = { contains: search };
    }

    // For non-free difficulties, require auth and subscription check
    if (difficulty && difficulty !== 'beginner') {
      if (!user) {
        return NextResponse.json(
          { error: 'Authentication required for premium questions.' },
          { status: 401 }
        );
      }
      const access = checkQuestionBankAccess(user.subscriptionTier, difficulty);
      if (!access.allowed) {
        return NextResponse.json(
          { error: access.reason || 'Subscription required for premium questions.' },
          { status: 403 }
        );
      }
    }

    const { questions, total } = await getCachedQuestionPage(where, limit, offset);

    // Strip premium fields for free-tier users
    const userTier = user?.subscriptionTier ?? 'free';
    const canAccessPremium = (userTier === 'starter' || userTier === 'pro');

    const sanitized = questions.map((q: Record<string, unknown>) => {
      if (canAccessPremium) return q;
      const safe: Record<string, unknown> = {};
      for (const key of Object.keys(QUESTION_SAFE_FIELDS)) {
        safe[key] = q[key];
      }
      return safe;
    });

    return NextResponse.json({ questions: sanitized, total });
  } catch (error) {
    console.error('Questions GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}
