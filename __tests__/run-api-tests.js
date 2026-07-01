#!/usr/bin/env node
/**
 * Comprehensive API Test Runner
 * Runs all API integration tests against a live server
 * Usage: node __tests__/run-api-tests.js
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

let passed = 0;
let failed = 0;
let skipped = 0;
const results = [];

async function api(method, path, body, headers) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  let json;
  try { json = await res.json(); } catch { json = null; }
  return { status: res.status, body: json };
}

function assert(condition, name, detail) {
  if (condition) {
    passed++;
    results.push({ name, status: 'PASS' });
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    results.push({ name, status: 'FAIL', detail });
    console.log(`  ❌ ${name} ${detail || ''}`);
  }
}

async function getDemoUserId() {
  const r = await api('POST', '/api/auth/login', {
    email: 'demo@interviewlab.com', password: 'demo123',
  });
  return r.body?.id;
}

async function getAdminUserId() {
  const r = await api('POST', '/api/auth/login', {
    email: 'admin@interviewlab.com', password: 'admin123',
  });
  return r.body?.id;
}

// ===== TEST SUITES =====

async function testAuth() {
  console.log('\n📋 AUTH ENDPOINTS');
  console.log('─'.repeat(50));
  
  const testEmail = `apitest_${Date.now()}@test.com`;
  
  // Register
  let r = await api('POST', '/api/auth/register', {
    email: testEmail, name: 'API Test', password: 'TestPass1',
  });
  assert(r.status === 201, 'Register new user', `got ${r.status}`);
  
  r = await api('POST', '/api/auth/register', {
    email: testEmail, name: 'API Test', password: 'TestPass1',
  });
  assert(r.status === 409, 'Reject duplicate email', `got ${r.status}`);
  
  r = await api('POST', '/api/auth/register', { email: 'test@test.com' });
  assert(r.status === 400, 'Reject missing password', `got ${r.status}`);
  
  // Login
  r = await api('POST', '/api/auth/login', {
    email: 'demo@interviewlab.com', password: 'demo123',
  });
  assert(r.status === 200, 'Login with valid credentials', `got ${r.status}`);
  assert(!!r.body?.id, 'Login returns user ID');
  
  r = await api('POST', '/api/auth/login', {
    email: 'demo@interviewlab.com', password: 'wrong',
  });
  assert(r.status === 401, 'Reject wrong password', `got ${r.status}`);
  
  r = await api('POST', '/api/auth/login', {
    email: 'nobody@test.com', password: 'test',
  });
  assert(r.status === 401, 'Reject nonexistent user', `got ${r.status}`);
  
  r = await api('POST', '/api/auth/login', {});
  assert(r.status === 400, 'Reject missing login fields', `got ${r.status}`);
}

async function testProfile() {
  console.log('\n📋 PROFILE ENDPOINTS');
  console.log('─'.repeat(50));
  
  const userId = await getDemoUserId();
  
  let r = await api('GET', '/api/profile');
  assert(r.status === 401, 'GET profile requires auth', `got ${r.status}`);
  
  r = await api('GET', '/api/profile', undefined, { 'x-user-id': userId });
  assert(r.status === 200, 'GET profile with auth', `got ${r.status}`);
  
  r = await api('PUT', '/api/profile', {
    targetRole: 'Amazon PPC VA', experienceLevel: 'beginner',
    toolsKnown: ['Helium10'], weakAreas: ['PPC optimization'],
  }, { 'x-user-id': userId });
  assert(r.status === 200, 'PUT profile update', `got ${r.status}`);
  
  r = await api('GET', '/api/profile', undefined, { 'x-user-id': userId });
  const toolsKnown = r.body?.toolsKnown;
  assert(Array.isArray(toolsKnown), 'Profile toolsKnown parsed', `got ${typeof toolsKnown}`);
  
  r = await api('PUT', '/api/profile', { targetRole: 'test' });
  assert(r.status === 401, 'PUT profile requires auth', `got ${r.status}`);
}

async function testDashboard() {
  console.log('\n📋 DASHBOARD ENDPOINT');
  console.log('─'.repeat(50));
  
  const userId = await getDemoUserId();
  
  let r = await api('GET', '/api/dashboard');
  assert(r.status === 401, 'Dashboard requires auth', `got ${r.status}`);
  
  r = await api('GET', '/api/dashboard', undefined, { 'x-user-id': userId });
  assert(r.status === 200, 'Dashboard returns data', `got ${r.status}`);
  assert(typeof r.body?.stats === 'object', 'Dashboard has stats');
}

async function testQuestions() {
  console.log('\n📋 QUESTIONS ENDPOINT');
  console.log('─'.repeat(50));
  
  let r = await api('GET', '/api/questions');
  assert(r.status === 200, 'GET questions (public)', `got ${r.status}`);
  assert(typeof r.body?.total === 'number', 'Questions has total count');
  assert(Array.isArray(r.body?.questions), 'Questions returns array');
  
  r = await api('GET', '/api/questions?role=Amazon+PPC+VA');
  assert(r.status === 200, 'Filter by role', `got ${r.status}`);
  
  r = await api('GET', '/api/questions?difficulty=beginner');
  assert(r.status === 200, 'Filter by difficulty', `got ${r.status}`);
  
  r = await api('GET', '/api/questions?search=ACoS');
  assert(r.status === 200, 'Search questions', `got ${r.status}`);
  assert(r.body?.total > 0, 'Search returns results');
}

async function testInterviews() {
  console.log('\n📋 INTERVIEW ENDPOINTS');
  console.log('─'.repeat(50));
  
  const userId = await getDemoUserId();
  
  // Create
  let r = await api('POST', '/api/interview', {
    mode: 'quick_drill', targetRole: 'Amazon PPC VA',
  });
  assert(r.status === 401, 'Create interview requires auth', `got ${r.status}`);
  
  r = await api('POST', '/api/interview', {
    mode: 'quick_drill', targetRole: 'Amazon PPC VA',
  }, { 'x-user-id': userId });
  assert(r.status === 200, 'Create interview with auth', `got ${r.status}`);
  
  const sessionId = r.body?.session?.id;
  assert(!!sessionId, 'Returns session ID');
  
  // List
  r = await api('GET', '/api/interview', undefined, { 'x-user-id': userId });
  assert(r.status === 200, 'List interviews', `got ${r.status}`);
  
  // Get by ID
  if (sessionId) {
    r = await api('GET', `/api/interview/${sessionId}`);
    assert(r.status === 401, 'GET interview requires auth', `got ${r.status}`);
    
    r = await api('GET', `/api/interview/${sessionId}`, undefined, { 'x-user-id': userId });
    assert(r.status === 200, 'GET interview with auth', `got ${r.status}`);
    
    // Submit answer
    r = await api('GET', '/api/questions?limit=1');
    const questionId = r.body?.questions?.[0]?.id;
    
    if (questionId) {
      r = await api('POST', `/api/interview/${sessionId}`, {
        questionId, userAnswer: 'Test answer about ACoS and bid management',
      }, { 'x-user-id': userId });
      assert(r.status === 201, 'Submit answer', `got ${r.status}`);
    }
    
    // Complete
    r = await api('POST', `/api/interview/${sessionId}/complete`, {}, { 'x-user-id': userId });
    assert(r.status === 200, 'Complete interview', `got ${r.status}`);
    
    // Ownership check - admin shouldn't see demo's session
    const adminId = await getAdminUserId();
    r = await api('GET', `/api/interview/${sessionId}`, undefined, { 'x-user-id': adminId });
    assert(r.status === 403, 'Ownership check blocks other users', `got ${r.status}`);
  }
}

async function testResumes() {
  console.log('\n📋 RESUME ENDPOINTS');
  console.log('─'.repeat(50));
  
  const userId = await getDemoUserId();
  
  let r = await api('POST', '/api/resume', {
    originalText: 'Test resume for integration testing', targetRole: 'Amazon PPC VA',
  }, { 'x-user-id': userId });
  assert(r.status === 201, 'Create resume', `got ${r.status}`);
  
  const resumeId = r.body?.id;
  
  r = await api('GET', '/api/resume', undefined, { 'x-user-id': userId });
  assert(r.status === 200, 'List resumes', `got ${r.status}`);
  
  if (resumeId) {
    r = await api('GET', `/api/resume/${resumeId}`);
    assert(r.status === 401, 'GET resume requires auth', `got ${r.status}`);
    
    r = await api('GET', `/api/resume/${resumeId}`, undefined, { 'x-user-id': userId });
    assert(r.status === 200, 'GET resume with auth', `got ${r.status}`);
    
    r = await api('PUT', `/api/resume/${resumeId}`, {
      score: 72, improvedVersion: 'Improved text', truthFlags: ['test flag'],
    }, { 'x-user-id': userId });
    assert(r.status === 200, 'Update resume', `got ${r.status}`);
    
    // Verify truthFlags is parsed
    r = await api('GET', `/api/resume/${resumeId}`, undefined, { 'x-user-id': userId });
    const tf = r.body?.truthFlags;
    assert(Array.isArray(tf), 'truthFlags parsed', `got ${typeof tf}`);
    
    // Ownership check
    const adminId = await getAdminUserId();
    r = await api('GET', `/api/resume/${resumeId}`, undefined, { 'x-user-id': adminId });
    assert(r.status === 403, 'Resume ownership check', `got ${r.status}`);
  }
}

async function testCoverLetters() {
  console.log('\n📋 COVER LETTER ENDPOINTS');
  console.log('─'.repeat(50));
  
  const userId = await getDemoUserId();
  
  let r = await api('POST', '/api/cover-letter', {
    jobDescription: 'Amazon PPC VA needed', tone: 'professional',
    generatedLetter: 'Dear Hiring Manager...', truthFlags: [],
  }, { 'x-user-id': userId });
  assert(r.status === 201, 'Create cover letter', `got ${r.status}`);
  
  const clId = r.body?.id;
  
  r = await api('GET', '/api/cover-letter', undefined, { 'x-user-id': userId });
  assert(r.status === 200, 'List cover letters', `got ${r.status}`);
  
  if (clId) {
    r = await api('GET', `/api/cover-letter/${clId}`);
    assert(r.status === 401, 'GET cover letter requires auth', `got ${r.status}`);
    
    r = await api('GET', `/api/cover-letter/${clId}`, undefined, { 'x-user-id': userId });
    assert(r.status === 200, 'GET cover letter with auth', `got ${r.status}`);
    
    r = await api('PUT', `/api/cover-letter/${clId}`, {
      generatedLetter: 'Updated letter', truthFlags: ['flag1'],
    }, { 'x-user-id': userId });
    assert(r.status === 200, 'Update cover letter', `got ${r.status}`);
  }
}

async function testAssessments() {
  console.log('\n📋 ASSESSMENTS ENDPOINTS');
  console.log('─'.repeat(50));
  
  let r = await api('GET', '/api/assessments');
  assert(r.status === 200, 'List assessments', `got ${r.status}`);
  assert(r.body?.assessments.length > 0, 'Has assessment data');
  
  const aId = r.body?.assessments?.[0]?.id;
  if (aId) {
    r = await api('GET', `/api/assessments/${aId}`);
    assert(r.status === 200, 'Get assessment by ID', `got ${r.status}`);
  }
}

async function testDownloads() {
  console.log('\n📋 DOWNLOADS ENDPOINTS');
  console.log('─'.repeat(50));
  
  let r = await api('GET', '/api/downloads');
  assert(r.status === 200, 'List downloads', `got ${r.status}`);
  assert(r.body?.downloads.length > 0, 'Has downloads');
  
  // Check fileName safety
  const downloads = r.body?.downloads;
  const safePattern = /^[a-zA-Z0-9._-]+$/;
  const allSafe = downloads?.every(d => safePattern.test(d.fileName || ''));
  assert(allSafe, 'All fileNames use safe characters');
}

async function testGuides() {
  console.log('\n📋 GUIDES / LEARNING PATHS ENDPOINTS');
  console.log('─'.repeat(50));
  
  let r = await api('GET', '/api/guides');
  assert(r.status === 200, 'List guides', `got ${r.status}`);
  
  const guides = r.body?.guides;
  assert(guides.length >= 20, 'Has at least 20 guides', `got ${guides?.length}`);
  const allPublished = guides?.every(g => g.status === 'published');
  assert(allPublished, 'All returned guides are published');
  
  // Progress
  const userId = await getDemoUserId();
  r = await api('GET', '/api/guides/progress');
  assert(r.status === 401, 'Progress requires auth', `got ${r.status}`);
  
  r = await api('GET', '/api/guides/progress', undefined, { 'x-user-id': userId });
  assert(r.status === 200, 'Get progress with auth', `got ${r.status}`);
  
  const gId = guides?.[0]?.id;
  if (gId) {
    r = await api('POST', '/api/guides/progress', {
      guideId: gId, completed: false, checklist: { item0: true },
    }, { 'x-user-id': userId });
    assert(r.status === 200, 'Save progress', `got ${r.status}`);
    
    // Verify checklist is parsed
    r = await api('GET', '/api/guides/progress', undefined, { 'x-user-id': userId });
    const progress = r.body?.progress;
    const thisProgress = progress?.find(p => p.guideId === gId);
    assert(typeof thisProgress?.checklist === 'object', 'Checklist parsed', `got ${typeof thisProgress?.checklist}`);
  }
}

async function testAIEndpoints() {
  console.log('\n📋 AI ENDPOINTS (auth check only)');
  console.log('─'.repeat(50));
  
  const userId = await getDemoUserId();
  
  let r = await api('POST', '/api/ai/coach', { question: 'test', userAnswer: 'test' });
  assert(r.status === 401, 'AI coach requires auth', `got ${r.status}`);
  
  r = await api('POST', '/api/ai/resume-review', { resumeText: 'test' });
  assert(r.status === 401, 'AI resume review requires auth', `got ${r.status}`);
  
  r = await api('POST', '/api/ai/cover-letter', { jobDescription: 'test' });
  assert(r.status === 401, 'AI cover letter requires auth', `got ${r.status}`);
  
  r = await api('POST', '/api/ai/assessment-score', { assessmentTitle: 'test', userAnswers: {} });
  assert(r.status === 401, 'AI assessment score requires auth', `got ${r.status}`);
}

async function testAdmin() {
  console.log('\n📋 ADMIN ENDPOINTS');
  console.log('─'.repeat(50));
  
  const adminId = await getAdminUserId();
  const demoId = await getDemoUserId();
  
  // Admin access
  let r = await api('GET', '/api/admin/questions', undefined, { 'x-user-id': adminId });
  assert(r.status === 200, 'Admin can list questions', `got ${r.status}`);
  
  r = await api('GET', '/api/admin/questions', undefined, { 'x-user-id': demoId });
  assert(r.status === 403, 'Non-admin rejected from admin', `got ${r.status}`);
  
  r = await api('GET', '/api/admin/questions');
  assert(r.status === 401, 'Admin requires auth', `got ${r.status}`);
  
  // Create question
  r = await api('POST', '/api/admin/questions', {
    role: 'PPC VA', difficulty: 'beginner', type: 'technical',
    skillArea: 'PPC', question: 'Integration test question',
  }, { 'x-user-id': adminId });
  assert(r.status === 201, 'Admin can create question', `got ${r.status}`);
}

async function testExport() {
  console.log('\n📋 EXPORT ENDPOINT');
  console.log('─'.repeat(50));
  
  const userId = await getDemoUserId();
  
  let r = await api('POST', '/api/export', { type: 'docx', content: 'Test', title: 'Test' });
  assert(r.status === 401, 'Export requires auth', `got ${r.status}`);
  
  r = await api('POST', '/api/export', {}, { 'x-user-id': userId });
  assert(r.status === 400, 'Export validates required fields', `got ${r.status}`);
}

// ===== MAIN =====

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║       Amazon VA Interview Lab - API Test Suite          ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Time: ${new Date().toISOString()}\n`);
  
  // Health check
  try {
    const r = await fetch(`${BASE_URL}/api`);
    if (r.status !== 200) throw new Error(`Health check: ${r.status}`);
    console.log('✅ Server is running\n');
  } catch {
    console.error('❌ Server not available. Start with: node .next/standalone/server.js');
    process.exit(1);
  }
  
  const startTime = performance.now();
  
  try { await testAuth(); } catch (e) { console.error('Auth tests error:', e); }
  try { await testProfile(); } catch (e) { console.error('Profile tests error:', e); }
  try { await testDashboard(); } catch (e) { console.error('Dashboard tests error:', e); }
  try { await testQuestions(); } catch (e) { console.error('Questions tests error:', e); }
  try { await testInterviews(); } catch (e) { console.error('Interview tests error:', e); }
  try { await testResumes(); } catch (e) { console.error('Resumes tests error:', e); }
  try { await testCoverLetters(); } catch (e) { console.error('Cover letters tests error:', e); }
  try { await testAssessments(); } catch (e) { console.error('Assessments tests error:', e); }
  try { await testDownloads(); } catch (e) { console.error('Downloads tests error:', e); }
  try { await testGuides(); } catch (e) { console.error('Guides tests error:', e); }
  try { await testAIEndpoints(); } catch (e) { console.error('AI tests error:', e); }
  try { await testAdmin(); } catch (e) { console.error('Admin tests error:', e); }
  try { await testExport(); } catch (e) { console.error('Export tests error:', e); }
  
  const duration = ((performance.now() - startTime) / 1000).toFixed(2);
  
  console.log('\n' + '═'.repeat(58));
  console.log(`  RESULTS: ${passed} passed, ${failed} failed, ${skipped} skipped`);
  console.log(`  Duration: ${duration}s`);
  console.log(`  Total tests: ${passed + failed + skipped}`);
  console.log('═'.repeat(58));
  
  // Save results
  const fs = await import('fs/promises');
  await fs.mkdir('/home/z/my-project/download', { recursive: true });
  await fs.writeFile('/home/z/my-project/download/api-test-results.json', 
    JSON.stringify({ timestamp: new Date().toISOString(), passed, failed, skipped, duration, results }, null, 2));
  
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
