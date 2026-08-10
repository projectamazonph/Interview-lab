/**
 * @vitest-environment node
 *
 * Exercises the real handlers in src/app/api/resume/** and
 * src/app/api/cover-letter/** with mocked db/auth. sanitize.ts is left
 * unmocked (it's pure) so sanitization is verified end-to-end too.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const resumeFindMany = vi.fn();
const resumeFindUnique = vi.fn();
const resumeCreate = vi.fn();
const resumeUpdate = vi.fn();
const clFindMany = vi.fn();
const clFindUnique = vi.fn();
const clCreate = vi.fn();
const clUpdate = vi.fn();
const getUserFromRequest = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    resume: {
      findMany: (...args: unknown[]) => resumeFindMany(...args),
      findUnique: (...args: unknown[]) => resumeFindUnique(...args),
      create: (...args: unknown[]) => resumeCreate(...args),
      update: (...args: unknown[]) => resumeUpdate(...args),
    },
    coverLetter: {
      findMany: (...args: unknown[]) => clFindMany(...args),
      findUnique: (...args: unknown[]) => clFindUnique(...args),
      create: (...args: unknown[]) => clCreate(...args),
      update: (...args: unknown[]) => clUpdate(...args),
    },
  },
}));

vi.mock('@/lib/auth-helpers', () => ({
  getUserFromRequest: (...args: unknown[]) => getUserFromRequest(...args),
}));

import { GET as resumeList, POST as resumeCreateRoute } from '@/app/api/resume/route';
import { GET as resumeGetById, PUT as resumePut } from '@/app/api/resume/[id]/route';
import { GET as clList, POST as clCreateRoute } from '@/app/api/cover-letter/route';
import { GET as clGetById, PUT as clPut } from '@/app/api/cover-letter/[id]/route';

function getReq(url = 'http://localhost/api/resume') {
  return new Request(url);
}
function postReq(body: unknown, url = 'http://localhost/api/resume') {
  return new Request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}
function putReq(body: unknown, url = 'http://localhost/api/resume/r1') {
  return new Request(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}
function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

const mockUser = { id: 'u1', email: 'u@test.com' };

describe('GET /api/resume', () => {
  beforeEach(() => {
    getUserFromRequest.mockReset();
    resumeFindMany.mockReset();
    getUserFromRequest.mockResolvedValue(mockUser);
  });

  it('returns 401 when not authenticated', async () => {
    getUserFromRequest.mockResolvedValue(null);
    const res = await resumeList(getReq());
    expect(res.status).toBe(401);
  });

  it('scopes to the authenticated user, newest first', async () => {
    resumeFindMany.mockResolvedValue([{ id: 'r1', userId: 'u1' }]);
    const res = await resumeList(getReq());
    expect(res.status).toBe(200);
    expect(resumeFindMany).toHaveBeenCalledWith({ where: { userId: 'u1' }, orderBy: { createdAt: 'desc' } });
  });

  it('returns 500 when the db throws', async () => {
    resumeFindMany.mockRejectedValue(new Error('db down'));
    const res = await resumeList(getReq());
    expect(res.status).toBe(500);
  });
});

describe('POST /api/resume', () => {
  beforeEach(() => {
    getUserFromRequest.mockReset();
    resumeCreate.mockReset();
    getUserFromRequest.mockResolvedValue(mockUser);
    resumeCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: 'r1', ...data }));
  });

  it('returns 401 when not authenticated', async () => {
    getUserFromRequest.mockResolvedValue(null);
    const res = await resumeCreateRoute(postReq({ originalText: 'my resume' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 when originalText is empty/whitespace-only', async () => {
    const res = await resumeCreateRoute(postReq({ originalText: '   ' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('required');
  });

  it('returns 400 when originalText is not provided', async () => {
    const res = await resumeCreateRoute(postReq({}));
    expect(res.status).toBe(400);
  });

  it('creates a resume scoped to the user with sanitized text', async () => {
    const res = await resumeCreateRoute(postReq({ originalText: '<b>My</b> resume', targetRole: 'PPC VA' }));
    expect(res.status).toBe(201);
    expect(resumeCreate).toHaveBeenCalledWith({ data: { userId: 'u1', originalText: 'My resume', targetRole: 'PPC VA' } });
  });

  it('strips HTML from originalText and targetRole', async () => {
    await resumeCreateRoute(postReq({ originalText: '<script>alert(1)</script>Resume text', targetRole: '<i>PPC</i> VA' }));
    const data = resumeCreate.mock.calls[0][0].data;
    expect(data.originalText).toBe('Resume text');
    expect(data.targetRole).toBe('PPC VA');
  });

  it('returns 500 on a request.json() failure', async () => {
    const badReq = { headers: { get: () => null }, json: async () => { throw new Error('bad'); } } as unknown as Request;
    const res = await resumeCreateRoute(badReq);
    expect(res.status).toBe(500);
  });
});

describe('GET/PUT /api/resume/[id]', () => {
  beforeEach(() => {
    getUserFromRequest.mockReset();
    resumeFindUnique.mockReset();
    resumeUpdate.mockReset();
    getUserFromRequest.mockResolvedValue(mockUser);
  });

  it('returns 404 when the resume does not exist', async () => {
    resumeFindUnique.mockResolvedValue(null);
    const res = await resumeGetById(getReq(), params('missing'));
    expect(res.status).toBe(404);
  });

  it('returns 403 for a non-owner', async () => {
    resumeFindUnique.mockResolvedValue({ id: 'r1', userId: 'other' });
    const res = await resumeGetById(getReq(), params('r1'));
    expect(res.status).toBe(403);
  });

  it('parses truthFlags JSON for the owner', async () => {
    resumeFindUnique.mockResolvedValue({ id: 'r1', userId: 'u1', truthFlags: JSON.stringify(['flag1']) });
    const res = await resumeGetById(getReq(), params('r1'));
    expect((await res.json()).truthFlags).toEqual(['flag1']);
  });

  it('PUT rejects a non-owner with 403 without writing', async () => {
    resumeFindUnique.mockResolvedValue({ id: 'r1', userId: 'other' });
    const res = await resumePut(putReq({ score: 90 }), params('r1'));
    expect(res.status).toBe(403);
    expect(resumeUpdate).not.toHaveBeenCalled();
  });

  it('PUT updates score/improvedVersion/truthFlags for the owner', async () => {
    resumeFindUnique.mockResolvedValue({ id: 'r1', userId: 'u1' });
    resumeUpdate.mockResolvedValue({ id: 'r1', score: 90, improvedVersion: 'better', truthFlags: JSON.stringify(['x']) });
    const res = await resumePut(putReq({ score: 90, improvedVersion: 'better', truthFlags: ['x'] }), params('r1'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.score).toBe(90);
    expect(body.truthFlags).toEqual(['x']);
    expect(resumeUpdate).toHaveBeenCalledWith({ where: { id: 'r1' }, data: { score: 90, improvedVersion: 'better', truthFlags: JSON.stringify(['x']) } });
  });
});

describe('GET /api/cover-letter', () => {
  beforeEach(() => {
    getUserFromRequest.mockReset();
    clFindMany.mockReset();
    getUserFromRequest.mockResolvedValue(mockUser);
  });

  it('returns 401 when not authenticated', async () => {
    getUserFromRequest.mockResolvedValue(null);
    const res = await clList(getReq('http://localhost/api/cover-letter'));
    expect(res.status).toBe(401);
  });

  it('scopes to the authenticated user', async () => {
    clFindMany.mockResolvedValue([]);
    await clList(getReq('http://localhost/api/cover-letter'));
    expect(clFindMany).toHaveBeenCalledWith({ where: { userId: 'u1' }, orderBy: { createdAt: 'desc' } });
  });
});

describe('POST /api/cover-letter', () => {
  beforeEach(() => {
    getUserFromRequest.mockReset();
    clCreate.mockReset();
    getUserFromRequest.mockResolvedValue(mockUser);
    clCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: 'cl1', ...data }));
  });

  it('returns 401 when not authenticated', async () => {
    getUserFromRequest.mockResolvedValue(null);
    const res = await clCreateRoute(postReq({ jobDescription: 'desc' }, 'http://localhost/api/cover-letter'));
    expect(res.status).toBe(401);
  });

  it('returns 400 when jobDescription is empty', async () => {
    const res = await clCreateRoute(postReq({ jobDescription: '' }, 'http://localhost/api/cover-letter'));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('required');
  });

  it('defaults tone to "formal" for an invalid/missing tone', async () => {
    const res = await clCreateRoute(postReq({ jobDescription: 'A job' }, 'http://localhost/api/cover-letter'));
    expect((await res.json()).tone).toBe('formal');

    const res2 = await clCreateRoute(postReq({ jobDescription: 'A job', tone: 'not-a-real-tone' }, 'http://localhost/api/cover-letter'));
    expect((await res2.json()).tone).toBe('formal');
  });

  it.each(['formal', 'conversational', 'beginner_friendly', 'agency', 'upwork', 'cold_email', 'linkedin', 'professional'])(
    'accepts the "%s" tone as-is',
    async (tone) => {
      const res = await clCreateRoute(postReq({ jobDescription: 'A job', tone }, 'http://localhost/api/cover-letter'));
      expect((await res.json()).tone).toBe(tone);
    }
  );

  it('stores truth flags as a JSON string, filtering out non-string entries', async () => {
    // The POST response returns the raw created row (unlike GET/PUT by id,
    // which JSON.parse the field back out) — so truthFlags comes back as
    // the serialized string here.
    const res = await clCreateRoute(postReq({ jobDescription: 'A job', truthFlags: ['flag1', 42, 'flag2', ''] }, 'http://localhost/api/cover-letter'));
    expect((await res.json()).truthFlags).toBe(JSON.stringify(['flag1', 'flag2']));
  });

  it('stores null truthFlags when the array is empty or absent', async () => {
    const res = await clCreateRoute(postReq({ jobDescription: 'A job', truthFlags: [] }, 'http://localhost/api/cover-letter'));
    expect((await res.json()).truthFlags).toBeNull();

    const res2 = await clCreateRoute(postReq({ jobDescription: 'A job' }, 'http://localhost/api/cover-letter'));
    expect((await res2.json()).truthFlags).toBeNull();
  });

  it('sanitizes jobDescription (strips HTML) but allows rich formatting in generatedLetter', async () => {
    const res = await clCreateRoute(postReq({
      jobDescription: '<script>alert(1)</script>We need a PPC VA',
      generatedLetter: '<b>Dear Hiring Manager</b>,\n\nI am excited...',
    }, 'http://localhost/api/cover-letter'));
    const body = await res.json();
    expect(body.jobDescription).toBe('We need a PPC VA');
    expect(body.generatedLetter).toContain('<b>Dear Hiring Manager</b>');
  });

  it('scopes the created row to the authenticated user', async () => {
    await clCreateRoute(postReq({ jobDescription: 'A job' }, 'http://localhost/api/cover-letter'));
    expect(clCreate.mock.calls[0][0].data.userId).toBe('u1');
  });

  it('returns 500 on a request.json() failure', async () => {
    const badReq = { headers: { get: () => null }, json: async () => { throw new Error('bad'); } } as unknown as Request;
    const res = await clCreateRoute(badReq);
    expect(res.status).toBe(500);
  });
});

describe('GET/PUT /api/cover-letter/[id]', () => {
  beforeEach(() => {
    getUserFromRequest.mockReset();
    clFindUnique.mockReset();
    clUpdate.mockReset();
    getUserFromRequest.mockResolvedValue(mockUser);
  });

  it('returns 404 when the cover letter does not exist', async () => {
    clFindUnique.mockResolvedValue(null);
    const res = await clGetById(getReq('http://localhost/api/cover-letter/missing'), params('missing'));
    expect(res.status).toBe(404);
  });

  it('returns 403 for a non-owner and does not leak content', async () => {
    clFindUnique.mockResolvedValue({ id: 'cl1', userId: 'other' });
    const res = await clGetById(getReq('http://localhost/api/cover-letter/cl1'), params('cl1'));
    expect(res.status).toBe(403);
  });

  it('PUT updates generatedLetter/truthFlags for the owner', async () => {
    clFindUnique.mockResolvedValue({ id: 'cl1', userId: 'u1' });
    clUpdate.mockResolvedValue({ id: 'cl1', generatedLetter: 'revised', truthFlags: JSON.stringify(['x']) });
    const res = await clPut(putReq({ generatedLetter: 'revised', truthFlags: ['x'] }, 'http://localhost/api/cover-letter/cl1'), params('cl1'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.generatedLetter).toBe('revised');
    expect(body.truthFlags).toEqual(['x']);
  });

  it('PUT rejects a non-owner with 403 without writing', async () => {
    clFindUnique.mockResolvedValue({ id: 'cl1', userId: 'other' });
    const res = await clPut(putReq({ generatedLetter: 'hacked' }, 'http://localhost/api/cover-letter/cl1'), params('cl1'));
    expect(res.status).toBe(403);
    expect(clUpdate).not.toHaveBeenCalled();
  });
});
