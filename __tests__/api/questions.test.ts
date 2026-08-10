/**
 * @vitest-environment node
 *
 * Exercises the real GET /api/questions handler with a mocked db/auth.
 * subscription-guard.ts is left unmocked (dormant/always-allow, see
 * src/lib/subscription/entitlement.ts) so the auth-gating branch for
 * non-beginner difficulty and the premium-field stripping for free-tier
 * users — both previously untested — are verified against real code.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const findMany = vi.fn();
const count = vi.fn();
const getUserFromRequest = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    question: {
      findMany: (...args: unknown[]) => findMany(...args),
      count: (...args: unknown[]) => count(...args),
    },
  },
}));

vi.mock('@/lib/auth-helpers', () => ({
  getUserFromRequest: (...args: unknown[]) => getUserFromRequest(...args),
}));

import { GET } from '@/app/api/questions/route';

function req(qs = '') {
  return new Request(`http://localhost/api/questions${qs}`);
}

const fullQuestion = {
  id: 'q1', role: 'PPC VA', difficulty: 'beginner', type: 'technical', skillArea: 'PPC',
  question: 'What is ACoS?', answerFormat: 'text', status: 'published', createdAt: new Date(),
  whyEmployersAsk: 'x', strongAnswerPoints: 'y', weakAnswerWarnings: 'z', sampleAnswer: 's', advancedQuestions: 'a',
};

describe('GET /api/questions', () => {
  beforeEach(() => {
    findMany.mockReset();
    count.mockReset();
    getUserFromRequest.mockReset();
    getUserFromRequest.mockResolvedValue(null);
    findMany.mockResolvedValue([fullQuestion]);
    count.mockResolvedValue(1);
  });

  it('defaults to published questions, limit 50, offset 0', async () => {
    await GET(req());
    expect(findMany).toHaveBeenCalledWith({
      where: { status: 'published' }, orderBy: { createdAt: 'desc' }, take: 50, skip: 0,
    });
  });

  it('filters by role/type/skillArea, treating "all" as no filter', async () => {
    await GET(req('?role=PPC%20VA&type=technical&skillArea=PPC'));
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: 'published', role: 'PPC VA', type: 'technical', skillArea: 'PPC' },
    }));

    findMany.mockClear();
    await GET(req('?role=all&type=all&skillArea=all'));
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { status: 'published' } }));
  });

  it('applies a case-insensitive "contains" search filter', async () => {
    await GET(req('?search=acos'));
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: 'published', question: { contains: 'acos' } },
    }));
  });

  it('clamps limit to [1, 100] and floors offset at 0', async () => {
    await GET(req('?limit=500&offset=-10'));
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 100, skip: 0 }));

    findMany.mockClear();
    await GET(req('?limit=0'));
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 1 }));
  });

  it('does not require auth for the default/beginner difficulty', async () => {
    getUserFromRequest.mockResolvedValue(null);
    const res = await GET(req('?difficulty=beginner'));
    expect(res.status).toBe(200);
  });

  it('requires authentication for non-beginner difficulty', async () => {
    getUserFromRequest.mockResolvedValue(null);
    const res = await GET(req('?difficulty=intermediate'));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toContain('Authentication required');
    expect(findMany).not.toHaveBeenCalled();
  });

  it('allows an authenticated user to fetch non-beginner difficulty', async () => {
    getUserFromRequest.mockResolvedValue({ id: 'u1', subscriptionTier: 'free' });
    const res = await GET(req('?difficulty=advanced'));
    expect(res.status).toBe(200);
  });

  it('difficulty=all unexpectedly requires authentication (only "beginner" is exempt)', async () => {
    // Documents actual route behavior: the auth-gate check is
    // `difficulty !== 'beginner'`, not "is a real filter value" — so
    // "all" (which itself applies no filter) still trips the 401 branch.
    getUserFromRequest.mockResolvedValue(null);
    const res = await GET(req('?difficulty=all'));
    expect(res.status).toBe(401);
  });

  it('strips premium fields for an unauthenticated (free-tier) request', async () => {
    getUserFromRequest.mockResolvedValue(null);
    const res = await GET(req());
    const body = await res.json();
    const q = body.questions[0];
    expect(q).toMatchObject({ id: 'q1', role: 'PPC VA', question: 'What is ACoS?' });
    expect(q).not.toHaveProperty('whyEmployersAsk');
    expect(q).not.toHaveProperty('strongAnswerPoints');
    expect(q).not.toHaveProperty('sampleAnswer');
  });

  it('strips premium fields for a free-tier authenticated user', async () => {
    getUserFromRequest.mockResolvedValue({ id: 'u1', subscriptionTier: 'free' });
    const res = await GET(req());
    const body = await res.json();
    expect(body.questions[0]).not.toHaveProperty('whyEmployersAsk');
  });

  it('includes premium fields for starter/pro tiers', async () => {
    getUserFromRequest.mockResolvedValue({ id: 'u1', subscriptionTier: 'starter' });
    const res = await GET(req());
    const body = await res.json();
    expect(body.questions[0]).toHaveProperty('whyEmployersAsk', 'x');
    expect(body.questions[0]).toHaveProperty('sampleAnswer', 's');
  });

  it('returns the total count alongside the page of questions', async () => {
    findMany.mockResolvedValue([fullQuestion]);
    count.mockResolvedValue(42);
    const res = await GET(req());
    expect((await res.json()).total).toBe(42);
  });

  it('returns 500 when the db throws', async () => {
    findMany.mockRejectedValue(new Error('db down'));
    const res = await GET(req());
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to fetch questions');
  });
});
