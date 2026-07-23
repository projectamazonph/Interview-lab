/**
 * Password hashing utilities using bcryptjs.
 */

import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Hash a plaintext password with bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a plaintext password against a bcrypt hash.
 * Returns false for any non-bcrypt hash — callers should check
 * `isLegacyHash` first and require a password reset instead of calling this.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!hash.startsWith('$2a$') && !hash.startsWith('$2b$') && !hash.startsWith('$2y$')) {
    return false;
  }
  return bcrypt.compare(password, hash);
}

/**
 * Check if a hash predates the bcrypt migration (unsalted SHA-256).
 * Accounts with a legacy hash cannot authenticate with a password and must
 * go through /api/auth/reset-password.
 */
export function isLegacyHash(hash: string): boolean {
  return !hash.startsWith('$2a$') && !hash.startsWith('$2b$') && !hash.startsWith('$2y$');
}
