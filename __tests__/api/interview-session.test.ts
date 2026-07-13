import { describe, it, expect, beforeEach } from 'vitest';

let mockSessionStore: Record<string, any> = {};
function resetStore() { mockSessionStore = {}; }

const VALID_MODES = ['quick_drill', 'role_interview', 'technical_screen', 'client_communication', 'final_interview', 'practical_debrief'];

function createSession(user: any, body: any) {
  if (!user) return { status: 401, data: { error: 'Unauthorized' } };
  const rawMode = String(body.mode || '');
  const mode = rawMode.replace(/<[^>]*>/g, '').trim();
  const targetRole = body.targetRole ? String(body.targetRole).replace(/<[^>]*>/g, '').trim() : null;
  if (!VALID_MODES.includes(mode)) return { status: 400, data: { error: 'Invalid interview mode' } };
  let questionCount = 10;
  if (mode === 'quick_drill') questionCount = 5;
  else if (mode === 'role_interview') questionCount = 10;
  else if (mode === 'technical_screen') questionCount = 8;
  else if (mode === 'client_communication') questionCount = 8;
  else if (mode === 'final_interview') questionCount = 10;
  else if (mode === 'practical_debrief') questionCount = 5;
  const session = { id: 'sess_' + Date.now(), userId: user.id, mode, targetRole, startedAt: new Date() };
  mockSessionStore[session.id] = session;
  return { status: 200, data: { session, questionCount } };
}

function submitAnswer(user: any, sessionId: string, body: any) {
  if (!user) return { status: 401, data: { error: 'Unauthorized' } };
  const session = mockSessionStore[sessionId];
  if (!session) return { status: 404, data: { error: 'Session not found' } };
  if (session.userId !== user.id) return { status: 403, data: { error: 'Forbidden' } };
  return { status: 201, data: { id: 'att_' + Date.now(), sessionId, questionId: body.questionId, userAnswer: body.userAnswer, score: body.score ?? null, aiFeedback: body.aiFeedback ?? null } };
}

function getSession(user: any, sessionId: string) {
  if (!user) return { status: 401, data: { error: 'Unauthorized' } };
  const session = mockSessionStore[sessionId];
  if (!session) return { status: 404, data: { error: 'Session not found' } };
  if (session.userId !== user.id) return { status: 403, data: { error: 'Forbidden' } };
  return { status: 200, data: { ...session, attempts: [] } };
}

const mockUser = { id: 'user_123', email: 'test@example.com', name: 'Test User', subscriptionTier: 'free', isAdmin: false };
const MALICIOUS_MODE = '<img src=x onerror=alert(1)>quick_drill';

describe('Interview session creation', () => {
  beforeEach(() => { resetStore(); });
  it('creates session with valid mode and targetRole', () => {
    const r = createSession(mockUser, { mode: 'quick_drill', targetRole: 'PPC VA' });
    expect(r.status).toBe(200);
    expect(r.data.session.mode).toBe('quick_drill');
    expect(r.data.session.targetRole).toBe('PPC VA');
  });
  it('rejects invalid mode with 400', () => {
    const r = createSession(mockUser, { mode: 'invalid_mode' });
    expect(r.status).toBe(400);
    expect(r.data.error).toContain('mode');
  });
  it('rejects empty mode with 400', () => {
    expect(createSession(mockUser, { mode: '' }).status).toBe(400);
    expect(createSession(mockUser, {}).status).toBe(400);
  });
  it('rejects unauthenticated request with 401', () => {
    expect(createSession(null, { mode: 'quick_drill' }).status).toBe(401);
  });
  it('picks 5 questions for quick_drill', () => {
    expect(createSession(mockUser, { mode: 'quick_drill' }).data.questionCount).toBe(5);
  });
  it('picks 10 questions for role_interview', () => {
    expect(createSession(mockUser, { mode: 'role_interview' }).data.questionCount).toBe(10);
  });
  it('picks 8 questions for technical_screen', () => {
    expect(createSession(mockUser, { mode: 'technical_screen' }).data.questionCount).toBe(8);
  });
  it('picks 8 questions for client_communication', () => {
    expect(createSession(mockUser, { mode: 'client_communication' }).data.questionCount).toBe(8);
  });
  it('picks 10 questions for final_interview', () => {
    expect(createSession(mockUser, { mode: 'final_interview' }).data.questionCount).toBe(10);
  });
  it('picks 5 questions for practical_debrief', () => {
    expect(createSession(mockUser, { mode: 'practical_debrief' }).data.questionCount).toBe(5);
  });
  it('sanitizes HTML from mode string', () => {
    const r = createSession(mockUser, { mode: MALICIOUS_MODE });
    expect(r.status).toBe(200);
    expect(r.data.session.mode).toBe('quick_drill');
  });
});

describe('Answer submission', () => {
  beforeEach(() => { resetStore(); });
  it('rejects unauthenticated with 401', () => {
    expect(submitAnswer(null, 'sess_1', { questionId: 'q1', userAnswer: 'Test' }).status).toBe(401);
  });
  it('returns 404 for nonexistent session', () => {
    expect(submitAnswer(mockUser, 'nonexistent', { questionId: 'q1', userAnswer: 'Test' }).status).toBe(404);
  });
  it('returns 403 for non-owner', () => {
    createSession({ ...mockUser, id: 'other_user' }, { mode: 'quick_drill' });
    const sid = Object.keys(mockSessionStore)[0];
    expect(submitAnswer(mockUser, sid, { questionId: 'q1', userAnswer: 'Test' }).status).toBe(403);
  });
  it('submits answer with 201', () => {
    createSession(mockUser, { mode: 'quick_drill' });
    const sid = Object.keys(mockSessionStore)[0];
    const r = submitAnswer(mockUser, sid, { questionId: 'q1', userAnswer: 'Good answer' });
    expect(r.status).toBe(201);
    expect(r.data.questionId).toBe('q1');
    expect(r.data.userAnswer).toBe('Good answer');
  });
  it('stores AI score and feedback', () => {
    createSession(mockUser, { mode: 'quick_drill' });
    const sid = Object.keys(mockSessionStore)[0];
    const r = submitAnswer(mockUser, sid, { questionId: 'q1', userAnswer: 'A', score: 85, aiFeedback: 'Great!' });
    expect(r.status).toBe(201);
    expect(r.data.score).toBe(85);
    expect(r.data.aiFeedback).toBe('Great!');
  });
  it('stores null score when not provided', () => {
    createSession(mockUser, { mode: 'quick_drill' });
    const sid = Object.keys(mockSessionStore)[0];
    const r = submitAnswer(mockUser, sid, { questionId: 'q1', userAnswer: 'A' });
    expect(r.status).toBe(201);
    expect(r.data.score).toBeNull();
    expect(r.data.aiFeedback).toBeNull();
  });
});

describe('Session retrieval', () => {
  beforeEach(() => { resetStore(); });
  it('returns session for owner', () => {
    createSession(mockUser, { mode: 'quick_drill', targetRole: 'PPC VA' });
    const sid = Object.keys(mockSessionStore)[0];
    const r = getSession(mockUser, sid);
    expect(r.status).toBe(200);
    expect(r.data.targetRole).toBe('PPC VA');
  });
  it('rejects unauthenticated GET with 401', () => {
    expect(getSession(null, 'sess_1').status).toBe(401);
  });
  it('returns 403 for non-owner', () => {
    createSession({ ...mockUser, id: 'other_user' }, { mode: 'quick_drill' });
    const sid = Object.keys(mockSessionStore)[0];
    expect(getSession(mockUser, sid).status).toBe(403);
  });
  it('returns 404 for nonexistent session', () => {
    expect(getSession(mockUser, 'nonexistent').status).toBe(404);
  });
});
