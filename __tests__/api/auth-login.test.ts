/**
 * @vitest-environment node
 *
 * Exercises the real route handlers in src/app/api/auth/login and
 * src/app/api/auth/logout with mocked db/password/rate-limit so we verify
 * the shipped code path (sanitization, bcrypt/legacy password handling,
 * rate limiting, session cookie creation) rather than a hand-copied
 * reimplementation of it.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyToken } from '@/lib/session';

const findUnique = vi.fn();
const update = vi.fn();
const verifyPassword = vi.fn();
const isLegacyHash = vi.fn();
const hashPassword = vi.fn();
const checkRateLimit = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: (...args: unknown[]) => findUnique(...args),
      update: (...args: unknown[]) => update(...args),
    },
  },
}));

vi.mock('@/lib/password', () => ({
  verifyPassword: (...args: unknown[]) => verifyPassword(...args),
  isLegacyHash: (...args: unknown[]) => isLegacyHash(...args),
  hashPassword: (...args: unknown[]) => hashPassword(...args),
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: (...args: unknown[]) => checkRateLimit(...args),
}));

import { POST as login } from '@/app/api/auth/login/route';
import { POST as logout } from '@/app/api/auth/logout/route';

function req(body: unknown, headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

function badJsonReq() {
  return {
    headers: { get: () => null },
    json: async () => {
      throw new Error('bad json');
    },
  } as unknown as Request;
}

const baseUser = {
  id: 'u1',
  email: 'user@test.com',
  name: 'Test User',
  passwordHash: '$2b$12$hashedpassword',
  subscriptionTier: 'free',
  isAdmin: false,
  emailVerified: false,
  profile: null,
};

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    process.env.TRUSTED_CLIENT_IP_HEADER = 'x-interview-lab-test-client-ip';
    findUnique.mockReset();
    update.mockReset();
    verifyPassword.mockReset();
    isLegacyHash.mockReset();
    hashPassword.mockReset();
    checkRateLimit.mockReset();
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 9 });
    isLegacyHash.mockReturnValue(false);
  });

  it('returns 400 when email is missing', async () => {
    const res = await login(req({ password: 'pass' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('Email and password are required');
  });

  it('returns 400 when password is missing', async () => {
    const res = await login(req({ email: 'test@test.com' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when both fields are missing', async () => {
    const res = await login(req({}));
    expect(res.status).toBe(400);
  });

  it('returns 500 when the request body cannot be parsed', async () => {
    const res = await login(badJsonReq());
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Login failed');
  });

  it('returns 401 for non-existent email', async () => {
    findUnique.mockResolvedValue(null);
    const res = await login(req({ email: 'noone@test.com', password: 'whatever' }));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Invalid email or password');
  });

  it('returns 401 for user without a passwordHash (e.g. oauth-only account)', async () => {
    findUnique.mockResolvedValue({ ...baseUser, passwordHash: null });
    const res = await login(req({ email: 'user@test.com', password: 'anything' }));
    expect(res.status).toBe(401);
    expect(verifyPassword).not.toHaveBeenCalled();
  });

  it('returns 401 for wrong password', async () => {
    findUnique.mockResolvedValue(baseUser);
    verifyPassword.mockResolvedValue(false);
    const res = await login(req({ email: 'user@test.com', password: 'wrong' }));
    expect(res.status).toBe(401);
  });

  it('calls verifyPassword with the raw password and stored hash', async () => {
    findUnique.mockResolvedValue(baseUser);
    verifyPassword.mockResolvedValue(true);
    await login(req({ email: 'user@test.com', password: 'correct-password' }));
    expect(verifyPassword).toHaveBeenCalledWith('correct-password', baseUser.passwordHash);
  });

  it('returns 200 with user data (and session cookie) on valid login', async () => {
    findUnique.mockResolvedValue({ ...baseUser, subscriptionTier: 'starter', emailVerified: true, profile: { id: 'p1' } });
    verifyPassword.mockResolvedValue(true);
    const res = await login(req({ email: 'user@test.com', password: 'correct-password' }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toMatchObject({
      id: 'u1', email: 'user@test.com', name: 'Test User',
      subscriptionTier: 'starter', isAdmin: false, emailVerified: true, profile: { id: 'p1' },
    });
    expect(res.headers.get('set-cookie')).toContain('interviewlab_session=');
  });

  it('does not leak passwordHash in the response', async () => {
    findUnique.mockResolvedValue(baseUser);
    verifyPassword.mockResolvedValue(true);
    const res = await login(req({ email: 'user@test.com', password: 'correct-password' }));
    expect(await res.json()).not.toHaveProperty('passwordHash');
  });

  it('creates a session cookie whose payload matches the user (sub/email/tier/isAdmin)', async () => {
    findUnique.mockResolvedValue({ ...baseUser, id: 'u3', email: 'admin@test.com', subscriptionTier: 'pro', isAdmin: true });
    verifyPassword.mockResolvedValue(true);
    const res = await login(req({ email: 'admin@test.com', password: 'correct-password' }));
    const setCookie = res.headers.get('set-cookie')!;
    const token = setCookie.match(/interviewlab_session=([^;]+)/)![1];
    const payload = await verifyToken(token);
    expect(payload).toMatchObject({ sub: 'u3', email: 'admin@test.com', tier: 'pro', isAdmin: true });
  });

  it('sanitizes email: trims whitespace and lowercases before the db lookup', async () => {
    findUnique.mockResolvedValue(baseUser);
    verifyPassword.mockResolvedValue(true);
    await login(req({ email: '  USER@TEST.COM  ', password: 'correct-password' }));
    expect(findUnique).toHaveBeenCalledWith({ where: { email: 'user@test.com' }, include: { profile: true } });
  });

  it('truncates email to 255 chars before lookup', async () => {
    findUnique.mockResolvedValue(null);
    const longEmail = 'a'.repeat(250) + '@test.com'; // 259 chars
    await login(req({ email: longEmail, password: 'x' }));
    const calledWith = findUnique.mock.calls[0][0].where.email as string;
    expect(calledWith.length).toBe(255);
  });

  it('auto-upgrades a legacy SHA-256 hash to bcrypt on successful login', async () => {
    findUnique.mockResolvedValue(baseUser);
    verifyPassword.mockResolvedValue(true);
    isLegacyHash.mockReturnValue(true);
    hashPassword.mockResolvedValue('$2b$12$newbcryptvalue');
    await login(req({ email: 'user@test.com', password: 'correct-password' }));
    expect(hashPassword).toHaveBeenCalledWith('correct-password');
    expect(update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { passwordHash: '$2b$12$newbcryptvalue' } });
  });

  it('does not attempt a hash upgrade for an already-bcrypt hash', async () => {
    findUnique.mockResolvedValue(baseUser);
    verifyPassword.mockResolvedValue(true);
    isLegacyHash.mockReturnValue(false);
    await login(req({ email: 'user@test.com', password: 'correct-password' }));
    expect(update).not.toHaveBeenCalled();
  });

  it('login still succeeds even if the legacy hash upgrade write fails', async () => {
    findUnique.mockResolvedValue(baseUser);
    verifyPassword.mockResolvedValue(true);
    isLegacyHash.mockReturnValue(true);
    hashPassword.mockResolvedValue('$2b$12$newvalue');
    update.mockRejectedValue(new Error('db write failed'));
    const res = await login(req({ email: 'user@test.com', password: 'correct-password' }));
    expect(res.status).toBe(200);
  });

  it('returns 429 when the persistent rate limiter denies the request', async () => {
    checkRateLimit.mockResolvedValue({ allowed: false, remaining: 0 });
    const res = await login(req({ email: 'x@x.com', password: 'p' }));
    expect(res.status).toBe(429);
    expect((await res.json()).error).toContain('Too many login attempts');
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('keys the rate limiter by the trusted proxy header and ignores x-forwarded-for', async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 9 });
    findUnique.mockResolvedValue(null);
    await login(req({ email: 'x@x.com', password: 'p' }, {
      'x-interview-lab-test-client-ip': '203.0.113.10',
      'x-forwarded-for': '1.2.3.4, 5.6.7.8',
    }));
    expect(checkRateLimit).toHaveBeenCalledWith('203.0.113.10', 'auth-login', expect.any(Number), expect.any(Number));
  });

  it('falls back to "unknown" rather than trusting x-real-ip', async () => {
    findUnique.mockResolvedValue(null);
    await login(req({ email: 'x@x.com', password: 'p' }, { 'x-real-ip': '10.0.0.1' }));
    expect(checkRateLimit).toHaveBeenCalledWith('unknown', 'auth-login', expect.any(Number), expect.any(Number));
  });
});

describe('POST /api/auth/logout', () => {
  it('returns 200 with success true and clears the session cookie', async () => {
    const res = await logout();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    const setCookie = res.headers.get('set-cookie')!;
    expect(setCookie).toContain('interviewlab_session=');
    expect(setCookie).toMatch(/Max-Age=0|Expires=/i);
  });

  it('is idempotent — safe to call repeatedly', async () => {
    const r1 = await logout();
    const r2 = await logout();
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
  });
});
