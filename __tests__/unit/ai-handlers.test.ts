import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the auth helper so we control whether a user is present.
const getUserFromRequest = vi.fn();
vi.mock('@/lib/auth-helpers', () => ({
  getUserFromRequest: (request: Request) => getUserFromRequest(request),
}));

// Mock the model call so we never hit the real SDK.
const completeJson = vi.fn();
vi.mock('@/lib/ai/client', () => ({
  completeJson: (...args: unknown[]) => completeJson(...args),
}));

import { createAIHandler, validateShape } from '@/lib/ai/handlers';

interface SampleBody {
  text: string;
}
interface SampleResult {
  score: number;
}

function makeConfig() {
  return {
    systemPrompt: 'sys',
    buildUserPrompt: (body: SampleBody) => `user: ${body.text}`,
    validate: (body: unknown) => {
      const shape = validateShape(body, ['text']);
      return shape.ok
        ? ({ ok: true, value: body as SampleBody } as const)
        : ({ ok: false, status: 400, error: 'text required' } as const);
    },
    onParseFailure: () => ({ ok: false, status: 500, error: 'parse failed' } as const),
  };
}

function postReq(body: unknown) {
  return {
    json: async () => body,
  } as unknown as Request;
}

describe('createAIHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserFromRequest.mockResolvedValue({ id: 'u1' });
  });

  it('returns 401 when no user', async () => {
    getUserFromRequest.mockResolvedValue(null);
    const handler = createAIHandler<SampleBody, SampleResult>(makeConfig());
    const res = await handler(postReq({ text: 'hi' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 on invalid body', async () => {
    const handler = createAIHandler<SampleBody, SampleResult>(makeConfig());
    const res = await handler(postReq({}));
    expect(res.status).toBe(400);
  });

  it('returns 200 with parsed result on success', async () => {
    completeJson.mockResolvedValue({ score: 9 });
    const handler = createAIHandler<SampleBody, SampleResult>(makeConfig());
    const res = await handler(postReq({ text: 'hi' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ score: 9 });
    // Verify the model was called with the built prompt.
    expect(completeJson).toHaveBeenCalledWith('sys', 'user: hi', expect.anything());
  });

  it('returns configured error when model output cannot be parsed', async () => {
    completeJson.mockResolvedValue(null);
    const handler = createAIHandler<SampleBody, SampleResult>(makeConfig());
    const res = await handler(postReq({ text: 'hi' }));
    expect(res.status).toBe(500);
  });

  it('returns 500 when the model call throws', async () => {
    completeJson.mockRejectedValue(new Error('boom'));
    const handler = createAIHandler<SampleBody, SampleResult>(makeConfig());
    const res = await handler(postReq({ text: 'hi' }));
    expect(res.status).toBe(500);
  });

  it('returns 400 on malformed JSON body', async () => {
    const badReq = {
      json: async () => {
        throw new Error('bad json');
      },
    } as unknown as Request;
    const handler = createAIHandler<SampleBody, SampleResult>(makeConfig());
    const res = await handler(badReq);
    expect(res.status).toBe(400);
  });
});

describe('validateShape', () => {
  it('passes when all keys present', () => {
    expect(validateShape({ a: 1, b: 2 }, ['a', 'b']).ok).toBe(true);
  });

  it('reports missing keys', () => {
    const result = validateShape({ a: 1 }, ['a', 'b']);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.missing).toEqual(['b']);
  });

  it('fails on non-object', () => {
    expect(validateShape(null, ['a']).ok).toBe(false);
    expect(validateShape(42, ['a']).ok).toBe(false);
  });
});
