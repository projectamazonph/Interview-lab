/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getUserFromRequest = vi.fn();
const verifyPassword = vi.fn();
const userFindUnique = vi.fn();
const userDelete = vi.fn();
const profileFindUnique = vi.fn();
const sessionFindMany = vi.fn();
const resumeFindMany = vi.fn();
const coverLetterFindMany = vi.fn();
const guideProgressFindMany = vi.fn();
const agentRunFindMany = vi.fn();
const subscriptionFindUnique = vi.fn();
const paymentFindMany = vi.fn();
const verificationTokenFindMany = vi.fn();
const verificationTokenDeleteMany = vi.fn();
const rateLimitEntryFindMany = vi.fn();
const rateLimitEntryDeleteMany = vi.fn();
const transaction = vi.fn((operations: Promise<unknown>[]) => Promise.all(operations));

vi.mock('@/lib/auth-helpers', () => ({
  getUserFromRequest: (...args: unknown[]) => getUserFromRequest(...args),
}));

vi.mock('@/lib/password', () => ({
  verifyPassword: (...args: unknown[]) => verifyPassword(...args),
}));

vi.mock('@/lib/db', () => ({
  db: {
    $transaction: (...args: unknown[]) => transaction(...args),
    user: {
      findUnique: (...args: unknown[]) => userFindUnique(...args),
      delete: (...args: unknown[]) => userDelete(...args),
    },
    userProfile: { findUnique: (...args: unknown[]) => profileFindUnique(...args) },
    interviewSession: { findMany: (...args: unknown[]) => sessionFindMany(...args) },
    resume: { findMany: (...args: unknown[]) => resumeFindMany(...args) },
    coverLetter: { findMany: (...args: unknown[]) => coverLetterFindMany(...args) },
    guideProgress: { findMany: (...args: unknown[]) => guideProgressFindMany(...args) },
    agentRun: { findMany: (...args: unknown[]) => agentRunFindMany(...args) },
    subscription: { findUnique: (...args: unknown[]) => subscriptionFindUnique(...args) },
    payment: { findMany: (...args: unknown[]) => paymentFindMany(...args) },
    verificationToken: {
      findMany: (...args: unknown[]) => verificationTokenFindMany(...args),
      deleteMany: (...args: unknown[]) => verificationTokenDeleteMany(...args),
    },
    rateLimitEntry: {
      findMany: (...args: unknown[]) => rateLimitEntryFindMany(...args),
      deleteMany: (...args: unknown[]) => rateLimitEntryDeleteMany(...args),
    },
  },
}));

import { GET as exportAccount } from '@/app/api/user/me/export/route';
import { DELETE as deleteAccount } from '@/app/api/user/me/route';

const authenticatedUser = { id: 'u1', email: 'user@test.com' };

function deleteRequest(confirmPassword = 'correct-password') {
  return new Request('http://localhost/api/user/me', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ confirmPassword }),
  });
}

describe('account controls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserFromRequest.mockResolvedValue(authenticatedUser);
    userFindUnique.mockResolvedValue({
      ...authenticatedUser,
      name: 'Test User',
      passwordHash: 'hashed-password',
      subscriptionTier: 'starter',
      isAdmin: false,
      emailVerified: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    });
    profileFindUnique.mockResolvedValue(null);
    sessionFindMany.mockResolvedValue([]);
    resumeFindMany.mockResolvedValue([]);
    coverLetterFindMany.mockResolvedValue([]);
    guideProgressFindMany.mockResolvedValue([]);
    agentRunFindMany.mockResolvedValue([{ id: 'run-1' }]);
    subscriptionFindUnique.mockResolvedValue({ id: 'sub-1', tier: 'starter' });
    paymentFindMany.mockResolvedValue([{ id: 'pay-1', amount: 9900 }]);
    verificationTokenFindMany.mockResolvedValue([{ id: 'verify-1', email: authenticatedUser.email }]);
    rateLimitEntryFindMany.mockResolvedValue([{ id: 'rate-1', key: `ai-cover-letter:${authenticatedUser.id}` }]);
    verificationTokenDeleteMany.mockResolvedValue({ count: 1 });
    rateLimitEntryDeleteMany.mockResolvedValue({ count: 1 });
    userDelete.mockResolvedValue(authenticatedUser);
    verifyPassword.mockResolvedValue(true);
  });

  it('exports every user-owned data category without password hashes or token secrets', async () => {
    userFindUnique.mockResolvedValueOnce({
      id: authenticatedUser.id,
      email: authenticatedUser.email,
      name: 'Test User',
      subscriptionTier: 'starter',
      isAdmin: false,
      emailVerified: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    });
    const response = await exportAccount(new Request('http://localhost/api/user/me/export'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      agentRuns: [{ id: 'run-1' }],
      subscription: { id: 'sub-1', tier: 'starter' },
      payments: [{ id: 'pay-1', amount: 9900 }],
      verificationTokens: [{ id: 'verify-1', email: authenticatedUser.email }],
      rateLimitEntries: [{ id: 'rate-1', key: `ai-cover-letter:${authenticatedUser.id}` }],
    });
    expect(body.user).not.toHaveProperty('passwordHash');
    expect(body.verificationTokens[0]).not.toHaveProperty('token');
    expect(userFindUnique).toHaveBeenCalledWith(expect.objectContaining({
      select: expect.not.objectContaining({ passwordHash: true }),
    }));
    expect(verificationTokenFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { email: authenticatedUser.email },
      select: expect.not.objectContaining({ token: true }),
    }));
    expect(rateLimitEntryFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { key: { endsWith: `:${authenticatedUser.id}` } },
    }));
  });

  it('deletes non-relational user records atomically and clears the real session cookie', async () => {
    const response = await deleteAccount(deleteRequest());

    expect(response.status).toBe(200);
    expect(verificationTokenDeleteMany).toHaveBeenCalledWith({
      where: { email: authenticatedUser.email },
    });
    expect(rateLimitEntryDeleteMany).toHaveBeenCalledWith({
      where: { key: { endsWith: `:${authenticatedUser.id}` } },
    });
    expect(userDelete).toHaveBeenCalledWith({ where: { id: authenticatedUser.id } });
    expect(transaction).toHaveBeenCalledOnce();

    const setCookie = response.headers.get('set-cookie');
    expect(setCookie).toContain('interviewlab_session=');
    expect(setCookie).toMatch(/Max-Age=0/i);
  });
});
