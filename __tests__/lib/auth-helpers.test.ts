/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const verifyToken = vi.fn();
const userFindUnique = vi.fn();

vi.mock('@/lib/session', () => ({
  TOKEN_NAME: 'interviewlab_session',
  verifyToken: (...args: unknown[]) => verifyToken(...args),
}));

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: (...args: unknown[]) => userFindUnique(...args),
    },
  },
}));

import { getUserFromRequest } from '@/lib/auth-helpers';

function requestWithSession(): NextRequest {
  return new NextRequest('http://localhost/api/profile', {
    headers: { cookie: 'interviewlab_session=signed-token' },
  });
}

const databaseUser = {
  id: 'user-123456',
  email: 'user@example.com',
  name: 'Test User',
  subscriptionTier: 'free',
  isAdmin: false,
  emailVerified: true,
  sessionVersion: 2,
};

describe('getUserFromRequest session revocation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifyToken.mockResolvedValue({
      sub: databaseUser.id,
      email: databaseUser.email,
      tier: 'free',
      isAdmin: false,
      sessionVersion: 2,
    });
    userFindUnique.mockResolvedValue(databaseUser);
  });

  it('returns the current database user when the session version matches', async () => {
    await expect(getUserFromRequest(requestWithSession())).resolves.toMatchObject({
      id: databaseUser.id,
      isAdmin: false,
    });
  });

  it('rejects a previously valid token after the database session version changes', async () => {
    userFindUnique.mockResolvedValue({ ...databaseUser, sessionVersion: 3 });

    await expect(getUserFromRequest(requestWithSession())).resolves.toBeNull();
  });
});
