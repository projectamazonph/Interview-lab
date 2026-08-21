/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getUserFromRequest = vi.fn();
const guideCreate = vi.fn();
const guideUpdate = vi.fn();
const downloadCreate = vi.fn();

vi.mock('@/lib/auth-helpers', () => ({
  getUserFromRequest: (...args: unknown[]) => getUserFromRequest(...args),
}));

vi.mock('@/lib/db', () => ({
  db: {
    guide: {
      create: (...args: unknown[]) => guideCreate(...args),
      update: (...args: unknown[]) => guideUpdate(...args),
    },
    download: {
      create: (...args: unknown[]) => downloadCreate(...args),
    },
  },
}));

import { POST as createGuide } from '@/app/api/guides/route';
import { PUT as updateGuide } from '@/app/api/guides/[id]/route';
import { POST as createDownload } from '@/app/api/downloads/route';

function request(path: string, method: 'POST' | 'PUT', body: object, origin?: string): Request {
  const headers = new Headers({ 'content-type': 'application/json' });
  if (origin) headers.set('origin', origin);
  return new Request(`https://interview-lab.example${path}`, {
    method,
    headers,
    body: JSON.stringify(body),
  });
}

describe('admin content mutation origin protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = 'test';
    delete process.env.NEXT_PUBLIC_APP_URL;
    getUserFromRequest.mockResolvedValue({ id: 'admin-1', isAdmin: true });
  });

  it.each([
    ['guide creation', () => createGuide(request('/api/guides', 'POST', {
      title: 'Guide', slug: 'guide', content: 'Content',
    })), guideCreate],
    ['guide update', () => updateGuide(
      request('/api/guides/guide-1', 'PUT', { title: 'Updated' }),
      { params: Promise.resolve({ id: 'guide-1' }) },
    ), guideUpdate],
    ['download creation', () => createDownload(request('/api/downloads', 'POST', {
      title: 'Template',
    })), downloadCreate],
  ] as const)('rejects %s without an Origin before writing', async (_label, invoke, write) => {
    const response = await invoke();

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'Forbidden — untrusted request origin' });
    expect(write).not.toHaveBeenCalled();
  });

  it('allows same-origin guide creation', async () => {
    guideCreate.mockResolvedValue({ id: 'guide-1', title: 'Guide' });

    const response = await createGuide(request('/api/guides', 'POST', {
      title: 'Guide', slug: 'guide', content: 'Content',
    }, 'https://interview-lab.example'));

    expect(response.status).toBe(201);
    expect(guideCreate).toHaveBeenCalledOnce();
  });
});
