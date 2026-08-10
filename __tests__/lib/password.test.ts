/**
 * @vitest-environment node
 *
 * Covers src/lib/password.ts directly, including the legacy SHA-256 ->
 * bcrypt migration path, which was previously only reachable through the
 * gated live-server integration tests.
 */
import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, isLegacyHash } from '@/lib/password';

describe('hashPassword / verifyPassword (bcrypt)', () => {
  it('hashes a password into a bcrypt-format hash', async () => {
    const hash = await hashPassword('correct-horse-battery-staple');
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it('verifies a correct password against its bcrypt hash', async () => {
    const hash = await hashPassword('my-secret-password');
    await expect(verifyPassword('my-secret-password', hash)).resolves.toBe(true);
  });

  it('rejects an incorrect password against a bcrypt hash', async () => {
    const hash = await hashPassword('my-secret-password');
    await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false);
  });

  it('produces a different hash each time (random salt)', async () => {
    const [a, b] = await Promise.all([hashPassword('same-password'), hashPassword('same-password')]);
    expect(a).not.toBe(b);
  });
});

describe('isLegacyHash', () => {
  it('returns false for bcrypt hashes ($2a$/$2b$/$2y$)', () => {
    expect(isLegacyHash('$2a$12$abcdefghijklmnopqrstuv')).toBe(false);
    expect(isLegacyHash('$2b$12$abcdefghijklmnopqrstuv')).toBe(false);
    expect(isLegacyHash('$2y$12$abcdefghijklmnopqrstuv')).toBe(false);
  });

  it('returns true for a legacy SHA-256 hex hash', () => {
    expect(isLegacyHash('a'.repeat(64))).toBe(true);
  });
});

describe('verifyPassword — legacy SHA-256 fallback', () => {
  it('accepts a password whose legacy SHA-256 digest matches the stored hash', async () => {
    // Compute the same legacy digest the module falls back to, using the
    // real Web Crypto API (available in the node test environment).
    const encoder = new TextEncoder();
    const digest = await crypto.subtle.digest('SHA-256', encoder.encode('legacy-password'));
    const legacyHash = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');

    await expect(verifyPassword('legacy-password', legacyHash)).resolves.toBe(true);
  });

  it('rejects a wrong password against a legacy SHA-256 hash', async () => {
    const encoder = new TextEncoder();
    const digest = await crypto.subtle.digest('SHA-256', encoder.encode('legacy-password'));
    const legacyHash = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');

    await expect(verifyPassword('wrong-password', legacyHash)).resolves.toBe(false);
  });
});
