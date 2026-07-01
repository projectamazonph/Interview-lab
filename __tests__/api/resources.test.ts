/**
 * @vitest-environment node
 */

/**
 * API Integration Tests - Resume, Cover Letter, Assessments, Downloads, Guides, Admin, Export
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

async function getAdminUserId() {
  const { body } = await api('POST', '/api/auth/login', {
    email: 'admin@interviewlab.com',
    password: 'admin123',
  });
  return body.id;
}

describe('Resume API', () => {
  let userId: string;
  let resumeId: string;

  beforeAll(async () => {
    userId = await getDemoUserId();
  });

  it('should create a resume', async () => {
    const { status, body } = await api('POST', '/api/resume', {
      originalText: 'John Doe\nAmazon VA\nExperienced in PPC campaigns',
      targetRole: 'Amazon PPC VA',
    }, { 'x-user-id': userId });
    expect(status).toBe(201);
    expect(body).toHaveProperty('id');
    resumeId = body.id;
  });

  it('should list resumes', async () => {
    const { status, body } = await api('GET', '/api/resume', undefined, {
      'x-user-id': userId,
    });
    expect(status).toBe(200);
    expect(body).toHaveProperty('resumes');
    expect(Array.isArray(body.resumes)).toBe(true);
  });

  it('should require auth for resume list', async () => {
    const { status } = await api('GET', '/api/resume');
    expect(status).toBe(401);
  });

  it('should get resume by ID with auth', async () => {
    const { status, body } = await api('GET', `/api/resume/${resumeId}`, undefined, {
      'x-user-id': userId,
    });
    expect(status).toBe(200);
    expect(body).toHaveProperty('id');
  });

  it('should reject unauthenticated resume GET', async () => {
    const { status } = await api('GET', `/api/resume/${resumeId}`);
    expect(status).toBe(401);
  });

  it('should update resume with auth', async () => {
    const { status, body } = await api('PUT', `/api/resume/${resumeId}`, {
      score: 72,
      improvedVersion: 'Improved resume text here',
      truthFlags: [' unverifiable claim 1'],
    }, { 'x-user-id': userId });
    expect(status).toBe(200);
  });

  it('should reject unauthenticated resume PUT', async () => {
    const { status } = await api('PUT', `/api/resume/${resumeId}`, {
      score: 99,
    });
    expect(status).toBe(401);
  });

  it('should verify ownership on resume GET', async () => {
    // Admin user should not be able to read demo user's resume
    const adminId = await getAdminUserId();
    const { status } = await api('GET', `/api/resume/${resumeId}`, undefined, {
      'x-user-id': adminId,
    });
    expect(status).toBe(403);
  });
});

describe('Cover Letter API', () => {
  let userId: string;
  let coverLetterId: string;

  beforeAll(async () => {
    userId = await getDemoUserId();
  });

  it('should create a cover letter', async () => {
    const { status, body } = await api('POST', '/api/cover-letter', {
      jobDescription: 'Looking for Amazon PPC VA',
      tone: 'professional',
      generatedLetter: 'Dear Hiring Manager...',
      truthFlags: [],
    }, { 'x-user-id': userId });
    expect(status).toBe(201);
    expect(body).toHaveProperty('id');
    coverLetterId = body.id;
  });

  it('should list cover letters', async () => {
    const { status, body } = await api('GET', '/api/cover-letter', undefined, {
      'x-user-id': userId,
    });
    expect(status).toBe(200);
    expect(body).toHaveProperty('coverLetters');
  });

  it('should require auth for cover letter list', async () => {
    const { status } = await api('GET', '/api/cover-letter');
    expect(status).toBe(401);
  });

  it('should require auth for cover letter GET by ID', async () => {
    const { status } = await api('GET', `/api/cover-letter/${coverLetterId}`);
    expect(status).toBe(401);
  });

  it('should require auth for cover letter PUT', async () => {
    const { status } = await api('PUT', `/api/cover-letter/${coverLetterId}`, {
      generatedLetter: 'Updated letter',
    });
    expect(status).toBe(401);
  });
});

describe('Assessments API', () => {
  it('should list assessments', async () => {
    const { status, body } = await api('GET', '/api/assessments');
    expect(status).toBe(200);
    expect(body).toHaveProperty('assessments');
    expect(body.assessments.length).toBeGreaterThan(0);
  });

  it('should filter assessments by role', async () => {
    const { status, body } = await api('GET', '/api/assessments?role=Amazon%20PPC%20VA');
    expect(status).toBe(200);
  });
});

describe('Downloads API', () => {
  it('should list downloads', async () => {
    const { status, body } = await api('GET', '/api/downloads');
    expect(status).toBe(200);
    expect(body).toHaveProperty('downloads');
    expect(body.downloads.length).toBeGreaterThan(0);
  });

  it('should validate fileName for safe characters on download', async () => {
    // This tests the open redirect fix
    const { body } = await api('GET', '/api/downloads');
    const download = body.downloads[0];
    if (!download) return;
    // The fileName should only contain safe characters
    expect(download.fileName).toMatch(/^[a-zA-Z0-9._-]+$/);
  });
});

describe('Guides API', () => {
  let userId: string;

  beforeAll(async () => {
    userId = await getDemoUserId();
  });

  it('should list only published guides', async () => {
    const { status, body } = await api('GET', '/api/guides');
    expect(status).toBe(200);
    expect(body).toHaveProperty('guides');
    // All returned guides should be published
    body.guides.forEach((g: { status: string }) => {
      expect(g.status).toBe('published');
    });
  });

  it('should have 30 guides (beginner + intermediate + advanced)', async () => {
    const { body } = await api('GET', '/api/guides');
    expect(body.guides.length).toBe(30);
  });

  it('should require auth for guide progress GET', async () => {
    const { status } = await api('GET', '/api/guides/progress');
    expect(status).toBe(401);
  });

  it('should require auth for guide progress POST', async () => {
    const { status } = await api('POST', '/api/guides/progress', {
      guideId: 'test',
      completed: true,
    });
    expect(status).toBe(401);
  });

  it('should save and retrieve guide progress', async () => {
    const { body: guidesBody } = await api('GET', '/api/guides?limit=1');
    const guideId = guidesBody.guides[0]?.id;
    if (!guideId) return;

    // Save progress
    const { status: saveStatus } = await api('POST', '/api/guides/progress', {
      guideId,
      completed: false,
      checklist: { item0: true, item1: false },
    }, { 'x-user-id': userId });
    expect(saveStatus).toBe(200);

    // Retrieve progress
    const { status: getStatus, body: getBody } = await api('GET', '/api/guides/progress', undefined, {
      'x-user-id': userId,
    });
    expect(getStatus).toBe(200);
    expect(getBody).toHaveProperty('progress');
    expect(Array.isArray(getBody.progress)).toBe(true);
  });
});

describe('Admin API', () => {
  let adminId: string;
  let demoId: string;

  beforeAll(async () => {
    adminId = await getAdminUserId();
    demoId = await getDemoUserId();
  });

  it('should allow admin to list questions', async () => {
    const { status, body } = await api('GET', '/api/admin/questions', undefined, {
      'x-user-id': adminId,
    });
    expect(status).toBe(200);
    expect(body).toHaveProperty('questions');
    expect(body).toHaveProperty('total');
  });

  it('should reject non-admin from admin questions', async () => {
    const { status } = await api('GET', '/api/admin/questions', undefined, {
      'x-user-id': demoId,
    });
    expect(status).toBe(403);
  });

  it('should allow admin to create a question', async () => {
    const { status, body } = await api('POST', '/api/admin/questions', {
      role: 'Amazon PPC VA',
      difficulty: 'beginner',
      type: 'technical',
      skillArea: 'PPC Fundamentals',
      question: 'Test question from integration test',
      strongAnswerPoints: ['Point 1', 'Point 2'],
      weakAnswerWarnings: ['Warning 1'],
      sampleAnswer: 'Sample answer text',
    }, { 'x-user-id': adminId });
    expect(status).toBe(201);
    expect(body).toHaveProperty('id');
  });

  it('should reject unauthenticated admin access', async () => {
    const { status } = await api('GET', '/api/admin/questions');
    expect(status).toBe(401);
  });
});

describe('Export API', () => {
  let userId: string;

  beforeAll(async () => {
    userId = await getDemoUserId();
  });

  it('should require auth for export', async () => {
    const { status } = await api('POST', '/api/export', {
      type: 'docx',
      content: 'Test',
      title: 'Test',
    });
    expect(status).toBe(401);
  });

  it('should validate required fields for export', async () => {
    const { status, body } = await api('POST', '/api/export', {}, {
      'x-user-id': userId,
    });
    expect(status).toBe(400);
  });
});
