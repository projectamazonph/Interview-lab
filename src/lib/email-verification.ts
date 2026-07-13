import { db } from './db';

const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

export function createVerificationToken(email: string): string {
  const token = cryptoRandomHex(32);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TOKEN_EXPIRY_MS);

  db.verificationToken.deleteMany({ where: { email } }).catch(() => {});
  db.verificationToken.create({
    data: { token, email, expiresAt },
  }).catch(() => {});

  return token;
}

export async function validateVerificationToken(token: string): Promise<string | null> {
  try {
    const entry = await db.verificationToken.findUnique({ where: { token } });
    if (!entry) return null;
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

export async function hasPendingVerification(email: string): Promise<boolean> {
  try {
    const count = await db.verificationToken.count({
      where: { email, expiresAt: { gt: new Date() } },
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
