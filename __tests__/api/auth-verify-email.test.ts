/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const userUpdate = vi.fn();
const validateVerificationToken = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      update: (...args: unknown[]) => userUpdate(...args),
    },
  },
}));

vi.mock('@/lib/email-verification', () => ({
  validateVerificationToken: (...args: unknown[]) => validateVerificationToken(...args),
}));

import { GET } from '@/app/api/auth/verify-email/route';
import { NextRequest } from 'next/server';

function req(query: string) {
  return new NextRequest(`http://localhost/api/auth/verify-email${query}`);
}

describe('GET /api/auth/verify-email', () => {
  beforeEach(() => {
    userUpdate.mockReset();
    validateVerificationToken.mockReset();
  });

  it('redirects with missing-token when no token is provided', async () => {
    const res = await GET(req(''));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/?verified=missing-token');
  });

  it('redirects with invalid when the token cannot be validated', async () => {
    validateVerificationToken.mockResolvedValue(null);
    const res = await GET(req('?token=bad-token'));
    expect(res.headers.get('location')).toContain('/?verified=invalid');
  });

  it('marks the user as verified and redirects with success for a valid token', async () => {
    validateVerificationToken.mockResolvedValue('demo@interviewlab.com');
    userUpdate.mockResolvedValue({ id: 'u1', email: 'demo@interviewlab.com' });

    const res = await GET(req('?token=good-token'));

    expect(userUpdate).toHaveBeenCalledWith({
      where: { email: 'demo@interviewlab.com' },
      data: { emailVerified: true },
    });
    expect(res.headers.get('location')).toContain('/?verified=success');
  });

  it('redirects with error when the database update fails', async () => {
    validateVerificationToken.mockResolvedValue('demo@interviewlab.com');
    userUpdate.mockRejectedValue(new Error('db down'));

    const res = await GET(req('?token=good-token'));

    expect(res.headers.get('location')).toContain('/?verified=error');
  });
});
