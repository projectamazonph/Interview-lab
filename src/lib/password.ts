/**
 * Password hashing utilities using bcryptjs.
 * Replaces the previous SHA-256 approach with proper salting and adaptive cost.
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
 * Also supports legacy SHA-256 hashes for backwards compatibility
 * during the migration window (auto-upgrades on next login).
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Modern bcrypt hashes start with $2a$, $2b$, or $2y$
  if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
    return bcrypt.compare(password, hash);
  }

  // Legacy SHA-256 fallback — compute the old-style hash for comparison
  const legacyHash = await sha256Legacy(password);
  if (legacyHash === hash) {
    return true;
  }
  return false;
}

/**
 * Check if a hash is legacy SHA-256 (needs upgrade).
 */
export function isLegacyHash(hash: string): boolean {
  return !hash.startsWith('$2a$') && !hash.startsWith('$2b$') && !hash.startsWith('$2y$');
}

/**
 * Legacy SHA-256 hash — kept only for migrating existing users.
 */
async function sha256Legacy(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}
