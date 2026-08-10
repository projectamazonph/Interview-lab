/**
 * @vitest-environment node
 *
 * Exercises the real handlers in src/app/api/profile/route.ts and
 * src/app/api/dashboard/route.ts with mocked db/auth. sanitize.ts is left
 * unmocked (it's pure) so sanitization is verified end-to-end too.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const profileFindUnique = vi.fn();
const profileUpsert = vi.fn();
const userFindUnique = vi.fn();
const sessionFindMany = vi.fn();
const sessionCount = vi.fn();
const resumeFindMany = vi.fn();
const coverLetterFindMany = vi.fn();
const attemptFindMany = vi.fn();
const attemptCount = vi.fn();
const attemptAggregate = vi.fn();
const getUserFromRequest = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    userProfile: {
      findUnique: (...args: unknown[]) => profileFindUnique(...args),
      upsert: (...args: unknown[]) => profileUpsert(...args),
    },
    user: { findUnique: (...args: unknown[]) => userFindUnique(...args) },
    interviewSession: {
      findMany: (...args: unknown[]) => sessionFindMany(...args),
      count: (...args: unknown[]) => sessionCount(...args),
    },
    resume: { findMany: (...args: unknown[]) => resumeFindMany(...args) },
    coverLetter: { findMany: (...args: unknown[]) => coverLetterFindMany(...args) },
    questionAttempt: {
      findMany: (...args: unknown[]) => attemptFindMany(...args),
      count: (...args: unknown[]) => attemptCount(...args),
      aggregate: (...args: unknown[]) => attemptAggregate(...args),
    },
  },
}));

vi.mock('@/lib/auth-helpers', () => ({
  getUserFromRequest: (...args: unknown[]) => getUserFromRequest(...args),
}));

import { GET as profileGet, PUT as profilePut } from '@/app/api/profile/route';
import { GET as dashboardGet } from '@/app/api/dashboard/route';

function getReq() {
  return new Request('http://localhost/api/profile');
}

function putReq(body: unknown) {
  return new Request('http://localhost/api/profile', {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
}

const mockUser = { id: 'u1', email: 'u@test.com' };

describe('GET /api/profile', () => {
  beforeEach(() => {
    getUserFromRequest.mockReset();
    profileFindUnique.mockReset();
    getUserFromRequest.mockResolvedValue(mockUser);
  });

  it('returns 401 when not authenticated', async () => {
    getUserFromRequest.mockResolvedValue(null);
    const res = await profileGet(getReq());
    expect(res.status).toBe(401);
  });

  it('returns onboardingDone:false when no profile exists', async () => {
    profileFindUnique.mockResolvedValue(null);
    const res = await profileGet(getReq());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ onboardingDone: false });
  });

  it('returns profile data with toolsKnown/weakAreas parsed from JSON', async () => {
    profileFindUnique.mockResolvedValue({
      userId: 'u1', targetRole: 'PPC VA', toolsKnown: JSON.stringify(['Excel']),
      weakAreas: JSON.stringify(['analytics']), onboardingDone: true,
    });
    const res = await profileGet(getReq());
    const body = await res.json();
    expect(body.targetRole).toBe('PPC VA');
    expect(body.toolsKnown).toEqual(['Excel']);
    expect(body.weakAreas).toEqual(['analytics']);
  });

  it('returns null for toolsKnown/weakAreas when they are null', async () => {
    profileFindUnique.mockResolvedValue({ userId: 'u1', toolsKnown: null, weakAreas: null });
    const res = await profileGet(getReq());
    const body = await res.json();
    expect(body.toolsKnown).toBeNull();
    expect(body.weakAreas).toBeNull();
  });

  it('returns 500 when the db throws', async () => {
    profileFindUnique.mockRejectedValue(new Error('db down'));
    const res = await profileGet(getReq());
    expect(res.status).toBe(500);
  });
});

describe('PUT /api/profile', () => {
  beforeEach(() => {
    getUserFromRequest.mockReset();
    profileUpsert.mockReset();
    getUserFromRequest.mockResolvedValue(mockUser);
    profileUpsert.mockImplementation(async ({ create }: { create: Record<string, unknown> }) => create);
  });

  it('returns 401 when not authenticated', async () => {
    getUserFromRequest.mockResolvedValue(null);
    const res = await profilePut(putReq({ targetRole: 'PPC VA' }));
    expect(res.status).toBe(401);
  });

  it('updates targetRole', async () => {
    await profilePut(putReq({ targetRole: 'Account VA' }));
    expect(profileUpsert.mock.calls[0][0].update.targetRole).toBe('Account VA');
  });

  it('sanitizes text fields (strips HTML)', async () => {
    const res = await profilePut(putReq({ targetRole: '<script>alert(1)</script>PPC VA' }));
    const body = await res.json();
    expect(body.targetRole).not.toContain('<script>');
    expect(body.targetRole).toContain('PPC VA');
  });

  it('stores toolsKnown given as an array', async () => {
    const res = await profilePut(putReq({ toolsKnown: ['Excel', 'Canva'] }));
    expect((await res.json()).toolsKnown).toEqual(['Excel', 'Canva']);
  });

  it('stores toolsKnown given as a single string', async () => {
    const res = await profilePut(putReq({ toolsKnown: 'Excel' }));
    expect((await res.json()).toolsKnown).toEqual(['Excel']);
  });

  it('filters empty/whitespace-only strings out of toolsKnown array', async () => {
    const res = await profilePut(putReq({ toolsKnown: ['Excel', '', '  ', 'Canva'] }));
    expect((await res.json()).toolsKnown).toEqual(['Excel', 'Canva']);
  });

  it('defaults onboardingDone to true when a non-boolean is sent', async () => {
    await profilePut(putReq({ onboardingDone: 'yes' }));
    expect(profileUpsert.mock.calls[0][0].update.onboardingDone).toBe(true);
  });

  it('respects an explicit onboardingDone boolean', async () => {
    await profilePut(putReq({ onboardingDone: false }));
    expect(profileUpsert.mock.calls[0][0].update.onboardingDone).toBe(false);
  });

  it('ignores non-allowlisted fields (e.g. isAdmin, id)', async () => {
    await profilePut(putReq({ targetRole: 'PPC VA', isAdmin: true, id: 'hacked' }));
    const update = profileUpsert.mock.calls[0][0].update;
    expect(update.targetRole).toBe('PPC VA');
    expect(update).not.toHaveProperty('isAdmin');
    expect(update).not.toHaveProperty('id');
  });

  it('scopes the upsert to the authenticated user', async () => {
    await profilePut(putReq({ targetRole: 'PPC VA' }));
    expect(profileUpsert).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'u1' } }));
  });

  it('returns 500 when the request body cannot be parsed', async () => {
    const badReq = { headers: { get: () => null }, json: async () => { throw new Error('bad'); } } as unknown as Request;
    const res = await profilePut(badReq);
    expect(res.status).toBe(500);
  });
});

describe('GET /api/dashboard', () => {
  beforeEach(() => {
    getUserFromRequest.mockReset();
    userFindUnique.mockReset();
    profileFindUnique.mockReset();
    sessionFindMany.mockReset();
    sessionCount.mockReset();
    resumeFindMany.mockReset();
    coverLetterFindMany.mockReset();
    attemptFindMany.mockReset();
    attemptCount.mockReset();
    attemptAggregate.mockReset();

    getUserFromRequest.mockResolvedValue(mockUser);
    userFindUnique.mockResolvedValue(null);
    profileFindUnique.mockResolvedValue(null);
    sessionFindMany.mockResolvedValue([]);
    sessionCount.mockResolvedValue(0);
    resumeFindMany.mockResolvedValue([]);
    coverLetterFindMany.mockResolvedValue([]);
    attemptFindMany.mockResolvedValue([]);
    attemptCount.mockResolvedValue(0);
    attemptAggregate.mockResolvedValue({ _avg: { score: null } });
  });

  it('returns 401 when not authenticated', async () => {
    getUserFromRequest.mockResolvedValue(null);
    const res = await dashboardGet(getReq());
    expect(res.status).toBe(401);
  });

  it('returns user and profile data', async () => {
    userFindUnique.mockResolvedValue({ id: 'u1', email: 'u@test.com', name: 'User', subscriptionTier: 'pro', isAdmin: false, createdAt: '2026-01-01' });
    profileFindUnique.mockResolvedValue({ userId: 'u1', targetRole: 'PPC VA', toolsKnown: JSON.stringify(['Excel']), weakAreas: null });
    const res = await dashboardGet(getReq());
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.user.id).toBe('u1');
    expect(body.user.subscriptionTier).toBe('pro');
    expect(body.profile.targetRole).toBe('PPC VA');
    expect(body.profile.toolsKnown).toEqual(['Excel']);
  });

  it('returns null user and profile when neither exist', async () => {
    const res = await dashboardGet(getReq());
    const body = await res.json();
    expect(body.user).toBeNull();
    expect(body.profile).toBeNull();
  });

  it('reports stats from the count/aggregate queries', async () => {
    sessionCount.mockImplementation(async ({ where }: { where: Record<string, unknown> }) =>
      'completedAt' in where ? 1 : 2);
    attemptCount.mockResolvedValue(2);
    attemptAggregate.mockResolvedValue({ _avg: { score: 7 } });
    resumeFindMany.mockResolvedValue([{ userId: 'u1', score: 85, createdAt: '2026-07-01' }]);
    const res = await dashboardGet(getReq());
    const body = await res.json();
    expect(body.stats).toEqual({ totalSessions: 2, completedSessions: 1, totalAttempts: 2, avgScore: 7, latestResumeScore: 85 });
  });

  it('scopes every query to the authenticated user', async () => {
    await dashboardGet(getReq());
    expect(sessionFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'u1' }, take: 5 }));
    expect(resumeFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'u1' }, take: 5 }));
    expect(coverLetterFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'u1' }, take: 5 }));
    expect(attemptFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { session: { userId: 'u1' } }, take: 10 }));
  });

  it('does not query for stats/aggregates when the user has no activity', async () => {
    const res = await dashboardGet(getReq());
    const body = await res.json();
    expect(body.recentCoverLetters).toEqual([]);
    expect(body.recentSessions).toEqual([]);
    expect(body.recentResumes).toEqual([]);
    expect(attemptAggregate).not.toHaveBeenCalled();
    expect(body.stats.avgScore).toBe(0);
  });

  it('returns 500 when the db throws', async () => {
    userFindUnique.mockRejectedValue(new Error('db down'));
    const res = await dashboardGet(getReq());
    expect(res.status).toBe(500);
  });
});
