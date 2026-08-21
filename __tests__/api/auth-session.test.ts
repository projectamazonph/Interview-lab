/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const getUserFromRequest = vi.fn();
const verifySession = vi.fn();
const userFindUnique = vi.fn();

vi.mock('@/lib/auth-helpers', () => ({
  getUserFromRequest: (...args: unknown[]) => getUserFromRequest(...args),
}));

vi.mock('@/lib/session', () => ({
  verifySession: (...args: unknown[]) => verifySession(...args),
}));

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: (...args: unknown[]) => userFindUnique(...args),
    },
  },
}));

import { GET } from '@/app/api/auth/session/route';

function request(): NextRequest {
  return new NextRequest('http://localhost/api/auth/session', {
    headers: { cookie: 'interviewlab_session=signed-token' },
  });
}

describe('GET /api/auth/session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the current revocation-aware database user', async () => {
    getUserFromRequest.mockResolvedValue({
      id: 'user-123456',
      email: 'user@example.com',
      name: 'Test User',
      subscriptionTier: 'free',
      isAdmin: true,
      emailVerified: true,
    });

    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      user: { id: 'user-123456', isAdmin: true },
    });
  });

  it('returns no user when the centralized auth boundary rejects a revoked token', async () => {
    getUserFromRequest.mockResolvedValue(null);
    verifySession.mockResolvedValue({ sub: 'user-123456', sessionVersion: 1 });
    userFindUnique.mockResolvedValue({
      id: 'user-123456',
      email: 'user@example.com',
      isAdmin: true,
      sessionVersion: 2,
    });

    const response = await GET(request());

    expect(await response.json()).toEqual({ user: null });
    expect(userFindUnique).not.toHaveBeenCalled();
  });
});
