/**
 * @vitest-environment node
 */

/**
 * API Integration Tests - Questions, Interviews, and AI Endpoints
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function api(method: string, path: string, body?: unknown, headers?: Record<string, string>) {
  const opts: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  const json = await res.json();
  return { status: res.status, body: json };
}

async function getDemoUserId() {
  const { body } = await api('POST', '/api/auth/login', {
    email: 'demo@interviewlab.com',
    password: 'demo123',
  });
  return body.id;
}

describe('Questions API', () => {
  it('should return questions with pagination', async () => {
    const { status, body } = await api('GET', '/api/questions');
    expect(status).toBe(200);
    expect(body).toHaveProperty('questions');
    expect(body).toHaveProperty('total');
    expect(Array.isArray(body.questions)).toBe(true);
    expect(body.total).toBeGreaterThan(0);
  });

  it('should filter questions by role', async () => {
    const { status, body } = await api('GET', '/api/questions?role=Amazon%20PPC%20VA');
    expect(status).toBe(200);
    expect(body.questions.length).toBeGreaterThan(0);
    body.questions.forEach((q: { role: string }) => {
      expect(q.role).toBe('Amazon PPC VA');
    });
  });

  it('should filter questions by difficulty', async () => {
    const { status, body } = await api('GET', '/api/questions?difficulty=beginner');
    expect(status).toBe(200);
    expect(body.questions.length).toBeGreaterThan(0);
  });

  it('should search questions', async () => {
    const { status, body } = await api('GET', '/api/questions?search=ACoS');
    expect(status).toBe(200);
    expect(body.total).toBeGreaterThan(0);
  });

  it('should return questions with required fields', async () => {
    const { body } = await api('GET', '/api/questions?limit=1');
    const q = body.questions[0];
    expect(q).toHaveProperty('id');
    expect(q).toHaveProperty('role');
    expect(q).toHaveProperty('difficulty');
    expect(q).toHaveProperty('type');
    expect(q).toHaveProperty('skillArea');
    expect(q).toHaveProperty('question');
  });
});

describe('Interview API', () => {
  let userId: string;
  let sessionId: string;

  beforeAll(async () => {
    userId = await getDemoUserId();
  });

  it('should create an interview session', async () => {
    const { status, body } = await api('POST', '/api/interview', {
      mode: 'quick_drill',
      targetRole: 'Amazon PPC VA',
    }, { 'x-user-id': userId });
    expect(status).toBe(200);
    expect(body).toHaveProperty('session');
    expect(body.session).toHaveProperty('id');
    expect(body).toHaveProperty('questions');
    expect(body.questions.length).toBeGreaterThan(0);
    sessionId = body.session.id;
  });

  it('should list interview sessions', async () => {
    const { status, body } = await api('GET', '/api/interview', undefined, {
      'x-user-id': userId,
    });
    expect(status).toBe(200);
    expect(body).toHaveProperty('sessions');
    expect(Array.isArray(body.sessions)).toBe(true);
  });

  it('should require auth for creating interview', async () => {
    const { status } = await api('POST', '/api/interview', {
      mode: 'quick_drill',
      targetRole: 'Amazon PPC VA',
    });
    expect(status).toBe(401);
  });

  it('should get interview session by ID with auth', async () => {
    const { status, body } = await api('GET', `/api/interview/${sessionId}`, undefined, {
      'x-user-id': userId,
    });
    expect(status).toBe(200);
    expect(body).toHaveProperty('id');
  });

  it('should reject unauthenticated GET on interview detail', async () => {
    const { status } = await api('GET', `/api/interview/${sessionId}`);
    expect(status).toBe(401);
  });

  it('should submit an answer', async () => {
    // Get a question ID first
    const { body: qb } = await api('GET', '/api/questions?limit=1');
    const questionId = qb.questions[0]?.id;
    if (!questionId) return;

    const { status, body } = await api('POST', `/api/interview/${sessionId}`, {
      questionId,
      userAnswer: 'I would check the ACoS and reduce bids on underperforming keywords',
    }, { 'x-user-id': userId });
    expect(status).toBe(201);
    expect(body).toHaveProperty('id');
  });

  it('should complete an interview session with auth', async () => {
    const { status, body } = await api('POST', `/api/interview/${sessionId}/complete`, {
      transcript: { test: 'data' },
    }, { 'x-user-id': userId });
    expect(status).toBe(200);
    expect(body).toHaveProperty('sessionId');
  });

  it('should reject unauthenticated completion', async () => {
    const { status } = await api('POST', `/api/interview/${sessionId}/complete`, {});
    expect(status).toBe(401);
  });
});

describe('AI Endpoints', () => {
  let userId: string;

  beforeAll(async () => {
    userId = await getDemoUserId();
  });

  it('should require auth for AI coach', async () => {
    const { status } = await api('POST', '/api/ai/coach', {
      question: 'What is ACoS?',
      userAnswer: 'Advertising Cost of Sales',
    });
    expect(status).toBe(401);
  });

  it('should validate required fields for AI coach', async () => {
    const { status, body } = await api('POST', '/api/ai/coach', {}, {
      'x-user-id': userId,
    });
    expect(status).toBe(400);
    expect(body).toHaveProperty('error');
  });

  it('should require auth for AI resume review', async () => {
    const { status } = await api('POST', '/api/ai/resume-review', {
      resumeText: 'Test resume',
    });
    expect(status).toBe(401);
  });

  it('should require auth for AI cover letter', async () => {
    const { status } = await api('POST', '/api/ai/cover-letter', {
      jobDescription: 'Test JD',
    });
    expect(status).toBe(401);
  });

  it('should require auth for AI assessment score', async () => {
    const { status } = await api('POST', '/api/ai/assessment-score', {
      assessmentTitle: 'Test',
      userAnswers: {},
    });
    expect(status).toBe(401);
  });
});
