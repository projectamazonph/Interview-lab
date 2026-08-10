/**
 * @vitest-environment node
 *
 * Exercises the real POST /api/auth/register handler with mocked db/password
 * so bot protection, sanitization, validation, the user cap, and session
 * creation are verified against the shipped route code.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyToken } from '@/lib/session';

const findUnique = vi.fn();
const create = vi.fn();
const count = vi.fn();
const appSettingFindUnique = vi.fn();
const hashPassword = vi.fn();
const createVerificationToken = vi.fn();
const checkRateLimit = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: (...args: unknown[]) => findUnique(...args),
      create: (...args: unknown[]) => create(...args),
      count: (...args: unknown[]) => count(...args),
    },
    appSetting: {
      findUnique: (...args: unknown[]) => appSettingFindUnique(...args),
    },
  },
}));

vi.mock('@/lib/password', () => ({
  hashPassword: (...args: unknown[]) => hashPassword(...args),
}));

vi.mock('@/lib/email-verification', () => ({
  createVerificationToken: (...args: unknown[]) => createVerificationToken(...args),
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: (...args: unknown[]) => checkRateLimit(...args),
}));

import { POST as register } from '@/app/api/auth/register/route';

function req(body: unknown) {
  return new Request('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

let nextId = 0;

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    delete process.env.MAX_USERS;
    nextId = 0;
    findUnique.mockReset();
    create.mockReset();
    count.mockReset();
    appSettingFindUnique.mockReset();
    hashPassword.mockReset();
    createVerificationToken.mockReset();
    checkRateLimit.mockReset();

    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 });
    appSettingFindUnique.mockResolvedValue(null); // no max_users cap by default
    findUnique.mockResolvedValue(null); // no existing user by default
    hashPassword.mockImplementation(async (pw: string) => `hashed:${pw}`);
    createVerificationToken.mockResolvedValue('verify-token');
    create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: `uid_${++nextId}`,
      email: data.email,
      name: data.name,
      passwordHash: data.passwordHash,
      subscriptionTier: 'free',
      isAdmin: false,
      emailVerified: false,
    }));
  });

  describe('bot protection', () => {
    it('returns a fake 201 for a filled honeypot field, without touching the db', async () => {
      const res = await register(req({ email: 'bot@evil.com', password: 'password123', honeypot: 'filled' }));
      expect(res.status).toBe(201);
      expect((await res.json()).email).toBe('trap@trap.com');
      expect(create).not.toHaveBeenCalled();
    });

    it('returns a fake 201 for a submission faster than 2 seconds', async () => {
      const res = await register(req({ email: 'fast@evil.com', password: 'password123', _formStart: Date.now() - 500 }));
      expect(res.status).toBe(201);
      expect((await res.json()).email).toBe('trap@trap.com');
      expect(create).not.toHaveBeenCalled();
    });

    it('registers normally when the form was open long enough', async () => {
      const res = await register(req({ email: 'test@example.com', password: 'password123', _formStart: Date.now() - 3000 }));
      expect(res.status).toBe(201);
      expect((await res.json()).email).toBe('test@example.com');
    });
  });

  describe('required fields', () => {
    it('rejects missing email with 400', async () => {
      const res = await register(req({ password: 'password123' }));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toContain('required');
    });

    it('rejects missing password with 400', async () => {
      const res = await register(req({ email: 'test@example.com' }));
      expect(res.status).toBe(400);
    });
  });

  describe('email validation', () => {
    it('rejects email without @', async () => {
      const res = await register(req({ email: 'notanemail', password: 'password123' }));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toContain('Invalid email');
    });

    it('rejects email without a domain', async () => {
      const res = await register(req({ email: 'test@', password: 'password123' }));
      expect(res.status).toBe(400);
    });

    it('accepts a valid email and lowercases it', async () => {
      const res = await register(req({ email: 'Test@Example.COM', password: 'password123' }));
      expect(res.status).toBe(201);
      expect((await res.json()).email).toBe('test@example.com');
    });

    it('trims whitespace from email before validation/storage', async () => {
      const res = await register(req({ email: '  test@example.com  ', password: 'password123' }));
      expect(res.status).toBe(201);
      expect((await res.json()).email).toBe('test@example.com');
    });

    it('truncates email at 255 chars', async () => {
      const longEmail = 'a'.repeat(240) + '@test.example.com';
      await register(req({ email: longEmail, password: 'password123' }));
      const storedEmail = create.mock.calls[0][0].data.email as string;
      expect(storedEmail.length).toBeLessThanOrEqual(255);
    });
  });

  describe('password validation', () => {
    it('rejects a 7-character password', async () => {
      const res = await register(req({ email: 'test@example.com', password: 'passwor' }));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toContain('8 characters');
    });

    it('accepts an 8-character password', async () => {
      const res = await register(req({ email: 'test@example.com', password: 'password' }));
      expect(res.status).toBe(201);
    });

    it('hashes the password via hashPassword before storing', async () => {
      await register(req({ email: 'test@example.com', password: 'password123' }));
      expect(hashPassword).toHaveBeenCalledWith('password123');
      expect(create.mock.calls[0][0].data.passwordHash).toBe('hashed:password123');
    });
  });

  describe('duplicate email', () => {
    it('rejects duplicate email with 409 and does not create/hash', async () => {
      findUnique.mockResolvedValue({ id: 'existing', email: 'taken@example.com' });
      const res = await register(req({ email: 'taken@example.com', password: 'password123' }));
      expect(res.status).toBe(409);
      expect((await res.json()).error).toContain('already registered');
      expect(create).not.toHaveBeenCalled();
    });
  });

  describe('name sanitization', () => {
    it('uses the email prefix when name is missing', async () => {
      const res = await register(req({ email: 'johnny@example.com', password: 'password123' }));
      expect((await res.json()).name).toBe('johnny');
    });

    it('strips HTML tags and special characters from name', async () => {
      const res = await register(req({ email: 'test@example.com', name: '<b>Bold</b> John<>"&', password: 'password123' }));
      const body = await res.json();
      expect(body.name).not.toContain('<');
      expect(body.name).toBe('Bold John');
    });

    it('truncates name at 100 chars', async () => {
      const res = await register(req({ email: 'test@example.com', name: 'A'.repeat(150), password: 'password123' }));
      expect((await res.json()).name.length).toBe(100);
    });
  });

  describe('user cap', () => {
    it('returns 503 when the DB-configured user cap is reached', async () => {
      appSettingFindUnique.mockResolvedValue({ key: 'max_users', value: '5' });
      count.mockResolvedValue(5);
      const res = await register(req({ email: 'second@example.com', password: 'password123' }));
      expect(res.status).toBe(503);
      expect((await res.json()).error).toContain('closed');
      expect(create).not.toHaveBeenCalled();
    });

    it('allows registration when the cap is not yet reached', async () => {
      appSettingFindUnique.mockResolvedValue({ key: 'max_users', value: '5' });
      count.mockResolvedValue(4);
      const res = await register(req({ email: 'user@example.com', password: 'password123' }));
      expect(res.status).toBe(201);
    });

    it('MAX_USERS env var takes precedence over the DB setting', async () => {
      process.env.MAX_USERS = '1';
      count.mockResolvedValue(1);
      const res = await register(req({ email: 'user@example.com', password: 'password123' }));
      expect(res.status).toBe(503);
      expect(appSettingFindUnique).not.toHaveBeenCalled();
    });
  });

  describe('successful registration', () => {
    it('returns 201 with user data, a session cookie, and no passwordHash', async () => {
      const res = await register(req({ email: 'newuser@example.com', name: 'New User', password: 'password123' }));
      const body = await res.json();
      expect(res.status).toBe(201);
      expect(body).toMatchObject({ email: 'newuser@example.com', name: 'New User', subscriptionTier: 'free', isAdmin: false, emailVerified: false });
      expect(body).not.toHaveProperty('passwordHash');
      expect(res.headers.get('set-cookie')).toContain('interviewlab_session=');
    });

    it('issues a session cookie whose payload matches the new user', async () => {
      const res = await register(req({ email: 'newuser@example.com', password: 'password123' }));
      const token = res.headers.get('set-cookie')!.match(/interviewlab_session=([^;]+)/)![1];
      const payload = await verifyToken(token);
      expect(payload).toMatchObject({ email: 'newuser@example.com', tier: 'free', isAdmin: false });
    });

    it('creates a profile row alongside the user', async () => {
      await register(req({ email: 'newuser@example.com', password: 'password123' }));
      expect(create.mock.calls[0][0].data.profile).toEqual({ create: {} });
    });

    it('creates an email verification token for the sanitized email', async () => {
      await register(req({ email: '  NewUser@Example.com  ', password: 'password123' }));
      expect(createVerificationToken).toHaveBeenCalledWith('newuser@example.com');
    });
  });

  it('returns 429 when the persistent rate limiter denies the request', async () => {
    checkRateLimit.mockResolvedValue({ allowed: false, remaining: 0 });
    const res = await register(req({ email: 'x@x.com', password: 'password123' }));
    expect(res.status).toBe(429);
    expect(create).not.toHaveBeenCalled();
  });

  it('returns 500 when the database throws unexpectedly', async () => {
    create.mockRejectedValue(new Error('db down'));
    const res = await register(req({ email: 'test@example.com', password: 'password123' }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Registration failed');
  });
});
