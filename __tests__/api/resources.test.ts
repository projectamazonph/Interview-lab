/**
 * @vitest-environment node
 */

/**
 * API Integration Tests - Resume, Cover Letter, Assessments, Downloads, Guides, Admin, Export
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
    body: json,
    cookie: extractSessionCookie(res.headers.get('set-cookie')),
  };
}

async function login(email: string, password: string) {
  const { body, cookie } = await api('POST', '/api/auth/login', { email, password });
  return { id: body.id as string, cookie: cookie as string };
}

async function getDemoUser() {
  return login('demo@interviewlab.com', 'demo123');
}

async function getAdminUser() {
  return login('admin@interviewlab.com', 'admin123');
}

describe('Resume API', () => {
  let userCookie: string;
  let resumeId: string;

  beforeAll(async () => {
    ({ cookie: userCookie } = await getDemoUser());
  });

  testIfServer('should create a resume', async () => {
    const { status, body } = await api('POST', '/api/resume', {
      originalText: 'John Doe\nAmazon VA\nExperienced in PPC campaigns',
      targetRole: 'Amazon PPC VA',
    }, { Cookie: userCookie });
    expect(status).toBe(201);
    expect(body).toHaveProperty('id');
    resumeId = body.id;
  });

  testIfServer('should list resumes', async () => {
    const { status, body } = await api('GET', '/api/resume', undefined, {
      Cookie: userCookie,
    });
    expect(status).toBe(200);
    expect(body).toHaveProperty('resumes');
    expect(Array.isArray(body.resumes)).toBe(true);
  });

  testIfServer('should require auth for resume list', async () => {
    const { status } = await api('GET', '/api/resume');
    expect(status).toBe(401);
  });

  testIfServer('should get resume by ID with auth', async () => {
    const { status, body } = await api('GET', `/api/resume/${resumeId}`, undefined, {
      Cookie: userCookie,
    });
    expect(status).toBe(200);
    expect(body).toHaveProperty('id');
  });

  testIfServer('should reject unauthenticated resume GET', async () => {
    const { status } = await api('GET', `/api/resume/${resumeId}`);
    expect(status).toBe(401);
  });

  testIfServer('should update resume with auth', async () => {
    const { status } = await api('PUT', `/api/resume/${resumeId}`, {
      score: 72,
      improvedVersion: 'Improved resume text here',
      truthFlags: [' unverifiable claim 1'],
    }, { Cookie: userCookie });
    expect(status).toBe(200);
  });

  testIfServer('should reject unauthenticated resume PUT', async () => {
    const { status } = await api('PUT', `/api/resume/${resumeId}`, {
      score: 99,
    });
    expect(status).toBe(401);
  });

  testIfServer('should verify ownership on resume GET', async () => {
    // Admin user should not be able to read demo user's resume
    const { cookie: adminCookie } = await getAdminUser();
    const { status } = await api('GET', `/api/resume/${resumeId}`, undefined, {
      Cookie: adminCookie,
    });
    expect(status).toBe(403);
  });
});

describe('Cover Letter API', () => {
  let userCookie: string;
  let coverLetterId: string;

  beforeAll(async () => {
    ({ cookie: userCookie } = await getDemoUser());
  });

  testIfServer('should create a cover letter', async () => {
    const { status, body } = await api('POST', '/api/cover-letter', {
      jobDescription: 'Looking for Amazon PPC VA',
      tone: 'professional',
      generatedLetter: 'Dear Hiring Manager...',
      truthFlags: [],
    }, { Cookie: userCookie });
    expect(status).toBe(201);
    expect(body).toHaveProperty('id');
    coverLetterId = body.id;
  });

  testIfServer('should list cover letters', async () => {
    const { status, body } = await api('GET', '/api/cover-letter', undefined, {
      Cookie: userCookie,
    });
    expect(status).toBe(200);
    expect(body).toHaveProperty('coverLetters');
  });

  testIfServer('should require auth for cover letter list', async () => {
    const { status } = await api('GET', '/api/cover-letter');
    expect(status).toBe(401);
  });

  testIfServer('should require auth for cover letter GET by ID', async () => {
    const { status } = await api('GET', `/api/cover-letter/${coverLetterId}`);
    expect(status).toBe(401);
  });

  testIfServer('should require auth for cover letter PUT', async () => {
    const { status } = await api('PUT', `/api/cover-letter/${coverLetterId}`, {
      generatedLetter: 'Updated letter',
    });
    expect(status).toBe(401);
  });
});

describe('Assessments API', () => {
  testIfServer('should list assessments', async () => {
    const { status, body } = await api('GET', '/api/assessments');
    expect(status).toBe(200);
    expect(body).toHaveProperty('assessments');
    expect(body.assessments.length).toBeGreaterThan(0);
  });

  testIfServer('should filter assessments by role', async () => {
    const { status } = await api('GET', '/api/assessments?role=Amazon%20PPC%20VA');
    expect(status).toBe(200);
  });
});

describe('Downloads API', () => {
  testIfServer('should list downloads', async () => {
    const { status, body } = await api('GET', '/api/downloads');
    expect(status).toBe(200);
    expect(body).toHaveProperty('downloads');
    expect(body.downloads.length).toBeGreaterThan(0);
  });

  testIfServer('should validate fileName for safe characters on download', async () => {
    // This tests the open redirect fix
    const { body } = await api('GET', '/api/downloads');
    const download = body.downloads[0];
    if (!download) return;
    // The fileName should only contain safe characters
    expect(download.fileName).toMatch(/^[a-zA-Z0-9._-]+$/);
  });
});

describe('Guides API', () => {
  let userCookie: string;

  beforeAll(async () => {
    ({ cookie: userCookie } = await getDemoUser());
  });

  testIfServer('should list only published guides', async () => {
    const { status, body } = await api('GET', '/api/guides');
    expect(status).toBe(200);
    expect(body).toHaveProperty('guides');
    // All returned guides should be published
    body.guides.forEach((g: { status: string }) => {
      expect(g.status).toBe('published');
    });
  });

  testIfServer('should require auth for guide progress GET', async () => {
    const { status } = await api('GET', '/api/guides/progress');
    expect(status).toBe(401);
  });

  testIfServer('should require auth for guide progress POST', async () => {
    const { status } = await api('POST', '/api/guides/progress', {
      guideId: 'test',
      completed: true,
    });
    expect(status).toBe(401);
  });

  testIfServer('should save and retrieve guide progress', async () => {
    const { body: guidesBody } = await api('GET', '/api/guides?limit=1');
    const guideId = guidesBody.guides[0]?.id;
    if (!guideId) return;

    // Save progress
    const { status: saveStatus } = await api('POST', '/api/guides/progress', {
      guideId,
      completed: false,
      checklist: { item0: true, item1: false },
    }, { Cookie: userCookie });
    expect(saveStatus).toBe(200);

    // Retrieve progress
    const { status: getStatus, body: getBody } = await api('GET', '/api/guides/progress', undefined, {
      Cookie: userCookie,
    });
    expect(getStatus).toBe(200);
    expect(getBody).toHaveProperty('progress');
    expect(Array.isArray(getBody.progress)).toBe(true);
  });
});

describe('Admin API', () => {
  let adminCookie: string;
  let demoCookie: string;

  beforeAll(async () => {
    ({ cookie: adminCookie } = await getAdminUser());
    ({ cookie: demoCookie } = await getDemoUser());
  });

  testIfServer('should allow admin to list questions', async () => {
    const { status, body } = await api('GET', '/api/admin/questions', undefined, {
      Cookie: adminCookie,
    });
    expect(status).toBe(200);
    expect(body).toHaveProperty('questions');
    expect(body).toHaveProperty('total');
  });

  testIfServer('should reject non-admin from admin questions', async () => {
    const { status } = await api('GET', '/api/admin/questions', undefined, {
      Cookie: demoCookie,
    });
    expect(status).toBe(401);
  });

  testIfServer('should allow admin to create a question', async () => {
    const { status, body } = await api('POST', '/api/admin/questions', {
      role: 'PPC VA',
      difficulty: 'beginner',
      type: 'technical',
      skillArea: 'PPC',
      question: 'Test question from integration test',
      strongAnswerPoints: ['Point 1', 'Point 2'],
      weakAnswerWarnings: ['Warning 1'],
      sampleAnswer: 'Sample answer text',
    }, { Cookie: adminCookie });
    expect(status).toBe(201);
    expect(body).toHaveProperty('id');
  });

  testIfServer('should reject unauthenticated admin access', async () => {
    const { status } = await api('GET', '/api/admin/questions');
    expect(status).toBe(401);
  });
});

describe('Export API', () => {
  let userCookie: string;

  beforeAll(async () => {
    ({ cookie: userCookie } = await getDemoUser());
  });

  testIfServer('should require auth for export', async () => {
    const { status } = await api('POST', '/api/export', {
      type: 'docx',
      content: 'Test',
      title: 'Test',
    });
    expect(status).toBe(401);
  });

  testIfServer('should validate required fields for export', async () => {
    const { status } = await api('POST', '/api/export', {}, {
      Cookie: userCookie,
    });
    expect(status).toBe(400);
  });
});
