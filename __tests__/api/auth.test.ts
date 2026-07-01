/**
 * API Integration Tests - Auth Endpoints
 * Tests the full auth flow against a running server
 * @vitest-environment node
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

// Helper for API calls
async function api(method: string, path: string, body?: unknown, headers?: Record<string, string>) {
  const opts: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  const json = await res.json();
  return { status: res.status, body: json };
}

describe('Auth API', () => {
  const testEmail = `test_auth_${Date.now()}@test.com`;

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const { status, body } = await api('POST', '/api/auth/register', {
        email: testEmail,
        name: 'Test User',
        password: 'TestPass123',
      });
      expect(status).toBe(201);
      expect(body).toHaveProperty('id');
      expect(body.email).toBe(testEmail);
      expect(body).toHaveProperty('subscriptionTier', 'free');
      expect(body).toHaveProperty('isAdmin', false);
      expect(body).not.toHaveProperty('passwordHash');
    });

    it('should reject duplicate email registration', async () => {
      const { status, body } = await api('POST', '/api/auth/register', {
        email: testEmail,
        name: 'Test User',
        password: 'TestPass123',
      });
      expect(status).toBe(409);
      expect(body).toHaveProperty('error');
    });

    it('should reject missing email', async () => {
      const { status, body } = await api('POST', '/api/auth/register', {
        password: 'TestPass123',
      });
      expect(status).toBe(400);
      expect(body.error).toContain('required');
    });

    it('should reject missing password', async () => {
      const { status, body } = await api('POST', '/api/auth/register', {
        email: `nopass_${Date.now()}@test.com`,
      });
      expect(status).toBe(400);
      expect(body.error).toContain('required');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const { status, body } = await api('POST', '/api/auth/login', {
        email: 'demo@interviewlab.com',
        password: 'demo123',
      });
      expect(status).toBe(200);
      expect(body).toHaveProperty('id');
      expect(body.email).toBe('demo@interviewlab.com');
      expect(body).toHaveProperty('profile');
    });

    it('should reject wrong password', async () => {
      const { status, body } = await api('POST', '/api/auth/login', {
        email: 'demo@interviewlab.com',
        password: 'wrongpassword',
      });
      expect(status).toBe(401);
      expect(body).toHaveProperty('error');
    });

    it('should reject nonexistent user', async () => {
      const { status, body } = await api('POST', '/api/auth/login', {
        email: 'nonexistent@test.com',
        password: 'test',
      });
      expect(status).toBe(401);
      expect(body).toHaveProperty('error');
    });

    it('should reject missing fields', async () => {
      const { status } = await api('POST', '/api/auth/login', {});
      expect(status).toBe(400);
    });
  });
});
