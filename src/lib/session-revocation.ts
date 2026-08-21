import { db } from '@/lib/db';

/** Revoke every issued session for one user. */
export async function revokeAllUserSessions(userId: string): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: { sessionVersion: { increment: 1 } },
    select: { id: true },
  });
}
