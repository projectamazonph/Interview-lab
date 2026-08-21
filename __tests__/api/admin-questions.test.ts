/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getUserFromRequest = vi.fn();
const questionCreate = vi.fn();
const questionUpdate = vi.fn();

vi.mock('@/lib/auth-helpers', () => ({
  getUserFromRequest: (...args: unknown[]) => getUserFromRequest(...args),
}));

vi.mock('@/lib/db', () => ({
  db: {
    question: {
      create: (...args: unknown[]) => questionCreate(...args),
      update: (...args: unknown[]) => questionUpdate(...args),
    },
  },
}));

import { POST, PUT } from '@/app/api/admin/questions/route';

function mutationRequest(method: 'POST' | 'PUT', body: object, origin?: string): Request {
  const headers = new Headers({ 'content-type': 'application/json' });
  if (origin) {
    headers.set('origin', origin);
    headers.set('sec-fetch-site', 'same-origin');
  }

  return new Request('https://interview-lab.example/api/admin/questions', {
    method,
    headers,
    body: JSON.stringify(body),
  });
}

describe('admin question mutation origin protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = 'test';
    delete process.env.NEXT_PUBLIC_APP_URL;
    getUserFromRequest.mockResolvedValue({ id: 'admin-1', isAdmin: true });
  });

  it.each([
    ['POST', POST, { question: 'How do you optimize bids?' }, questionCreate],
    ['PUT', PUT, { id: 'question-1', status: 'published' }, questionUpdate],
  ] as const)('rejects %s requests without an Origin before writing', async (
    method,
    handler,
    body,
    write,
  ) => {
    const response = await handler(mutationRequest(method, body));

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'Forbidden — untrusted request origin' });
    expect(write).not.toHaveBeenCalled();
  });

  it('allows a same-origin admin to create a question', async () => {
    questionCreate.mockResolvedValue({ id: 'question-1', question: 'How do you optimize bids?' });

    const response = await POST(mutationRequest(
      'POST',
      { question: 'How do you optimize bids?' },
      'https://interview-lab.example',
    ));

    expect(response.status).toBe(201);
    expect(questionCreate).toHaveBeenCalledOnce();
  });
});
