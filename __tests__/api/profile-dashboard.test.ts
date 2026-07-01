/**
 * @vitest-environment node
 */

/**
 * API Integration Tests - Profile & Dashboard
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

describe('Profile API', () => {
  let userId: string;

  beforeAll(async () => {
    userId = await getDemoUserId();
  });

  it('should require authentication for GET /api/profile', async () => {
    const { status, body } = await api('GET', '/api/profile');
    expect(status).toBe(401);
    expect(body).toHaveProperty('error');
  });

  it('should get profile with valid auth', async () => {
    const { status, body } = await api('GET', '/api/profile', undefined, {
      'x-user-id': userId,
    });
    expect(status).toBe(200);
    expect(body).toBeDefined();
  });

  it('should update profile with valid data', async () => {
    const { status, body } = await api('PUT', '/api/profile', {
      targetRole: 'Amazon PPC VA',
      experienceLevel: 'beginner',
      toolsKnown: ['Helium10', 'Jungle Scout'],
      weakAreas: ['PPC optimization', 'Bid management'],
      interviewDate: '2025-08-01',
      confidenceLevel: 'medium',
      resumeStatus: 'needs-work',
      country: 'Philippines',
    }, { 'x-user-id': userId });
    expect(status).toBe(200);
    expect(body).toBeDefined();
  });

  it('should parse JSON fields on read', async () => {
    const { status, body } = await api('GET', '/api/profile', undefined, {
      'x-user-id': userId,
    });
    expect(status).toBe(200);
    // toolsKnown and weakAreas should be arrays, not JSON strings
    if (body.toolsKnown) {
      expect(Array.isArray(body.toolsKnown)).toBe(true);
    }
    if (body.weakAreas) {
      expect(Array.isArray(body.weakAreas)).toBe(true);
    }
  });

  it('should require authentication for PUT /api/profile', async () => {
    const { status } = await api('PUT', '/api/profile', {
      targetRole: 'Amazon PPC VA',
    });
    expect(status).toBe(401);
  });
});

describe('Dashboard API', () => {
  let userId: string;

  beforeAll(async () => {
    userId = await getDemoUserId();
  });

  it('should require authentication', async () => {
    const { status } = await api('GET', '/api/dashboard');
    expect(status).toBe(401);
  });

  it('should return dashboard data for authenticated user', async () => {
    const { status, body } = await api('GET', '/api/dashboard', undefined, {
      'x-user-id': userId,
    });
    expect(status).toBe(200);
    expect(body).toHaveProperty('stats');
    expect(body.stats).toHaveProperty('totalSessions');
    expect(body.stats).toHaveProperty('avgScore');
  });
});
