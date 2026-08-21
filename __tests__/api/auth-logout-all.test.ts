/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getUserFromRequest = vi.fn();
const revokeAllUserSessions = vi.fn();

vi.mock('@/lib/auth-helpers', () => ({
  getUserFromRequest: (...args: unknown[]) => getUserFromRequest(...args),
}));

vi.mock('@/lib/session-revocation', () => ({
  revokeAllUserSessions: (...args: unknown[]) => revokeAllUserSessions(...args),
}));

import { POST } from '@/app/api/auth/logout-all/route';

function request(): Request {
  return new Request('http://localhost/api/auth/logout-all', { method: 'POST' });
}

describe('POST /api/auth/logout-all', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    revokeAllUserSessions.mockResolvedValue(undefined);
  });

  it('rejects an unauthenticated request without changing session state', async () => {
    getUserFromRequest.mockResolvedValue(null);

    const response = await POST(request());

    expect(response.status).toBe(401);
    expect(revokeAllUserSessions).not.toHaveBeenCalled();
  });

  it('revokes every user session and clears the current cookie', async () => {
    getUserFromRequest.mockResolvedValue({ id: 'user-123456' });

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(revokeAllUserSessions).toHaveBeenCalledWith('user-123456');
    expect(response.headers.get('set-cookie')).toContain('interviewlab_session=');
    expect(response.headers.get('set-cookie')).toMatch(/Max-Age=0/i);
  });

  it('returns a generic error without clearing the cookie when revocation fails', async () => {
    getUserFromRequest.mockResolvedValue({ id: 'user-123456' });
    revokeAllUserSessions.mockRejectedValue(new Error('database unavailable'));

    const response = await POST(request());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Failed to revoke sessions' });
    expect(response.headers.get('set-cookie')).toBeNull();
  });
});
