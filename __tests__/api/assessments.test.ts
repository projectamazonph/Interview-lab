/**
 * @vitest-environment node
 *
 * Exercises the real handlers in src/app/api/assessments/route.ts and
 * src/app/api/assessments/[id]/route.ts with mocked db/auth.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const findMany = vi.fn();
const findUnique = vi.fn();
const agentRunCreate = vi.fn();
const getUserFromRequest = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    assessment: {
      findMany: (...args: unknown[]) => findMany(...args),
      findUnique: (...args: unknown[]) => findUnique(...args),
    },
    agentRun: {
      create: (...args: unknown[]) => agentRunCreate(...args),
    },
  },
}));

vi.mock('@/lib/auth-helpers', () => ({
  getUserFromRequest: (...args: unknown[]) => getUserFromRequest(...args),
}));

import { GET as list } from '@/app/api/assessments/route';
import { GET as getById, POST as submit } from '@/app/api/assessments/[id]/route';

function listReq(qs = '') {
  return new Request(`http://localhost/api/assessments${qs}`);
}

function idReq(body?: unknown) {
  return new Request('http://localhost/api/assessments/a1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

const fullAssessment = {
  id: 'a1', title: 'PPC Test', role: 'PPC VA', difficulty: 'easy',
  description: 'd1', datasetInfo: { rows: 100 }, answerKey: { secret: true }, rubric: { weight: 1 },
};

describe('GET /api/assessments (list)', () => {
  beforeEach(() => {
    findMany.mockReset();
  });

  it('returns all assessments when no filters', async () => {
    findMany.mockResolvedValue([fullAssessment, { ...fullAssessment, id: 'a2' }]);
    const res = await list(listReq());
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.assessments.length).toBe(2);
    expect(findMany).toHaveBeenCalledWith({ where: {}, orderBy: { createdAt: 'desc' } });
  });

  it('filters by role', async () => {
    findMany.mockResolvedValue([fullAssessment]);
    await list(listReq('?role=PPC%20VA'));
    expect(findMany).toHaveBeenCalledWith({ where: { role: 'PPC VA' }, orderBy: { createdAt: 'desc' } });
  });

  it('filters by difficulty', async () => {
    findMany.mockResolvedValue([]);
    await list(listReq('?difficulty=hard'));
    expect(findMany).toHaveBeenCalledWith({ where: { difficulty: 'hard' }, orderBy: { createdAt: 'desc' } });
  });

  it('combines role and difficulty filters', async () => {
    findMany.mockResolvedValue([]);
    await list(listReq('?role=PPC%20VA&difficulty=easy'));
    expect(findMany).toHaveBeenCalledWith({ where: { role: 'PPC VA', difficulty: 'easy' }, orderBy: { createdAt: 'desc' } });
  });

  it('treats "all" as no filter', async () => {
    findMany.mockResolvedValue([]);
    await list(listReq('?role=all&difficulty=all'));
    expect(findMany).toHaveBeenCalledWith({ where: {}, orderBy: { createdAt: 'desc' } });
  });

  it('does not strip answerKey/rubric in the list response', async () => {
    findMany.mockResolvedValue([fullAssessment]);
    const res = await list(listReq());
    const body = await res.json();
    expect(body.assessments[0].answerKey).toEqual({ secret: true });
  });

  it('returns 500 when the db throws', async () => {
    findMany.mockRejectedValue(new Error('db down'));
    const res = await list(listReq());
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to fetch assessments');
  });
});

describe('GET /api/assessments/[id]', () => {
  beforeEach(() => {
    findUnique.mockReset();
  });

  it('returns assessment by id', async () => {
    findUnique.mockResolvedValue(fullAssessment);
    const res = await getById(idReq(), params('a1'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.id).toBe('a1');
    expect(body.title).toBe('PPC Test');
  });

  it('returns 404 for a non-existent id', async () => {
    findUnique.mockResolvedValue(null);
    const res = await getById(idReq(), params('nonexistent'));
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe('Assessment not found');
  });

  it('strips answerKey and rubric from the response', async () => {
    findUnique.mockResolvedValue(fullAssessment);
    const res = await getById(idReq(), params('a1'));
    const body = await res.json();
    expect(body).not.toHaveProperty('answerKey');
    expect(body).not.toHaveProperty('rubric');
  });

  it('includes description and datasetInfo', async () => {
    findUnique.mockResolvedValue(fullAssessment);
    const res = await getById(idReq(), params('a1'));
    const body = await res.json();
    expect(body.description).toBe('d1');
    expect(body.datasetInfo).toEqual({ rows: 100 });
  });

  it('returns 500 when the db throws', async () => {
    findUnique.mockRejectedValue(new Error('db down'));
    const res = await getById(idReq(), params('a1'));
    expect(res.status).toBe(500);
  });
});

describe('POST /api/assessments/[id] (submit)', () => {
  beforeEach(() => {
    findUnique.mockReset();
    agentRunCreate.mockReset();
    getUserFromRequest.mockReset();
  });

  it('returns 401 when not authenticated, without touching the db', async () => {
    getUserFromRequest.mockResolvedValue(null);
    const res = await submit(idReq({ answers: ['a'] }), params('a1'));
    expect(res.status).toBe(401);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('returns 404 for a non-existent assessment', async () => {
    getUserFromRequest.mockResolvedValue({ id: 'u1' });
    findUnique.mockResolvedValue(null);
    const res = await submit(idReq({ answers: [] }), params('nonexistent'));
    expect(res.status).toBe(404);
  });

  it('returns 200 and logs an agent run on success', async () => {
    getUserFromRequest.mockResolvedValue({ id: 'u1' });
    findUnique.mockResolvedValue(fullAssessment);
    agentRunCreate.mockResolvedValue({});
    const res = await submit(idReq({ answers: ['q1', 'q2'] }), params('a1'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true, assessmentId: 'a1' });
    expect(agentRunCreate).toHaveBeenCalledWith({
      data: {
        userId: 'u1',
        agentType: 'practical_test',
        input: JSON.stringify({ assessmentId: 'a1', answers: ['q1', 'q2'] }),
        output: JSON.stringify({ submitted: true }),
      },
    });
  });

  it('returns 500 when the request body cannot be parsed', async () => {
    getUserFromRequest.mockResolvedValue({ id: 'u1' });
    findUnique.mockResolvedValue(fullAssessment);
    const badReq = { json: async () => { throw new Error('bad json'); } } as unknown as Request;
    const res = await submit(badReq, params('a1'));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to submit assessment');
  });

  it('returns 500 when the agent run write fails', async () => {
    getUserFromRequest.mockResolvedValue({ id: 'u1' });
    findUnique.mockResolvedValue(fullAssessment);
    agentRunCreate.mockRejectedValue(new Error('db down'));
    const res = await submit(idReq({ answers: ['a'] }), params('a1'));
    expect(res.status).toBe(500);
  });
});
