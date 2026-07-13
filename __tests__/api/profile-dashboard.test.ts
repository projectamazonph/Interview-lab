import { describe, it, expect, beforeEach } from 'bun:test';

let currentUser: any = null;
let profiles: any[] = [];
let users: any[] = [];
let sessions: any[] = [];
let resumes: any[] = [];
let coverLetters: any[] = [];
let questionAttempts: any[] = [];
let upsertResult: any = null;

function reset() {
  currentUser = null;
  profiles = [];
  users = [];
  sessions = [];
  resumes = [];
  coverLetters = [];
  questionAttempts = [];
  upsertResult = null;
}

function req() {
  return { headers: { get: () => null } };
}

function putReq(body: any) {
  return { headers: { get: () => null }, json: async () => body };
}

// --- Profile handlers ---
function sanitizeText(v: any) {
  if (typeof v !== 'string') return v;
  return v.replace(/<[^>]*>/g, '').trim().substring(0, 2000);
}

async function profileGet(request: any) {
  try {
    if (!currentUser) return { status: 401, body: { error: 'Unauthorized' } };
    const profile = profiles.find(p => p.userId === currentUser.id);
    if (!profile) return { status: 200, body: { onboardingDone: false } };
    return {
      status: 200,
      body: {
        ...profile,
        toolsKnown: profile.toolsKnown ? JSON.parse(profile.toolsKnown) : null,
        weakAreas: profile.weakAreas ? JSON.parse(profile.weakAreas) : null,
      },
    };
  } catch {
    return { status: 500, body: { error: 'Failed to fetch profile' } };
  }
}

const ALLOWED_FIELDS = ['targetRole', 'experienceLevel', 'toolsKnown', 'weakAreas',
  'interviewDate', 'confidenceLevel', 'resumeStatus', 'country', 'onboardingDone'];

async function profilePut(request: any) {
  try {
    if (!currentUser) return { status: 401, body: { error: 'Unauthorized' } };
    const rawData = await request.json();
    const data: Record<string, any> = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in rawData) {
        if (key === 'onboardingDone') data[key] = typeof rawData[key] === 'boolean' ? rawData[key] : true;
        else if (key === 'toolsKnown' || key === 'weakAreas') {
          const val = rawData[key];
          if (Array.isArray(val)) data[key] = JSON.stringify(val.map((v: string) => sanitizeText(v)).filter(Boolean));
          else if (typeof val === 'string') { const c = sanitizeText(val); if (c) data[key] = JSON.stringify([c]); }
        } else {
          data[key] = sanitizeText(rawData[key]);
        }
      }
    }
    upsertResult = { userId: currentUser.id, ...data };
    return { status: 200, body: upsertResult };
  } catch {
    return { status: 500, body: { error: 'Failed to update profile' } };
  }
}

// --- Dashboard handler ---
async function dashboardGet(request: any) {
  try {
    if (!currentUser) return { status: 401, body: { error: 'Unauthorized' } };
    const user = users.find(u => u.id === currentUser.id);
    const profile = profiles.find(p => p.userId === currentUser.id);
    const userSessions = sessions.filter(s => s.userId === currentUser.id).slice(0, 5);
    const userResumes = resumes.filter(r => r.userId === currentUser.id).slice(0, 5);
    const userCLs = coverLetters.filter(c => c.userId === currentUser.id).slice(0, 5);
    const userAttempts = questionAttempts.filter(a => a.userId === currentUser.id).slice(0, 10);
    const totalSessions = sessions.filter(s => s.userId === currentUser.id).length;
    const completedSessions = sessions.filter(s => s.userId === currentUser.id && s.completedAt).length;
    const totalAttempts = userAttempts.length;
    const scored = userAttempts.filter(a => a.score != null);
    const avgScore = scored.length > 0 ? scored.reduce((s, a) => s + a.score, 0) / scored.length : 0;
    const latestResumeScore = userResumes.length > 0 ? userResumes[0].score : null;
    return {
      status: 200,
      body: {
        user: user ? { id: user.id, email: user.email, name: user.name, subscriptionTier: user.subscriptionTier, isAdmin: user.isAdmin, createdAt: user.createdAt } : null,
        profile: profile ? { ...profile, toolsKnown: profile.toolsKnown ? JSON.parse(profile.toolsKnown) : null, weakAreas: profile.weakAreas ? JSON.parse(profile.weakAreas) : null } : null,
        stats: { totalSessions, completedSessions, totalAttempts, avgScore: Math.round(avgScore * 10) / 10, latestResumeScore },
        recentSessions: userSessions,
        recentResumes: userResumes,
        recentCoverLetters: userCLs,
        recentAttempts: userAttempts,
      },
    };
  } catch {
    return { status: 500, body: { error: 'Failed to fetch dashboard data' } };
  }
}

describe('GET /api/profile', () => {
  beforeEach(() => reset());

  it('returns 401 when not authenticated', async () => {
    currentUser = null;
    const res = await profileGet(req());
    expect(res.status).toBe(401);
  });

  it('returns onboardingDone:false when no profile exists', async () => {
    currentUser = { id: 'u1' };
    const res = await profileGet(req());
    expect(res.status).toBe(200);
    expect(res.body.onboardingDone).toBe(false);
  });

  it('returns profile data when it exists', async () => {
    currentUser = { id: 'u1' };
    profiles.push({ userId: 'u1', targetRole: 'PPC VA', experienceLevel: 'mid', toolsKnown: JSON.stringify(['Excel']), weakAreas: JSON.stringify(['analytics']), country: 'PH', onboardingDone: true });
    const res = await profileGet(req());
    expect(res.status).toBe(200);
    expect(res.body.targetRole).toBe('PPC VA');
    expect(res.body.toolsKnown).toEqual(['Excel']);
    expect(res.body.weakAreas).toEqual(['analytics']);
  });

  it('parses toolsKnown and weakAreas from JSON strings', async () => {
    currentUser = { id: 'u1' };
    profiles.push({ userId: 'u1', targetRole: 'Account VA', toolsKnown: JSON.stringify(['Canva', 'Sheets']), weakAreas: JSON.stringify(['data entry']), onboardingDone: true });
    const res = await profileGet(req());
    expect(res.body.toolsKnown).toEqual(['Canva', 'Sheets']);
    expect(res.body.weakAreas).toEqual(['data entry']);
  });

  it('returns null for toolsKnown/weakAreas when they are null', async () => {
    currentUser = { id: 'u1' };
    profiles.push({ userId: 'u1', targetRole: 'PPC VA', toolsKnown: null, weakAreas: null, onboardingDone: false });
    const res = await profileGet(req());
    expect(res.body.toolsKnown).toBeNull();
    expect(res.body.weakAreas).toBeNull();
  });
});

describe('PUT /api/profile', () => {
  beforeEach(() => reset());

  it('returns 401 when not authenticated', async () => {
    currentUser = null;
    const res = await profilePut(putReq({ targetRole: 'PPC VA' }));
    expect(res.status).toBe(401);
  });

  it('updates targetRole', async () => {
    currentUser = { id: 'u1' };
    await profilePut(putReq({ targetRole: 'Account VA' }));
    expect(upsertResult.targetRole).toBe('Account VA');
  });

  it('sanitizes text fields (strips HTML)', async () => {
    currentUser = { id: 'u1' };
    await profilePut(putReq({ targetRole: '<script>alert(1)</script>PPC VA' }));
    expect(upsertResult.targetRole).not.toContain('<script>');
    expect(upsertResult.targetRole).toContain('PPC VA');
  });

  it('handles toolsKnown as array', async () => {
    currentUser = { id: 'u1' };
    await profilePut(putReq({ toolsKnown: ['Excel', 'Canva'] }));
    expect(upsertResult.toolsKnown).toBe(JSON.stringify(['Excel', 'Canva']));
  });

  it('handles weakAreas as array', async () => {
    currentUser = { id: 'u1' };
    await profilePut(putReq({ weakAreas: ['analytics', 'reporting'] }));
    expect(upsertResult.weakAreas).toBe(JSON.stringify(['analytics', 'reporting']));
  });

  it('handles toolsKnown as single string', async () => {
    currentUser = { id: 'u1' };
    await profilePut(putReq({ toolsKnown: 'Excel' }));
    expect(upsertResult.toolsKnown).toBe(JSON.stringify(['Excel']));
  });

  it('handles onboardingDone boolean', async () => {
    currentUser = { id: 'u1' };
    await profilePut(putReq({ onboardingDone: true }));
    expect(upsertResult.onboardingDone).toBe(true);
  });

  it('defaults onboardingDone to true when non-boolean', async () => {
    currentUser = { id: 'u1' };
    await profilePut(putReq({ onboardingDone: 'yes' }));
    expect(upsertResult.onboardingDone).toBe(true);
  });

  it('ignores non-allowed fields', async () => {
    currentUser = { id: 'u1' };
    await profilePut(putReq({ targetRole: 'PPC VA', isAdmin: true, id: 'hacked' }));
    expect(upsertResult.targetRole).toBe('PPC VA');
    expect(upsertResult).not.toHaveProperty('isAdmin');
    expect(upsertResult).not.toHaveProperty('id');
  });

  it('filters empty strings from toolsKnown array', async () => {
    currentUser = { id: 'u1' };
    await profilePut(putReq({ toolsKnown: ['Excel', '', '  ', 'Canva'] }));
    expect(upsertResult.toolsKnown).toBe(JSON.stringify(['Excel', 'Canva']));
  });

  it('handles country field', async () => {
    currentUser = { id: 'u1' };
    await profilePut(putReq({ country: 'Philippines' }));
    expect(upsertResult.country).toBe('Philippines');
  });

  it('returns 500 on json error', async () => {
    currentUser = { id: 'u1' };
    const badReq = { headers: { get: () => null }, json: async () => { throw new Error('bad'); } };
    const res = await profilePut(badReq);
    expect(res.status).toBe(500);
  });
});

describe('GET /api/dashboard', () => {
  beforeEach(() => reset());

  it('returns 401 when not authenticated', async () => {
    currentUser = null;
    const res = await dashboardGet(req());
    expect(res.status).toBe(401);
  });

  it('returns user and profile data', async () => {
    currentUser = { id: 'u1' };
    users.push({ id: 'u1', email: 'u@test.com', name: 'User', subscriptionTier: 'pro', isAdmin: false, createdAt: '2026-01-01' });
    profiles.push({ userId: 'u1', targetRole: 'PPC VA', toolsKnown: JSON.stringify(['Excel']), weakAreas: null, onboardingDone: true });
    const res = await dashboardGet(req());
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe('u1');
    expect(res.body.user.subscriptionTier).toBe('pro');
    expect(res.body.profile.targetRole).toBe('PPC VA');
    expect(res.body.profile.toolsKnown).toEqual(['Excel']);
  });

  it('returns null user and profile when none exist', async () => {
    currentUser = { id: 'u1' };
    const res = await dashboardGet(req());
    expect(res.status).toBe(200);
    expect(res.body.user).toBeNull();
    expect(res.body.profile).toBeNull();
  });

  it('calculates stats correctly', async () => {
    currentUser = { id: 'u1' };
    users.push({ id: 'u1', email: 'u@test.com', name: 'U', subscriptionTier: 'free', isAdmin: false, createdAt: '2026-01-01' });
    sessions.push({ userId: 'u1', startedAt: '2026-07-01', completedAt: '2026-07-01' });
    sessions.push({ userId: 'u1', startedAt: '2026-07-02', completedAt: null });
    questionAttempts.push({ userId: 'u1', score: 8, question: { text: 'q1' } });
    questionAttempts.push({ userId: 'u1', score: 6, question: { text: 'q2' } });
    resumes.push({ userId: 'u1', score: 85, createdAt: '2026-07-01' });
    const res = await dashboardGet(req());
    expect(res.body.stats.totalSessions).toBe(2);
    expect(res.body.stats.completedSessions).toBe(1);
    expect(res.body.stats.totalAttempts).toBe(2);
    expect(res.body.stats.avgScore).toBe(7);
    expect(res.body.stats.latestResumeScore).toBe(85);
  });

  it('returns recent items limited to 5 sessions/resumes/coverLetters', async () => {
    currentUser = { id: 'u1' };
    users.push({ id: 'u1', email: 'u@test.com', name: 'U', subscriptionTier: 'free', isAdmin: false, createdAt: '2026-01-01' });
    for (let i = 0; i < 8; i++) {
      sessions.push({ userId: 'u1', startedAt: `2026-07-0${i}`, completedAt: null });
      resumes.push({ userId: 'u1', score: i * 10, createdAt: `2026-07-0${i}` });
      coverLetters.push({ userId: 'u1', createdAt: `2026-07-0${i}` });
    }
    const res = await dashboardGet(req());
    expect(res.body.recentSessions.length).toBe(5);
    expect(res.body.recentResumes.length).toBe(5);
    expect(res.body.recentCoverLetters.length).toBe(5);
  });

  it('filters empty coverLetters', async () => {
    currentUser = { id: 'u1' };
    users.push({ id: 'u1', email: 'u@test.com', name: 'U', subscriptionTier: 'free', isAdmin: false, createdAt: '2026-01-01' });
    const res = await dashboardGet(req());
    expect(res.body.recentCoverLetters).toEqual([]);
    expect(res.body.recentSessions).toEqual([]);
    expect(res.body.recentResumes).toEqual([]);
  });
});
