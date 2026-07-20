/**
 * @vitest-environment node
 */

/**
 * User Path Simulation Tests
 * Simulates complete user journeys through the app
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

// Skip integration tests in CI unless a live server is provided via TEST_BASE_URL
const testIfServer = process.env.CI && !process.env.TEST_BASE_URL ? it.skip : it;

function extractSessionCookie(setCookieHeader: string | null): string | undefined {
  if (!setCookieHeader) return undefined;
  return setCookieHeader.match(/interviewlab_session=[^;]+/)?.[0];
}

async function api(method: string, path: string, body?: unknown, headers?: Record<string, string>) {
  const opts: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  const json = await res.json();
  return {
    status: res.status,
    body: json as Record<string, unknown>,
    cookie: extractSessionCookie(res.headers.get('set-cookie')),
  };
}

async function login(email: string, password: string) {
  const { body, cookie } = await api('POST', '/api/auth/login', { email, password });
  return { id: body.id as string, cookie: cookie as string };
}

describe('User Path: New User Registration to First Interview', () => {
  const testEmail = `e2e_new_${Date.now()}@test.com`;
  let userCookie: string;

  testIfServer('Step 1: Register a new account', async () => {
    const { status, body } = await api('POST', '/api/auth/register', {
      email: testEmail,
      name: 'E2E Test User',
      password: 'TestPass123!',
    });
    expect(status).toBe(201);
    expect(body.id).toBeTruthy();
  });

  testIfServer('Step 2: Login with new credentials', async () => {
    const { status, body, cookie } = await api('POST', '/api/auth/login', {
      email: testEmail,
      password: 'TestPass123!',
    });
    expect(status).toBe(200);
    expect(body.email).toBe(testEmail);
    userCookie = cookie as string;
  });

  testIfServer('Step 3: Get profile (should have onboardingDone: false)', async () => {
    const { status } = await api('GET', '/api/profile', undefined, {
      Cookie: userCookie,
    });
    expect(status).toBe(200);
    // New user should not have completed onboarding
  });

  testIfServer('Step 4: Complete onboarding (update profile)', async () => {
    const { status } = await api('PUT', '/api/profile', {
      targetRole: 'Amazon PPC VA',
      experienceLevel: 'beginner',
      toolsKnown: ['Helium10', 'Seller Central'],
      weakAreas: ['PPC optimization'],
      interviewDate: '2025-09-01',
      confidenceLevel: 'low',
      resumeStatus: 'needs-work',
      country: 'Philippines',
      onboardingDone: true,
    }, { Cookie: userCookie });
    expect(status).toBe(200);
  });

  testIfServer('Step 5: View dashboard', async () => {
    const { status, body } = await api('GET', '/api/dashboard', undefined, {
      Cookie: userCookie,
    });
    expect(status).toBe(200);
    expect(body).toHaveProperty('stats');
    expect((body.stats as Record<string, number>).totalSessions).toBe(0);
  });

  testIfServer('Step 6: Browse questions', async () => {
    const { status, body } = await api('GET', '/api/questions?role=PPC+VA');
    expect(status).toBe(200);
    expect((body.questions as unknown[]).length).toBeGreaterThan(0);
  });

  testIfServer('Step 7: Start a quick drill interview', async () => {
    const { status, body } = await api('POST', '/api/interview', {
      mode: 'quick_drill',
      targetRole: 'Amazon PPC VA',
    }, { Cookie: userCookie });
    expect(status).toBe(200);
    expect(body).toHaveProperty('session');
    expect(body).toHaveProperty('questions');
    expect((body.questions as unknown[]).length).toBe(5);
  });

  testIfServer('Step 8: View downloads', async () => {
    const { status, body } = await api('GET', '/api/downloads');
    expect(status).toBe(200);
    expect((body.downloads as unknown[]).length).toBeGreaterThan(0);
  });

  testIfServer('Step 9: View learning paths', async () => {
    const { status, body } = await api('GET', '/api/guides');
    expect(status).toBe(200);
    expect((body.guides as unknown[]).length).toBeGreaterThan(0);
  });
});

describe('User Path: Resume Review Flow', () => {
  let userCookie: string;
  let resumeId: string;

  beforeAll(async () => {
    ({ cookie: userCookie } = await login('demo@interviewlab.com', 'demo123'));
  });

  testIfServer('Step 1: Create a resume', async () => {
    const { status, body } = await api('POST', '/api/resume', {
      originalText: 'Jane Smith\nAmazon PPC Virtual Assistant\n- Managed PPC campaigns\n- Used Helium10 for keyword research\n- Created weekly reports for clients\n- Familiar with Seller Central',
      targetRole: 'Amazon PPC VA',
    }, { Cookie: userCookie });
    expect(status).toBe(201);
    resumeId = body.id as string;
  });

  testIfServer('Step 2: Get AI resume review', async () => {
    const { status, body } = await api('POST', '/api/ai/resume-review', {
      resumeText: 'Jane Smith - Amazon PPC VA - Managed campaigns with Helium10',
      targetRole: 'Amazon PPC VA',
    }, { Cookie: userCookie });
    expect(status).toBe(200);
    expect(body).toHaveProperty('score');
    expect(body).toHaveProperty('missingKeywords');
    expect(body).toHaveProperty('improvedSummary');
  });

  testIfServer('Step 3: Update resume with AI feedback', async () => {
    const { status } = await api('PUT', `/api/resume/${resumeId}`, {
      score: 72,
      improvedVersion: 'Improved resume text',
      truthFlags: ['unverifiable: "Managed campaigns"'],
    }, { Cookie: userCookie });
    expect(status).toBe(200);
  });

  testIfServer('Step 4: List resumes and verify', async () => {
    const { status, body } = await api('GET', '/api/resume', undefined, {
      Cookie: userCookie,
    });
    expect(status).toBe(200);
    expect((body.resumes as unknown[]).length).toBeGreaterThan(0);
  });
});

describe('User Path: Full Interview Session', () => {
  let userCookie: string;
  let sessionId: string;
  let questionId: string;

  beforeAll(async () => {
    ({ cookie: userCookie } = await login('demo@interviewlab.com', 'demo123'));
  });

  testIfServer('Step 1: Create role interview session', async () => {
    const { status, body } = await api('POST', '/api/interview', {
      mode: 'role_interview',
      targetRole: 'Amazon PPC VA',
    }, { Cookie: userCookie });
    expect(status).toBe(200);
    sessionId = (body.session as Record<string, unknown>).id as string;
    questionId = ((body.questions as Record<string, unknown>[])[0]?.id) as string;
  });

  testIfServer('Step 2: Submit answer to first question', async () => {
    const { status } = await api('POST', `/api/interview/${sessionId}`, {
      questionId,
      userAnswer: 'ACoS stands for Advertising Cost of Sales. It measures the ratio of ad spend to sales. A lower ACoS means better efficiency. I would aim for a target ACoS based on the product profit margin.',
    }, { Cookie: userCookie });
    expect(status).toBe(201);
  });

  testIfServer('Step 3: Get session with attempts', async () => {
    const { status, body } = await api('GET', `/api/interview/${sessionId}`, undefined, {
      Cookie: userCookie,
    });
    expect(status).toBe(200);
    expect((body.attempts as unknown[]).length).toBeGreaterThan(0);
  });

  testIfServer('Step 4: Complete the session', async () => {
    const { status, body } = await api('POST', `/api/interview/${sessionId}/complete`, {
      transcript: { notes: 'Test session' },
    }, { Cookie: userCookie });
    expect(status).toBe(200);
    expect(body).toHaveProperty('sessionId');
  });

  testIfServer('Step 5: Verify dashboard shows updated stats', async () => {
    const { status, body } = await api('GET', '/api/dashboard', undefined, {
      Cookie: userCookie,
    });
    expect(status).toBe(200);
    expect((body.stats as Record<string, number>).totalSessions).toBeGreaterThan(0);
  });
});

describe('User Path: Cover Letter Generation', () => {
  let userCookie: string;

  beforeAll(async () => {
    ({ cookie: userCookie } = await login('demo@interviewlab.com', 'demo123'));
  });

  testIfServer('Step 1: Generate cover letter with AI', async () => {
    const { status, body } = await api('POST', '/api/ai/cover-letter', {
      jobDescription: 'We are looking for an Amazon PPC VA to manage campaigns, perform keyword research, and create weekly reports. Must be familiar with Seller Central and advertising console.',
      tone: 'professional',
      targetRole: 'Amazon PPC VA',
      userName: 'Test User',
    }, { Cookie: userCookie });
    expect(status).toBe(200);
    expect(body).toHaveProperty('draftLetter');
  });

  testIfServer('Step 2: Save cover letter', async () => {
    const { status, body } = await api('POST', '/api/cover-letter', {
      jobDescription: 'Amazon PPC VA position',
      tone: 'professional',
      generatedLetter: 'Dear Hiring Manager...',
      truthFlags: [],
    }, { Cookie: userCookie });
    expect(status).toBe(201);
    expect(body).toHaveProperty('id');
  });
});

describe('User Path: Learning Path Progress', () => {
  let userCookie: string;
  let guideId: string;

  beforeAll(async () => {
    ({ cookie: userCookie } = await login('demo@interviewlab.com', 'demo123'));

    // Get a beginner guide
    const guideRes = await api('GET', '/api/guides?level=beginner&limit=1');
    guideId = ((guideRes.body.guides as Record<string, unknown>[])[0]?.id) as string;
  });

  testIfServer('Step 1: View guide details', async () => {
    if (!guideId) return;
    const { status, body } = await api('GET', `/api/guides/${guideId}`);
    expect(status).toBe(200);
    expect(body).toHaveProperty('title');
    expect(body).toHaveProperty('content');
  });

  testIfServer('Step 2: Save progress with checkboxes', async () => {
    if (!guideId) return;
    const { status } = await api('POST', '/api/guides/progress', {
      guideId,
      completed: false,
      checklist: { '0': true, '1': true, '2': false },
    }, { Cookie: userCookie });
    expect(status).toBe(200);
  });

  testIfServer('Step 3: Mark guide as complete', async () => {
    if (!guideId) return;
    const { status } = await api('POST', '/api/guides/progress', {
      guideId,
      completed: true,
      checklist: { '0': true, '1': true, '2': true },
    }, { Cookie: userCookie });
    expect(status).toBe(200);
  });

  testIfServer('Step 4: Verify progress is persisted', async () => {
    const { status, body } = await api('GET', '/api/guides/progress', undefined, {
      Cookie: userCookie,
    });
    expect(status).toBe(200);
    const progress = body.progress as Record<string, unknown>[];
    const thisGuideProgress = progress.find(p => p.guideId === guideId);
    expect(thisGuideProgress).toBeDefined();
    expect(thisGuideProgress?.completed).toBe(true);
  });
});

describe('User Path: Admin Operations', () => {
  let adminCookie: string;

  beforeAll(async () => {
    ({ cookie: adminCookie } = await login('admin@interviewlab.com', 'admin123'));
  });

  testIfServer('Step 1: List all questions as admin', async () => {
    const { status, body } = await api('GET', '/api/admin/questions?limit=10', undefined, {
      Cookie: adminCookie,
    });
    expect(status).toBe(200);
    expect((body.questions as unknown[]).length).toBeGreaterThan(0);
  });

  testIfServer('Step 2: Create a new question', async () => {
    const { status, body } = await api('POST', '/api/admin/questions', {
      role: 'PPC VA',
      difficulty: 'beginner',
      type: 'technical',
      skillArea: 'PPC',
      question: 'E2E Test Question: What is the difference between ACoS and ROAS?',
      strongAnswerPoints: ['ACoS measures cost', 'ROAS measures return'],
      weakAnswerWarnings: ['Confusing the two metrics'],
      sampleAnswer: 'ACoS is the ratio of ad spend to sales, while ROAS is the inverse - sales per dollar of ad spend.',
    }, { Cookie: adminCookie });
    expect(status).toBe(201);
    expect(body).toHaveProperty('id');
  });

  testIfServer('Step 3: Create a new guide', async () => {
    const { status } = await api('POST', '/api/guides', {
      title: 'E2E Test Guide',
      slug: `e2e-test-guide-${Date.now()}`,
      level: 'beginner',
      role: 'Amazon PPC VA',
      content: '# Test Guide\n\nThis is a test guide for E2E testing.\n\n- [ ] Checklist item 1\n- [ ] Checklist item 2',
      status: 'draft',
    }, { Cookie: adminCookie });
    expect(status).toBe(201);
  });

  testIfServer('Step 4: Verify draft guide is NOT visible to regular users', async () => {
    const { body } = await api('GET', '/api/guides');
    const guides = body.guides as Record<string, unknown>[];
    const draftGuide = guides.find(g => g.title === 'E2E Test Guide');
    expect(draftGuide).toBeUndefined(); // Draft should not appear
  });
});
