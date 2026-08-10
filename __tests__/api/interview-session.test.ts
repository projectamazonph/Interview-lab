/**
 * @vitest-environment node
 *
 * Exercises the real handlers in src/app/api/interview/route.ts,
 * src/app/api/interview/[id]/route.ts, and
 * src/app/api/interview/[id]/complete/route.ts with mocked db/auth.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const questionFindMany = vi.fn();
const sessionCreate = vi.fn();
const sessionFindMany = vi.fn();
const sessionFindUnique = vi.fn();
const sessionUpdate = vi.fn();
const attemptCreate = vi.fn();
const attemptFindMany = vi.fn();
const getUserFromRequest = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    question: { findMany: (...args: unknown[]) => questionFindMany(...args) },
    interviewSession: {
      create: (...args: unknown[]) => sessionCreate(...args),
      findMany: (...args: unknown[]) => sessionFindMany(...args),
      findUnique: (...args: unknown[]) => sessionFindUnique(...args),
      update: (...args: unknown[]) => sessionUpdate(...args),
    },
    questionAttempt: {
      create: (...args: unknown[]) => attemptCreate(...args),
      findMany: (...args: unknown[]) => attemptFindMany(...args),
    },
  },
}));

vi.mock('@/lib/auth-helpers', () => ({
  getUserFromRequest: (...args: unknown[]) => getUserFromRequest(...args),
}));

import { POST as createInterview, GET as listInterviews } from '@/app/api/interview/route';
import { GET as getSession, POST as submitAnswer } from '@/app/api/interview/[id]/route';
import { POST as completeSession } from '@/app/api/interview/[id]/complete/route';

function req(body?: unknown) {
  return new Request('http://localhost/api/interview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function getReq() {
  return new Request('http://localhost/api/interview');
}

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

const mockUser = { id: 'user_123', email: 'test@example.com', name: 'Test User', subscriptionTier: 'free', isAdmin: false };

const sampleQuestions = Array.from({ length: 20 }, (_, i) => ({
  id: `q${i}`, question: `Question ${i}`, role: 'PPC VA', difficulty: 'easy', type: 'behavioral',
  skillArea: 'PPC', answerFormat: 'text', timeLimit: 60, whyEmployersAsk: 'x', strongAnswerPoints: 'y', weakAnswerWarnings: 'z',
}));

describe('POST /api/interview (session creation)', () => {
  beforeEach(() => {
    getUserFromRequest.mockReset();
    questionFindMany.mockReset();
    sessionCreate.mockReset();
    getUserFromRequest.mockResolvedValue(mockUser);
    questionFindMany.mockResolvedValue(sampleQuestions);
    sessionCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 'sess_1', ...data, startedAt: new Date('2026-01-01'),
    }));
  });

  it('rejects unauthenticated request with 401, without touching the db', async () => {
    getUserFromRequest.mockResolvedValue(null);
    const res = await createInterview(req({ mode: 'quick_drill' }));
    expect(res.status).toBe(401);
    expect(questionFindMany).not.toHaveBeenCalled();
  });

  it('rejects an invalid mode with 400', async () => {
    const res = await createInterview(req({ mode: 'invalid_mode' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('mode');
  });

  it('rejects an empty/missing mode with 400', async () => {
    expect((await createInterview(req({ mode: '' }))).status).toBe(400);
    expect((await createInterview(req({}))).status).toBe(400);
  });

  it('creates a session with the given mode and targetRole', async () => {
    const res = await createInterview(req({ mode: 'quick_drill', targetRole: 'PPC VA' }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.session.mode).toBe('quick_drill');
    expect(body.session.targetRole).toBe('PPC VA');
  });

  it.each([
    ['quick_drill', 5],
    ['role_interview', 10],
    ['technical_screen', 8],
    ['client_communication', 8],
    ['final_interview', 10],
    ['practical_debrief', 5],
  ])('picks %s questions for mode %s', async (mode, count) => {
    const res = await createInterview(req({ mode }));
    const body = await res.json();
    expect(body.questions.length).toBe(count);
  });

  it('sanitizes HTML out of the mode string before validating', async () => {
    const res = await createInterview(req({ mode: '<img src=x onerror=alert(1)>quick_drill' }));
    expect(res.status).toBe(200);
    expect((await res.json()).session.mode).toBe('quick_drill');
  });

  it('scopes technical_screen to technical question types and PPC-adjacent skill areas', async () => {
    await createInterview(req({ mode: 'technical_screen' }));
    expect(questionFindMany).toHaveBeenCalledWith({
      where: {
        status: 'published',
        type: { in: ['technical', 'scenario', 'case_study'] },
        skillArea: { in: ['PPC', 'reporting', 'optimization', 'keyword_research', 'campaign_structure'] },
      },
    });
  });

  it('scopes role_interview to the target role plus General questions', async () => {
    await createInterview(req({ mode: 'role_interview', targetRole: 'Listing VA' }));
    expect(questionFindMany).toHaveBeenCalledWith({
      where: { status: 'published', role: { in: ['Listing VA', 'General'] } },
    });
  });

  it('persists the selected question ids in the session transcript', async () => {
    await createInterview(req({ mode: 'quick_drill' }));
    const data = sessionCreate.mock.calls[0][0].data;
    const transcript = JSON.parse(data.transcript as string);
    expect(transcript.questions).toHaveLength(5);
  });

  it('returns 500 when the db throws', async () => {
    questionFindMany.mockRejectedValue(new Error('db down'));
    const res = await createInterview(req({ mode: 'quick_drill' }));
    expect(res.status).toBe(500);
  });
});

describe('GET /api/interview (list)', () => {
  beforeEach(() => {
    getUserFromRequest.mockReset();
    sessionFindMany.mockReset();
  });

  it('rejects unauthenticated GET with 401', async () => {
    getUserFromRequest.mockResolvedValue(null);
    const res = await listInterviews(getReq());
    expect(res.status).toBe(401);
  });

  it('scopes to the requesting user, newest first, capped at 20', async () => {
    getUserFromRequest.mockResolvedValue(mockUser);
    sessionFindMany.mockResolvedValue([]);
    await listInterviews(getReq());
    expect(sessionFindMany).toHaveBeenCalledWith({
      where: { userId: 'user_123' },
      orderBy: { startedAt: 'desc' },
      take: 20,
    });
  });
});

describe('Answer submission (POST /api/interview/[id])', () => {
  beforeEach(() => {
    getUserFromRequest.mockReset();
    sessionFindUnique.mockReset();
    attemptCreate.mockReset();
    getUserFromRequest.mockResolvedValue(mockUser);
  });

  it('rejects unauthenticated with 401', async () => {
    getUserFromRequest.mockResolvedValue(null);
    const res = await submitAnswer(req({ questionId: 'q1', userAnswer: 'Test' }), params('sess_1'));
    expect(res.status).toBe(401);
  });

  it('returns 404 for a nonexistent session', async () => {
    sessionFindUnique.mockResolvedValue(null);
    const res = await submitAnswer(req({ questionId: 'q1', userAnswer: 'Test' }), params('nonexistent'));
    expect(res.status).toBe(404);
  });

  it('returns 403 for a non-owner', async () => {
    sessionFindUnique.mockResolvedValue({ id: 'sess_1', userId: 'other_user' });
    const res = await submitAnswer(req({ questionId: 'q1', userAnswer: 'Test' }), params('sess_1'));
    expect(res.status).toBe(403);
    expect(attemptCreate).not.toHaveBeenCalled();
  });

  it('submits an answer with 201', async () => {
    sessionFindUnique.mockResolvedValue({ id: 'sess_1', userId: 'user_123' });
    attemptCreate.mockResolvedValue({ id: 'att_1', sessionId: 'sess_1', questionId: 'q1', userAnswer: 'Good answer', score: null, aiFeedback: null, rubricBreakdown: null });
    const res = await submitAnswer(req({ questionId: 'q1', userAnswer: 'Good answer' }), params('sess_1'));
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.questionId).toBe('q1');
    expect(body.userAnswer).toBe('Good answer');
  });

  it('stores AI score, feedback, and rubric breakdown', async () => {
    sessionFindUnique.mockResolvedValue({ id: 'sess_1', userId: 'user_123' });
    attemptCreate.mockResolvedValue({
      id: 'att_1', sessionId: 'sess_1', questionId: 'q1', userAnswer: 'A', score: 85, aiFeedback: 'Great!',
      rubricBreakdown: JSON.stringify({ clarity: 9 }),
    });
    const res = await submitAnswer(req({ questionId: 'q1', userAnswer: 'A', score: 85, aiFeedback: 'Great!', rubricBreakdown: { clarity: 9 } }), params('sess_1'));
    const body = await res.json();
    expect(body.score).toBe(85);
    expect(body.aiFeedback).toBe('Great!');
    expect(body.rubricBreakdown).toEqual({ clarity: 9 });
    expect(attemptCreate).toHaveBeenCalledWith({
      data: { sessionId: 'sess_1', questionId: 'q1', userAnswer: 'A', aiFeedback: 'Great!', score: 85, rubricBreakdown: JSON.stringify({ clarity: 9 }) },
    });
  });

  it('stores a null rubricBreakdown when not provided', async () => {
    sessionFindUnique.mockResolvedValue({ id: 'sess_1', userId: 'user_123' });
    attemptCreate.mockResolvedValue({ id: 'att_1', sessionId: 'sess_1', questionId: 'q1', userAnswer: 'A', score: null, aiFeedback: null, rubricBreakdown: null });
    const res = await submitAnswer(req({ questionId: 'q1', userAnswer: 'A' }), params('sess_1'));
    expect((await res.json()).rubricBreakdown).toBeNull();
  });
});

describe('Session retrieval (GET /api/interview/[id])', () => {
  beforeEach(() => {
    getUserFromRequest.mockReset();
    sessionFindUnique.mockReset();
    getUserFromRequest.mockResolvedValue(mockUser);
  });

  it('returns the session with parsed attempt rubrics for the owner', async () => {
    sessionFindUnique.mockResolvedValue({
      id: 'sess_1', userId: 'user_123', mode: 'quick_drill', targetRole: 'PPC VA',
      attempts: [{ id: 'att_1', rubricBreakdown: JSON.stringify({ clarity: 8 }) }],
    });
    const res = await getSession(getReq(), params('sess_1'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.targetRole).toBe('PPC VA');
    expect(body.attempts[0].rubricBreakdown).toEqual({ clarity: 8 });
  });

  it('rejects unauthenticated GET with 401', async () => {
    getUserFromRequest.mockResolvedValue(null);
    const res = await getSession(getReq(), params('sess_1'));
    expect(res.status).toBe(401);
  });

  it('returns 403 for a non-owner', async () => {
    sessionFindUnique.mockResolvedValue({ id: 'sess_1', userId: 'other_user', attempts: [] });
    const res = await getSession(getReq(), params('sess_1'));
    expect(res.status).toBe(403);
  });

  it('returns 404 for a nonexistent session', async () => {
    sessionFindUnique.mockResolvedValue(null);
    const res = await getSession(getReq(), params('nonexistent'));
    expect(res.status).toBe(404);
  });
});

describe('Session completion (POST /api/interview/[id]/complete)', () => {
  beforeEach(() => {
    getUserFromRequest.mockReset();
    sessionFindUnique.mockReset();
    attemptFindMany.mockReset();
    sessionUpdate.mockReset();
    getUserFromRequest.mockResolvedValue(mockUser);
  });

  it('rejects unauthenticated with 401', async () => {
    getUserFromRequest.mockResolvedValue(null);
    const res = await completeSession(req(), params('sess_1'));
    expect(res.status).toBe(401);
  });

  it('returns 404 for a nonexistent session', async () => {
    sessionFindUnique.mockResolvedValue(null);
    const res = await completeSession(req(), params('nonexistent'));
    expect(res.status).toBe(404);
  });

  it('returns 403 for a non-owner', async () => {
    sessionFindUnique.mockResolvedValue({ id: 'sess_1', userId: 'other_user' });
    const res = await completeSession(req(), params('sess_1'));
    expect(res.status).toBe(403);
  });

  it('computes the average score across attempts and marks the session complete', async () => {
    sessionFindUnique.mockResolvedValue({ id: 'sess_1', userId: 'user_123' });
    attemptFindMany.mockResolvedValue([{ score: 80 }, { score: 90 }, { score: 70 }]);
    sessionUpdate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: 'sess_1', ...data }));
    const res = await completeSession(req(), params('sess_1'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.overallScore).toBe(80);
    expect(body.totalQuestions).toBe(3);
    expect(sessionUpdate).toHaveBeenCalledWith({
      where: { id: 'sess_1' },
      data: expect.objectContaining({ overallScore: 80 }),
    });
  });

  it('treats attempts with a null score as 0 when averaging', async () => {
    sessionFindUnique.mockResolvedValue({ id: 'sess_1', userId: 'user_123' });
    attemptFindMany.mockResolvedValue([{ score: 100 }, { score: null }]);
    sessionUpdate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: 'sess_1', ...data }));
    const res = await completeSession(req(), params('sess_1'));
    expect((await res.json()).overallScore).toBe(50);
  });

  it('returns overallScore 0 when there are no attempts', async () => {
    sessionFindUnique.mockResolvedValue({ id: 'sess_1', userId: 'user_123' });
    attemptFindMany.mockResolvedValue([]);
    sessionUpdate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: 'sess_1', ...data }));
    const res = await completeSession(req(), params('sess_1'));
    expect((await res.json()).overallScore).toBe(0);
  });

  it('stringifies an object transcript before storing it', async () => {
    sessionFindUnique.mockResolvedValue({ id: 'sess_1', userId: 'user_123' });
    attemptFindMany.mockResolvedValue([]);
    sessionUpdate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: 'sess_1', ...data }));
    await completeSession(req({ transcript: { turns: [1, 2] } }), params('sess_1'));
    expect(sessionUpdate.mock.calls[0][0].data.transcript).toBe(JSON.stringify({ turns: [1, 2] }));
  });

  it('tolerates a missing/empty request body', async () => {
    sessionFindUnique.mockResolvedValue({ id: 'sess_1', userId: 'user_123' });
    attemptFindMany.mockResolvedValue([]);
    sessionUpdate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: 'sess_1', ...data }));
    const res = await completeSession(req(), params('sess_1'));
    expect(res.status).toBe(200);
  });
});
