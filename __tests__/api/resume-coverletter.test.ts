import { describe, it, expect, beforeEach } from 'bun:test';

let currentUser: any = null;
let resumes: any[] = [];
let coverLetters: any[] = [];
let createdResume: any = null;
let createdCL: any = null;

function reset() {
  currentUser = null;
  resumes = [];
  coverLetters = [];
  createdResume = null;
  createdCL = null;
}

function req() { return { headers: { get: () => null } }; }
function postReq(body: any) { return { headers: { get: () => null }, json: async () => body }; }

function sanitizeText(v: any) {
  if (typeof v !== 'string') return v;
  return v.replace(/<[^>]*>/g, '').trim().substring(0, 2000);
}
function sanitizeRichText(v: any) {
  if (typeof v !== 'string') return v;
  return v.trim().substring(0, 10000);
}

const ALLOWED_TONES = ['formal', 'conversational', 'beginner_friendly', 'agency', 'upwork', 'cold_email', 'linkedin', 'professional'];

// --- Resume handlers ---
async function resumeGet() {
  try {
    if (!currentUser) return { status: 401, body: { error: 'Unauthorized' } };
    const r = resumes.filter(x => x.userId === currentUser.id).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return { status: 200, body: { resumes: r } };
  } catch { return { status: 500, body: { error: 'Failed' } }; }
}

async function resumePost(request: any) {
  try {
    if (!currentUser) return { status: 401, body: { error: 'Unauthorized' } };
    const raw = await request.json();
    const originalText = sanitizeText(raw.originalText);
    const targetRole = sanitizeText(raw.targetRole);
    if (!originalText) return { status: 400, body: { error: 'Resume text is required' } };
    const r = { id: 'r-' + Date.now(), userId: currentUser.id, originalText, targetRole, createdAt: new Date() };
    resumes.push(r);
    createdResume = r;
    return { status: 201, body: r };
  } catch { return { status: 500, body: { error: 'Failed' } }; }
}

// --- Cover letter handlers ---
async function clGet() {
  try {
    if (!currentUser) return { status: 401, body: { error: 'Unauthorized' } };
    const cl = coverLetters.filter(x => x.userId === currentUser.id);
    return { status: 200, body: { coverLetters: cl } };
  } catch { return { status: 500, body: { error: 'Failed' } }; }
}

async function clPost(request: any) {
  try {
    if (!currentUser) return { status: 401, body: { error: 'Unauthorized' } };
    const raw = await request.json();
    const jobDescription = sanitizeText(raw.jobDescription);
    const tone = ALLOWED_TONES.includes(raw.tone) ? raw.tone : 'formal';
    const generatedLetter = sanitizeRichText(raw.generatedLetter);
    let truthFlags: string | null = null;
    if (Array.isArray(raw.truthFlags)) {
      const sanitized = raw.truthFlags.filter((v: unknown) => typeof v === 'string').map((v: string) => sanitizeText(v) || '').filter((v: string) => v.length > 0);
      if (sanitized.length > 0) truthFlags = JSON.stringify(sanitized);
    }
    if (!jobDescription) return { status: 400, body: { error: 'Job description is required' } };
    const cl = { id: 'cl-' + Date.now(), userId: currentUser.id, jobDescription, tone, generatedLetter, truthFlags, createdAt: new Date() };
    coverLetters.push(cl);
    createdCL = cl;
    return { status: 201, body: cl };
  } catch { return { status: 500, body: { error: 'Failed' } }; }
}

describe('GET /api/resume', () => {
  beforeEach(() => reset());

  it('returns 401 when not authenticated', async () => {
    currentUser = null;
    const res = await resumeGet();
    expect(res.status).toBe(401);
  });

  it('returns resumes for authenticated user', async () => {
    currentUser = { id: 'u1' };
    resumes.push({ id: 'r1', userId: 'u1', originalText: 'text', targetRole: 'PPC VA' });
    const res = await resumeGet();
    expect(res.status).toBe(200);
    expect(res.body.resumes.length).toBe(1);
    expect(res.body.resumes[0].id).toBe('r1');
  });

  it('does not return other users resumes', async () => {
    currentUser = { id: 'u1' };
    resumes.push({ id: 'r1', userId: 'u1', originalText: 'mine' });
    resumes.push({ id: 'r2', userId: 'u2', originalText: 'others' });
    const res = await resumeGet();
    expect(res.body.resumes.length).toBe(1);
  });

  it('returns empty array when no resumes', async () => {
    currentUser = { id: 'u1' };
    const res = await resumeGet();
    expect(res.body.resumes).toEqual([]);
  });
});

describe('POST /api/resume', () => {
  beforeEach(() => reset());

  it('returns 401 when not authenticated', async () => {
    currentUser = null;
    const res = await resumePost(postReq({ originalText: 'my resume' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 when originalText is empty', async () => {
    currentUser = { id: 'u1' };
    const res = await resumePost(postReq({ originalText: '' }));
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Resume text is required');
  });

  it('returns 400 when originalText is not provided', async () => {
    currentUser = { id: 'u1' };
    const res = await resumePost(postReq({ targetRole: 'PPC VA' }));
    expect(res.status).toBe(400);
  });

  it('creates resume with sanitized text', async () => {
    currentUser = { id: 'u1' };
    const res = await resumePost(postReq({ originalText: '  My resume  ', targetRole: 'PPC VA' }));
    expect(res.status).toBe(201);
    expect(res.body.originalText).toBe('My resume');
    expect(res.body.targetRole).toBe('PPC VA');
  });

  it('strips HTML from text fields', async () => {
    currentUser = { id: 'u1' };
    const res = await resumePost(postReq({ originalText: '<script>alert(1)</script>My resume' }));
    expect(res.body.originalText).not.toContain('<script>');
    expect(res.body.originalText).toContain('My resume');
  });

  it('returns 500 on json error', async () => {
    currentUser = { id: 'u1' };
    const badReq = { headers: { get: () => null }, json: async () => { throw new Error('bad'); } };
    const res = await resumePost(badReq);
    expect(res.status).toBe(500);
  });
});

describe('GET /api/cover-letter', () => {
  beforeEach(() => reset());

  it('returns 401 when not authenticated', async () => {
    currentUser = null;
    const res = await clGet();
    expect(res.status).toBe(401);
  });

  it('returns cover letters for user', async () => {
    currentUser = { id: 'u1' };
    coverLetters.push({ id: 'cl1', userId: 'u1', jobDescription: 'VA role' });
    const res = await clGet();
    expect(res.status).toBe(200);
    expect(res.body.coverLetters.length).toBe(1);
  });

  it('does not return other users cover letters', async () => {
    currentUser = { id: 'u1' };
    coverLetters.push({ id: 'cl1', userId: 'u1' });
    coverLetters.push({ id: 'cl2', userId: 'u2' });
    const res = await clGet();
    expect(res.body.coverLetters.length).toBe(1);
  });
});

describe('POST /api/cover-letter', () => {
  beforeEach(() => reset());

  it('returns 401 when not authenticated', async () => {
    currentUser = null;
    const res = await clPost(postReq({ jobDescription: 'VA role' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 when jobDescription is empty', async () => {
    currentUser = { id: 'u1' };
    const res = await clPost(postReq({ jobDescription: '' }));
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Job description is required');
  });

  it('creates cover letter with default tone', async () => {
    currentUser = { id: 'u1' };
    const res = await clPost(postReq({ jobDescription: 'PPC VA role', tone: 'invalid_tone' }));
    expect(res.status).toBe(201);
    expect(res.body.tone).toBe('formal');
  });

  it('accepts valid tone', async () => {
    currentUser = { id: 'u1' };
    const res = await clPost(postReq({ jobDescription: 'VA role', tone: 'upwork' }));
    expect(res.body.tone).toBe('upwork');
  });

  it('accepts all allowed tones', async () => {
    currentUser = { id: 'u1' };
    for (const tone of ALLOWED_TONES) {
      coverLetters = [];
      const res = await clPost(postReq({ jobDescription: 'VA role', tone }));
      expect(res.body.tone).toBe(tone);
    }
  });

  it('stores truth flags as JSON string', async () => {
    currentUser = { id: 'u1' };
    const res = await clPost(postReq({ jobDescription: 'VA role', truthFlags: ['3+ years experience', 'Amazon trained'] }));
    expect(res.body.truthFlags).toBe(JSON.stringify(['3+ years experience', 'Amazon trained']));
  });

  it('filters non-string truth flags', async () => {
    currentUser = { id: 'u1' };
    const res = await clPost(postReq({ jobDescription: 'VA role', truthFlags: ['valid', 123, null, 'also valid'] }));
    expect(res.body.truthFlags).toBe(JSON.stringify(['valid', 'also valid']));
  });

  it('returns null truthFlags when array is empty', async () => {
    currentUser = { id: 'u1' };
    const res = await clPost(postReq({ jobDescription: 'VA role', truthFlags: [] }));
    expect(res.body.truthFlags).toBeNull();
  });

  it('returns null truthFlags when not provided', async () => {
    currentUser = { id: 'u1' };
    const res = await clPost(postReq({ jobDescription: 'VA role' }));
    expect(res.body.truthFlags).toBeNull();
  });

  it('sanitizes generatedLetter', async () => {
    currentUser = { id: 'u1' };
    const res = await clPost(postReq({ jobDescription: 'VA role', generatedLetter: '  Dear Hiring Manager,  ' }));
    expect(res.body.generatedLetter).toBe('Dear Hiring Manager,');
  });

  it('sanitizes jobDescription (strips HTML)', async () => {
    currentUser = { id: 'u1' };
    const res = await clPost(postReq({ jobDescription: '<b>PPC VA</b> role' }));
    expect(res.body.jobDescription).toBe('PPC VA role');
  });

  it('returns 500 on json error', async () => {
    currentUser = { id: 'u1' };
    const badReq = { headers: { get: () => null }, json: async () => { throw new Error('bad'); } };
    const res = await clPost(badReq);
    expect(res.status).toBe(500);
  });
});
