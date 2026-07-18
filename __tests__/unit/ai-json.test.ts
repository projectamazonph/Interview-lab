import { describe, it, expect } from 'vitest';
import { extractJson } from '@/lib/ai/json';

describe('extractJson', () => {
  it('parses a bare JSON object', () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
  });

  it('parses a bare JSON array', () => {
    expect(extractJson('[1,2,3]')).toEqual([1, 2, 3]);
  });

  it('extracts JSON from prose', () => {
    const text = 'Here is your result:\n{"score": 8, "ok": true}\nHope that helps.';
    expect(extractJson(text)).toEqual({ score: 8, ok: true });
  });

  it('extracts JSON wrapped in code fences', () => {
    const text = '```json\n{"a":1}\n```';
    expect(extractJson(text)).toEqual({ a: 1 });
  });

  it('extracts an array embedded in text', () => {
    const text = 'words ["x","y"] more words';
    expect(extractJson(text)).toEqual(['x', 'y']);
  });

  it('returns null for empty input', () => {
    expect(extractJson('')).toBeNull();
    expect(extractJson(null as unknown as string)).toBeNull();
  });

  it('returns null for non-JSON text', () => {
    expect(extractJson('no json here at all')).toBeNull();
  });

  it('returns null for malformed JSON', () => {
    expect(extractJson('{not valid}')).toBeNull();
  });
});
