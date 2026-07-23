import { db } from './db';

const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;
const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // password reset tokens expire sooner

export type TokenPurpose = 'email_verification' | 'password_reset';

export async function createVerificationToken(
  email: string,
  purpose: TokenPurpose = 'email_verification',
): Promise<string> {
  const token = cryptoRandomHex(32);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + (purpose === 'password_reset' ? RESET_TOKEN_EXPIRY_MS : TOKEN_EXPIRY_MS));

  // Clean up old tokens for this email + purpose first — scoped so
  // requesting a password reset doesn't invalidate a pending verification
  // email, or vice versa.
  await db.verificationToken.deleteMany({ where: { email, purpose } }).catch(() => {});

  await db.verificationToken.create({
    data: { token, email, purpose, expiresAt },
  });

  return token;
}

export async function validateVerificationToken(
  token: string,
  purpose: TokenPurpose = 'email_verification',
): Promise<string | null> {
  try {
    const entry = await db.verificationToken.findUnique({ where: { token } });
    if (!entry || entry.purpose !== purpose) return null;
    if (new Date() > entry.expiresAt) {
      await db.verificationToken.delete({ where: { token } });
      return null;
    }
    await db.verificationToken.delete({ where: { token } });
    return entry.email;
  } catch {
    return null;
  }
}

export async function hasPendingVerification(
  email: string,
  purpose: TokenPurpose = 'email_verification',
): Promise<boolean> {
  try {
    const count = await db.verificationToken.count({
      where: { email, purpose, expiresAt: { gt: new Date() } },
    });
    return count > 0;
  } catch {
    return false;
  }
}

function cryptoRandomHex(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
