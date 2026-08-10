/**
 * @vitest-environment node
 *
 * Covers src/lib/email-verification.ts — token creation, validation
 * (including expiry), and pending-verification lookups.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const deleteMany = vi.fn();
const create = vi.fn();
const findUnique = vi.fn();
const deleteOne = vi.fn();
const count = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    verificationToken: {
      deleteMany: (...args: unknown[]) => deleteMany(...args),
      create: (...args: unknown[]) => create(...args),
      findUnique: (...args: unknown[]) => findUnique(...args),
      delete: (...args: unknown[]) => deleteOne(...args),
      count: (...args: unknown[]) => count(...args),
    },
  },
}));

import { createVerificationToken, validateVerificationToken, hasPendingVerification } from '@/lib/email-verification';

describe('createVerificationToken', () => {
  beforeEach(() => {
    deleteMany.mockReset();
    create.mockReset();
    deleteMany.mockResolvedValue({});
    create.mockResolvedValue({});
  });

  it('clears any existing tokens for the email before creating a new one', async () => {
    await createVerificationToken('user@test.com');
    expect(deleteMany).toHaveBeenCalledWith({ where: { email: 'user@test.com' } });
    expect(deleteMany.mock.invocationCallOrder[0]).toBeLessThan(create.mock.invocationCallOrder[0]);
  });

  it('generates a 64-character hex token and stores it with a 24h expiry', async () => {
    const before = Date.now();
    const token = await createVerificationToken('user@test.com');
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    const callArgs = create.mock.calls[0][0].data;
    expect(callArgs.token).toBe(token);
    expect(callArgs.email).toBe('user@test.com');
    const expiresAt = (callArgs.expiresAt as Date).getTime();
    expect(expiresAt).toBeGreaterThan(before + 23 * 60 * 60 * 1000);
    expect(expiresAt).toBeLessThan(before + 25 * 60 * 60 * 1000);
  });

  it('does not throw if there were no prior tokens to delete', async () => {
    deleteMany.mockRejectedValue(new Error('nothing to delete'));
    await expect(createVerificationToken('user@test.com')).resolves.toBeDefined();
  });

  it('generates distinct tokens across calls', async () => {
    const t1 = await createVerificationToken('a@test.com');
    const t2 = await createVerificationToken('b@test.com');
    expect(t1).not.toBe(t2);
  });
});

describe('validateVerificationToken', () => {
  beforeEach(() => {
    findUnique.mockReset();
    deleteOne.mockReset();
  });

  it('returns null when the token does not exist', async () => {
    findUnique.mockResolvedValue(null);
    const result = await validateVerificationToken('missing-token');
    expect(result).toBeNull();
    expect(deleteOne).not.toHaveBeenCalled();
  });

  it('returns null and deletes the row when the token has expired', async () => {
    findUnique.mockResolvedValue({ token: 't1', email: 'user@test.com', expiresAt: new Date(Date.now() - 1000) });
    deleteOne.mockResolvedValue({});
    const result = await validateVerificationToken('t1');
    expect(result).toBeNull();
    expect(deleteOne).toHaveBeenCalledWith({ where: { token: 't1' } });
  });

  it('returns the email and consumes (deletes) a valid, unexpired token', async () => {
    findUnique.mockResolvedValue({ token: 't1', email: 'user@test.com', expiresAt: new Date(Date.now() + 60_000) });
    deleteOne.mockResolvedValue({});
    const result = await validateVerificationToken('t1');
    expect(result).toBe('user@test.com');
    expect(deleteOne).toHaveBeenCalledWith({ where: { token: 't1' } });
  });

  it('returns null (fails closed) when the db throws', async () => {
    findUnique.mockRejectedValue(new Error('db down'));
    const result = await validateVerificationToken('t1');
    expect(result).toBeNull();
  });
});

describe('hasPendingVerification', () => {
  beforeEach(() => {
    count.mockReset();
  });

  it('returns true when an unexpired token exists for the email', async () => {
    count.mockResolvedValue(1);
    await expect(hasPendingVerification('user@test.com')).resolves.toBe(true);
    expect(count).toHaveBeenCalledWith({ where: { email: 'user@test.com', expiresAt: { gt: expect.any(Date) } } });
  });

  it('returns false when no unexpired token exists', async () => {
    count.mockResolvedValue(0);
    await expect(hasPendingVerification('user@test.com')).resolves.toBe(false);
  });

  it('returns false (fails closed) when the db throws', async () => {
    count.mockRejectedValue(new Error('db down'));
    await expect(hasPendingVerification('user@test.com')).resolves.toBe(false);
  });
});
