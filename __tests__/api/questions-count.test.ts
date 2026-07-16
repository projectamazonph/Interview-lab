/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const count = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    question: {
      count: (...args: unknown[]) => count(...args),
    },
  },
}));

import { GET } from '@/app/api/questions/count/route';

describe('GET /api/questions/count', () => {
  beforeEach(() => {
    count.mockReset();
  });

  it('returns the total number of published questions', async () => {
    count.mockResolvedValue(264);
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toEqual({ total: 264 });
    expect(count).toHaveBeenCalledWith({ where: { status: 'published' } });
  });

  it('returns total 0 when the database throws', async () => {
    count.mockRejectedValue(new Error('db down'));
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toEqual({ total: 0 });
  });
});
