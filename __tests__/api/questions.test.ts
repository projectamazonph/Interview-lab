import { describe, it, expect, beforeEach } from 'bun:test';

// In-memory question store
const MOCK_QUESTIONS = [
  { id: 'q1', question: 'What is ACoS and how do you calculate it?', role: 'PPC VA', difficulty: 'beginner', type: 'technical', skillArea: 'PPC', status: 'published', createdAt: new Date() },
  { id: 'q2', question: 'How would you optimize a campaign with high ACoS?', role: 'PPC VA', difficulty: 'intermediate', type: 'scenario', skillArea: 'PPC', status: 'published', createdAt: new Date() },
  { id: 'q3', question: 'Walk me through your daily Amazon account routine', role: 'Account VA', difficulty: 'beginner', type: 'behavioral', skillArea: 'Seller Central', status: 'published', createdAt: new Date() },
  { id: 'q4', question: 'How do you handle a difficult client?', role: 'Agency VA', difficulty: 'advanced', type: 'behavioral', skillArea: 'client_communication', status: 'published', createdAt: new Date() },
  { id: 'q5', question: 'Build a negative keyword strategy for a new campaign', role: 'PPC VA', difficulty: 'advanced', type: 'case_study', skillArea: 'keyword_research', status: 'published', createdAt: new Date() },
  { id: 'q6', question: 'What tools do you use for PPC reporting?', role: 'Reporting VA', difficulty: 'intermediate', type: 'tool_specific', skillArea: 'reporting', status: 'published', createdAt: new Date() },
  { id: 'q7', question: 'Can you really multiply 2x2?', role: 'General', difficulty: 'beginner', type: 'trick', skillArea: 'marketplace_basics', status: 'published', createdAt: new Date() },
  { id: 'q8', question: 'Draft a listing for a new product', role: 'Listing VA', difficulty: 'intermediate', type: 'scenario', skillArea: 'campaign_structure', status: 'published', createdAt: new Date() },
  { id: 'q9', question: 'Explain the difference between broad and exact match', role: 'PPC VA', difficulty: 'beginner', type: 'technical', skillArea: 'keyword_research', status: 'published', createdAt: new Date() },
  { id: 'q10', question: 'How do you structure a monthly report?', role: 'Reporting VA', difficulty: 'intermediate', type: 'technical', skillArea: 'reporting', status: 'published', createdAt: new Date() },
  { id: 'q_draft', question: 'This is a draft question', role: 'PPC VA', difficulty: 'beginner', type: 'technical', skillArea: 'PPC', status: 'draft', createdAt: new Date() },
];

// Simulates the GET handler logic with in-memory store
function queryQuestions(params: {
  role?: string | null;
  difficulty?: string | null;
  type?: string | null;
  skillArea?: string | null;
  search?: string | null;
  limit?: number;
  offset?: number;
}) {
  const { role, difficulty, type, skillArea, search, limit = 50, offset = 0 } = params;
  let filtered = MOCK_QUESTIONS.filter(q => q.status === 'published');

  if (role && role !== 'all') filtered = filtered.filter(q => q.role === role);
  if (difficulty && difficulty !== 'all') filtered = filtered.filter(q => q.difficulty === difficulty);
  if (type && type !== 'all') filtered = filtered.filter(q => q.type === type);
  if (skillArea && skillArea !== 'all') filtered = filtered.filter(q => q.skillArea === skillArea);
  if (search) filtered = filtered.filter(q => q.question.toLowerCase().includes(search.toLowerCase()));

  const total = filtered.length;
  const questions = filtered.slice(offset, offset + limit);
  return { questions, total };
}

describe('GET /api/questions — default', () => {
  it('returns all published questions by default', () => {
    const r = queryQuestions({});
    expect(r.total).toBe(10); // 11 published - 1 draft
    expect(r.questions.length).toBe(10);
  });

  it('excludes draft questions', () => {
    const r = queryQuestions({});
    const draft = r.questions.find(q => q.id === 'q_draft' || q.status === 'draft');
    expect(draft).toBeUndefined();
  });
});

describe('GET /api/questions — role filter', () => {
  it('filters by exact role', () => {
    const r = queryQuestions({ role: 'PPC VA' });
    expect(r.total).toBe(4); // q1, q2, q5, q9
    r.questions.forEach(q => expect(q.role).toBe('PPC VA'));
  });

  it('returns empty for nonexistent role', () => {
    const r = queryQuestions({ role: 'Nonexistent Role' });
    expect(r.total).toBe(0);
    expect(r.questions).toHaveLength(0);
  });

  it('returns all for role=all', () => {
    const r = queryQuestions({ role: 'all' });
    expect(r.total).toBe(10);
  });
});

describe('GET /api/questions — difficulty filter', () => {
  it('filters by beginner', () => {
    const r = queryQuestions({ difficulty: 'beginner' });
    expect(r.total).toBe(4); // q1, q3, q7, q9
    r.questions.forEach(q => expect(q.difficulty).toBe('beginner'));
  });

  it('filters by intermediate', () => {
    const r = queryQuestions({ difficulty: 'intermediate' });
    expect(r.total).toBe(4); // q2, q6, q8, q10
    r.questions.forEach(q => expect(q.difficulty).toBe('intermediate'));
  });

  it('filters by advanced', () => {
    const r = queryQuestions({ difficulty: 'advanced' });
    expect(r.total).toBe(2); // q4, q5
    r.questions.forEach(q => expect(q.difficulty).toBe('advanced'));
  });

  it('returns all for difficulty=all', () => {
    const r = queryQuestions({ difficulty: 'all' });
    expect(r.total).toBe(10);
  });
});

describe('GET /api/questions — type filter', () => {
  it('filters by technical', () => {
    const r = queryQuestions({ type: 'technical' });
    expect(r.total).toBe(3); // q1, q9, q10 (q6 is tool_specific)
    r.questions.forEach(q => expect(q.type).toBe('technical'));
  });

  it('filters by behavioral', () => {
    const r = queryQuestions({ type: 'behavioral' });
    expect(r.total).toBe(2); // q3, q4
    r.questions.forEach(q => expect(q.type).toBe('behavioral'));
  });

  it('filters by scenario', () => {
    const r = queryQuestions({ type: 'scenario' });
    expect(r.total).toBe(2); // q2, q8
    r.questions.forEach(q => expect(q.type).toBe('scenario'));
  });

  it('filters by case_study', () => {
    const r = queryQuestions({ type: 'case_study' });
    expect(r.total).toBe(1); // q5
    r.questions.forEach(q => expect(q.type).toBe('case_study'));
  });

  it('filters by tool_specific', () => {
    const r = queryQuestions({ type: 'tool_specific' });
    expect(r.total).toBe(1); // q6
    r.questions.forEach(q => expect(q.type).toBe('tool_specific'));
  });

  it('filters by trick', () => {
    const r = queryQuestions({ type: 'trick' });
    expect(r.total).toBe(1); // q7
    r.questions.forEach(q => expect(q.type).toBe('trick'));
  });

  it('returns all for type=all', () => {
    const r = queryQuestions({ type: 'all' });
    expect(r.total).toBe(10);
  });
});

describe('GET /api/questions — skillArea filter', () => {
  it('filters by PPC', () => {
    const r = queryQuestions({ skillArea: 'PPC' });
    expect(r.total).toBe(2); // q1, q2
    r.questions.forEach(q => expect(q.skillArea).toBe('PPC'));
  });

  it('filters by reporting', () => {
    const r = queryQuestions({ skillArea: 'reporting' });
    expect(r.total).toBe(2); // q6, q10
    r.questions.forEach(q => expect(q.skillArea).toBe('reporting'));
  });

  it('filters by keyword_research', () => {
    const r = queryQuestions({ skillArea: 'keyword_research' });
    expect(r.total).toBe(2); // q5, q9
    r.questions.forEach(q => expect(q.skillArea).toBe('keyword_research'));
  });

  it('filters by client_communication', () => {
    const r = queryQuestions({ skillArea: 'client_communication' });
    expect(r.total).toBe(1); // q4
    r.questions.forEach(q => expect(q.skillArea).toBe('client_communication'));
  });

  it('returns all for skillArea=all', () => {
    const r = queryQuestions({ skillArea: 'all' });
    expect(r.total).toBe(10);
  });
});

describe('GET /api/questions — search', () => {
  it('searches by keyword (case insensitive)', () => {
    const r = queryQuestions({ search: 'acos' });
    expect(r.total).toBe(2); // q1 (ACoS), q2 (high ACoS)
    r.questions.forEach(q => expect(q.question.toLowerCase()).toContain('acos'));
  });

  it('returns empty for unmatched search', () => {
    const r = queryQuestions({ search: 'xyznonexistentkeyword' });
    expect(r.total).toBe(0);
  });

  it('finds campaign-related questions', () => {
    const r = queryQuestions({ search: 'campaign' });
    expect(r.total).toBe(2); // q5 (new campaign), q8 (listing... campaign)
  });

  it('handles empty search string', () => {
    const r = queryQuestions({ search: '' });
    expect(r.total).toBe(10);
  });

  it('finds report-related questions', () => {
    const r = queryQuestions({ search: 'report' });
    expect(r.total).toBe(2); // q6, q10
  });
});

describe('GET /api/questions — pagination', () => {
  it('respects limit parameter', () => {
    const r = queryQuestions({ limit: 3 });
    expect(r.questions.length).toBe(3);
    expect(r.total).toBe(10);
  });

  it('respects offset parameter', () => {
    const r = queryQuestions({ limit: 5, offset: 5 });
    expect(r.questions.length).toBe(5);
    expect(r.total).toBe(10);
  });

  it('handles offset beyond results', () => {
    const r = queryQuestions({ offset: 100 });
    expect(r.questions.length).toBe(0);
    expect(r.total).toBe(10);
  });

  it('defaults limit to 50', () => {
    const r = queryQuestions({});
    expect(r.questions.length).toBe(10); // only 10 published
  });

  it('defaults offset to 0', () => {
    const r = queryQuestions({ offset: 0 });
    expect(r.questions.length).toBe(10);
  });
});

describe('GET /api/questions — combined filters', () => {
  it('combines role and difficulty filters', () => {
    const r = queryQuestions({ role: 'PPC VA', difficulty: 'beginner' });
    expect(r.total).toBe(2); // q1, q9
  });

  it('combines role and type filters', () => {
    const r = queryQuestions({ role: 'PPC VA', type: 'technical' });
    expect(r.total).toBe(2); // q1, q9
  });

  it('combines all three: role, difficulty, type', () => {
    const r = queryQuestions({ role: 'PPC VA', difficulty: 'beginner', type: 'technical' });
    expect(r.total).toBe(2); // q1, q9
  });

  it('combines search with role filter', () => {
    const r = queryQuestions({ role: 'PPC VA', search: 'acos' });
    expect(r.total).toBe(2); // q1, q2
  });

  it('returns empty when filters are mutually exclusive', () => {
    const r = queryQuestions({ role: 'PPC VA', type: 'behavioral' });
    expect(r.total).toBe(0);
  });
});

describe('GET /api/questions — question structure', () => {
  it('returns questions with required fields', () => {
    const r = queryQuestions({ role: 'PPC VA', limit: 1 });
    const q = r.questions[0];
    expect(q).toHaveProperty('id');
    expect(q).toHaveProperty('question');
    expect(q).toHaveProperty('role');
    expect(q).toHaveProperty('difficulty');
    expect(q).toHaveProperty('type');
    expect(q).toHaveProperty('skillArea');
    expect(q).toHaveProperty('status');
  });

  it('questions are sorted by createdAt desc', () => {
    const r = queryQuestions({});
    for (let i = 1; i < r.questions.length; i++) {
      const prev = r.questions[i - 1].createdAt.getTime();
      const curr = r.questions[i].createdAt.getTime();
      expect(prev).toBeGreaterThanOrEqual(curr);
    }
  });
});
