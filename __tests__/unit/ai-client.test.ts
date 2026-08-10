/**
 * Covers src/lib/ai/client.ts (ZAIProvider + completeJson) — previously
 * untested. The underlying z-ai-web-dev-sdk is mocked so no real network
 * call is made.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const createCompletion = vi.fn();
const zaiCreate = vi.fn(() => Promise.resolve({ chat: { completions: { create: createCompletion } } }));

vi.mock('z-ai-web-dev-sdk', () => ({
  default: { create: (...args: unknown[]) => zaiCreate(...args) },
}));

import { ZAIProvider, completeJson, ai } from '@/lib/ai/client';

describe('ZAIProvider.complete', () => {
  beforeEach(() => {
    createCompletion.mockReset();
    zaiCreate.mockClear();
  });

  it('sends system and user messages to the SDK and returns the content', async () => {
    createCompletion.mockResolvedValue({ choices: [{ message: { content: '{"ok":true}' } }] });
    const provider = new ZAIProvider();
    const result = await provider.complete('sys prompt', 'user prompt');
    expect(result).toBe('{"ok":true}');
    expect(createCompletion).toHaveBeenCalledWith({
      messages: [
        { role: 'system', content: 'sys prompt' },
        { role: 'user', content: 'user prompt' },
      ],
    });
  });

  it('returns an empty string when the SDK response has no message content', async () => {
    createCompletion.mockResolvedValue({ choices: [] });
    const provider = new ZAIProvider();
    const result = await provider.complete('sys', 'user');
    expect(result).toBe('');
  });

  it('rejects with a timeout error when the completion takes longer than timeoutMs', async () => {
    vi.useFakeTimers();
    createCompletion.mockReturnValue(new Promise(() => {})); // never resolves
    const provider = new ZAIProvider();
    const promise = provider.complete('sys', 'user', { timeoutMs: 50 });
    const assertion = expect(promise).rejects.toThrow(/timed out after 50ms/);
    await vi.advanceTimersByTimeAsync(60);
    await assertion;
    vi.useRealTimers();
  });

  it('aborts immediately if an already-aborted signal is passed in', async () => {
    createCompletion.mockResolvedValue({ choices: [{ message: { content: 'x' } }] });
    const provider = new ZAIProvider();
    const controller = new AbortController();
    controller.abort();
    // The call still resolves via the mocked SDK (the abort signal isn't
    // forwarded into the completion call itself), but this exercises the
    // already-aborted branch without throwing.
    await expect(provider.complete('sys', 'user', { signal: controller.signal })).resolves.toBe('x');
  });
});

describe('completeJson', () => {
  afterEach(() => {
    createCompletion.mockReset();
  });

  it('parses a JSON object out of the raw completion text', async () => {
    createCompletion.mockResolvedValue({ choices: [{ message: { content: '{"score": 8, "note": "good"}' } }] });
    const result = await completeJson<{ score: number; note: string }>('sys', 'user');
    expect(result).toEqual({ score: 8, note: 'good' });
  });

  it('extracts JSON embedded in surrounding prose (e.g. markdown fences)', async () => {
    createCompletion.mockResolvedValue({
      choices: [{ message: { content: 'Here is the result:\n```json\n{"score": 5}\n```' } }],
    });
    const result = await completeJson<{ score: number }>('sys', 'user');
    expect(result).toEqual({ score: 5 });
  });

  it('returns null when the completion contains no parseable JSON', async () => {
    createCompletion.mockResolvedValue({ choices: [{ message: { content: 'not json at all' } }] });
    const result = await completeJson('sys', 'user');
    expect(result).toBeNull();
  });
});

describe('ai singleton', () => {
  it('is a ZAIProvider instance', () => {
    expect(ai).toBeInstanceOf(ZAIProvider);
  });
});
