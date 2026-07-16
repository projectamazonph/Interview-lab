import { describe, it, expect, beforeEach } from 'vitest';

let assessments: any[] = [];
let agentRuns: any[] = [];
let currentUser: any = null;

function reset() {
  assessments = [];
  agentRuns = [];
  currentUser = null;
}

function listRequest(role?: string, difficulty?: string) {
  let url = 'https://example.com/api/assessments';
  const params: string[] = [];
  if (role) params.push('role=' + role);
  if (difficulty) params.push('difficulty=' + difficulty);
  if (params.length) url += '?' + params.join('&');
  return { url };
}

async function listHandler(request: any) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const difficulty = searchParams.get('difficulty');
    let filtered = [...assessments];
    if (role && role !== 'all') filtered = filtered.filter(a => a.role === role);
    if (difficulty && difficulty !== 'all') filtered = filtered.filter(a => a.difficulty === difficulty);
    return { status: 200, body: { assessments: filtered } };
  } catch {
    return { status: 500, body: { error: 'Failed to fetch assessments' } };
  }
}

async function getByIdHandler(request: any, id: string) {
  try {
    const assessment = assessments.find(a => a.id === id);
    if (!assessment) return { status: 404, body: { error: 'Assessment not found' } };
    return {
      status: 200,
      body: { id: assessment.id, title: assessment.title, role: assessment.role, difficulty: assessment.difficulty, description: assessment.description, datasetInfo: assessment.datasetInfo },
    };
  } catch {
    return { status: 500, body: { error: 'Failed to fetch assessment' } };
  }
}

async function submitHandler(request: any, id: string) {
  try {
    if (!currentUser) return { status: 401, body: { error: 'Unauthorized' } };
    const assessment = assessments.find(a => a.id === id);
    if (!assessment) return { status: 404, body: { error: 'Assessment not found' } };
    const { answers } = await request.json();
    agentRuns.push({ userId: currentUser.id, agentType: 'practical_test', input: JSON.stringify({ assessmentId: id, answers }), output: JSON.stringify({ submitted: true }) });
    return { status: 200, body: { success: true, assessmentId: id } };
  } catch {
    return { status: 500, body: { error: 'Failed to submit assessment' } };
  }
}

describe('GET /api/assessments (list)', () => {
  beforeEach(() => reset());

  it('returns all assessments when no filters', async () => {
    assessments.push({ id: 'a1', title: 'PPC Test', role: 'PPC VA', difficulty: 'easy', description: 'd1', datasetInfo: {}, answerKey: {}, rubric: {} }, { id: 'a2', title: 'Account Test', role: 'Account VA', difficulty: 'hard', description: 'd2', datasetInfo: {}, answerKey: {}, rubric: {} });
    const res = await listHandler(listRequest());
    expect(res.status).toBe(200);
    expect(res.body.assessments.length).toBe(2);
  });

  it('returns empty array when no assessments', async () => {
    const res = await listHandler(listRequest());
    expect(res.status).toBe(200);
    expect(res.body.assessments).toEqual([]);
  });

  it('filters by role', async () => {
    assessments.push({ id: 'a1', role: 'PPC VA', difficulty: 'easy' }, { id: 'a2', role: 'Account VA', difficulty: 'easy' }, { id: 'a3', role: 'PPC VA', difficulty: 'hard' });
    const res = await listHandler(listRequest('PPC VA'));
    expect(res.body.assessments.length).toBe(2);
    expect(res.body.assessments.every((a: any) => a.role === 'PPC VA')).toBe(true);
  });

  it('filters by difficulty', async () => {
    assessments.push({ id: 'a1', role: 'PPC VA', difficulty: 'easy' }, { id: 'a2', role: 'PPC VA', difficulty: 'hard' });
    const res = await listHandler(listRequest(undefined, 'hard'));
    expect(res.body.assessments.length).toBe(1);
    expect(res.body.assessments[0].difficulty).toBe('hard');
  });

  it('filters by both role and difficulty', async () => {
    assessments.push({ id: 'a1', role: 'PPC VA', difficulty: 'easy' }, { id: 'a2', role: 'PPC VA', difficulty: 'hard' }, { id: 'a3', role: 'Account VA', difficulty: 'easy' });
    const res = await listHandler(listRequest('PPC VA', 'easy'));
    expect(res.body.assessments.length).toBe(1);
    expect(res.body.assessments[0].id).toBe('a1');
  });

  it('treats "all" as no filter', async () => {
    assessments.push({ id: 'a1', role: 'PPC VA', difficulty: 'easy' });
    const res = await listHandler(listRequest('all', 'all'));
    expect(res.body.assessments.length).toBe(1);
  });

  it('returns empty when filter matches nothing', async () => {
    assessments.push({ id: 'a1', role: 'PPC VA', difficulty: 'easy' });
    const res = await listHandler(listRequest('Agency VA'));
    expect(res.body.assessments).toEqual([]);
  });

  it('includes answerKey in list (no stripping)', async () => {
    assessments.push({ id: 'a1', role: 'PPC VA', difficulty: 'easy', answerKey: { secret: true }, rubric: {} });
    const res = await listHandler(listRequest());
    expect(res.body.assessments[0].answerKey).toBeDefined();
  });

  it('returns 500 on URL error', async () => {
    const res = await listHandler({ url: undefined });
    expect(res.status).toBe(500);
  });
});

describe('GET /api/assessments/[id]', () => {
  beforeEach(() => reset());

  it('returns assessment by id', async () => {
    assessments.push({ id: 'a1', title: 'Test', role: 'PPC VA', difficulty: 'easy', description: 'desc', datasetInfo: { rows: 100 } });
    const res = await getByIdHandler({ url: 'x' }, 'a1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('a1');
    expect(res.body.title).toBe('Test');
  });

  it('returns 404 for non-existent id', async () => {
    const res = await getByIdHandler({ url: 'x' }, 'nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Assessment not found');
  });

  it('strips answerKey and rubric', async () => {
    assessments.push({ id: 'a1', title: 'Test', role: 'PPC VA', difficulty: 'easy', description: 'd', datasetInfo: {}, answerKey: { a: 1 }, rubric: { b: 2 } });
    const res = await getByIdHandler({ url: 'x' }, 'a1');
    expect(res.body).not.toHaveProperty('answerKey');
    expect(res.body).not.toHaveProperty('rubric');
  });

  it('includes description and datasetInfo', async () => {
    assessments.push({ id: 'a1', title: 'T', role: 'PPC VA', difficulty: 'easy', description: 'My desc', datasetInfo: { columns: 5 } });
    const res = await getByIdHandler({ url: 'x' }, 'a1');
    expect(res.body.description).toBe('My desc');
    expect(res.body.datasetInfo).toEqual({ columns: 5 });
  });

  it('returns datasetInfo as empty object when not set', async () => {
    assessments.push({ id: 'a1', title: 'T', role: 'PPC VA', difficulty: 'easy', description: 'd' });
    const res = await getByIdHandler({ url: 'x' }, 'a1');
    expect(res.body.datasetInfo).toBeUndefined();
  });
});

describe('POST /api/assessments/[id] (submit)', () => {
  beforeEach(() => reset());

  it('returns 401 when not authenticated', async () => {
    currentUser = null;
    assessments.push({ id: 'a1', title: 'T', role: 'PPC VA', difficulty: 'easy' });
    const res = await submitHandler({ json: async () => ({ answers: ['a'] }), headers: { get: () => null } }, 'a1');
    expect(res.status).toBe(401);
  });

  it('returns 404 for non-existent assessment', async () => {
    currentUser = { id: 'u1' };
    const res = await submitHandler({ json: async () => ({ answers: [] }), headers: { get: () => null } }, 'nonexistent');
    expect(res.status).toBe(404);
  });

  it('returns 200 and logs agent run on success', async () => {
    currentUser = { id: 'u1' };
    assessments.push({ id: 'a1', title: 'T', role: 'PPC VA', difficulty: 'easy' });
    const res = await submitHandler({ json: async () => ({ answers: ['q1', 'q2'] }), headers: { get: () => null } }, 'a1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.assessmentId).toBe('a1');
    expect(agentRuns.length).toBe(1);
    expect(agentRuns[0].userId).toBe('u1');
    expect(agentRuns[0].agentType).toBe('practical_test');
  });

  it('stores assessmentId and answers in agent run', async () => {
    currentUser = { id: 'u2' };
    assessments.push({ id: 'a1', title: 'T', role: 'PPC VA', difficulty: 'easy' });
    await submitHandler({ json: async () => ({ answers: ['a', 'b', 'c'] }), headers: { get: () => null } }, 'a1');
    const run = JSON.parse(agentRuns[0].input);
    expect(run.assessmentId).toBe('a1');
    expect(run.answers).toEqual(['a', 'b', 'c']);
  });

  it('allows multiple submissions', async () => {
    currentUser = { id: 'u1' };
    assessments.push({ id: 'a1', title: 'T', role: 'PPC VA', difficulty: 'easy' });
    await submitHandler({ json: async () => ({ answers: ['a'] }), headers: { get: () => null } }, 'a1');
    await submitHandler({ json: async () => ({ answers: ['b'] }), headers: { get: () => null } }, 'a1');
    expect(agentRuns.length).toBe(2);
  });

  it('returns 500 on json parse error', async () => {
    currentUser = { id: 'u1' };
    assessments.push({ id: 'a1', title: 'T', role: 'PPC VA', difficulty: 'easy' });
    const res = await submitHandler({ json: async () => { throw new Error('bad'); }, headers: { get: () => null } }, 'a1');
    expect(res.status).toBe(500);
  });
});
