/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const userUpdate = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      update: (...args: unknown[]) => userUpdate(...args),
    },
  },
}));

import { revokeAllUserSessions } from '@/lib/session-revocation';

describe('revokeAllUserSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userUpdate.mockResolvedValue({ id: 'user-123456', sessionVersion: 3 });
  });

  it('atomically increments the user session version', async () => {
    await revokeAllUserSessions('user-123456');

    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: 'user-123456' },
      data: { sessionVersion: { increment: 1 } },
      select: { id: true },
    });
  });
});
