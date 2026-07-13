/**
 * Stress Test Suite - Tests app under load
 * Run with: npx tsx __tests__/stress/stress-test.ts
 * 
 * Requires server running at localhost:3000
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const CONCURRENT_USERS = 10;
const REQUESTS_PER_USER = 5;
const MAX_RESPONSE_TIME_MS = 5000;

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  statusCode?: number;
}

interface StressTestReport {
  timestamp: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  errors: string[];
  results: TestResult[];
}

async function api(
  method: string,
  path: string,
  body?: unknown,
  headers?: Record<string, string>
): Promise<{ status: number; body: unknown; duration: number }> {
  const start = performance.now();
  const opts: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  const duration = performance.now() - start;
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    json = await res.text();
  }
  return { status: res.status, body: json, duration };
}

async function getDemoUserId(): Promise<string> {
  const { body } = await api('POST', '/api/auth/login', {
    email: 'demo@interviewlab.com',
    password: 'demo123',
  });
  return (body as { id: string }).id;
}

// ===== TEST SUITES =====

async function stressAuthEndpoint(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  // Concurrent registration attempts
  const registerPromises = Array.from({ length: CONCURRENT_USERS }, (_, i) =>
    api('POST', '/api/auth/register', {
      email: `stress_test_${i}_${Date.now()}@test.com`,
      name: `Stress User ${i}`,
      password: 'TestPass123!',
    }).then(r => ({
      name: `register_user_${i}`,
      passed: r.status === 201,
      duration: r.duration,
      statusCode: r.status,
      error: r.status !== 201 ? `Expected 201, got ${r.status}` : undefined,
    }))
  );
  
  const registerResults = await Promise.all(registerPromises);
  results.push(...registerResults);
  
  // Concurrent login attempts
  const loginPromises = Array.from({ length: CONCURRENT_USERS * 2 }, (_, i) =>
    api('POST', '/api/auth/login', {
      email: 'demo@interviewlab.com',
      password: 'demo123',
    }).then(r => ({
      name: `login_attempt_${i}`,
      passed: r.status === 200,
      duration: r.duration,
      statusCode: r.status,
      error: r.status !== 200 ? `Expected 200, got ${r.status}` : undefined,
    }))
  );
  
  const loginResults = await Promise.all(loginPromises);
  results.push(...loginResults);
  
  return results;
}

async function stressQuestionsEndpoint(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  // Rapid sequential queries with different filters
  const queries = [
    '/api/questions',
    '/api/questions?role=Amazon+PPC+VA',
    '/api/questions?difficulty=beginner',
    '/api/questions?type=technical',
    '/api/questions?search=ACoS',
    '/api/questions?limit=10&offset=0',
    '/api/questions?role=Amazon+Account+VA&difficulty=intermediate',
    '/api/questions?search=campaign',
    '/api/questions?skillArea=PPC+Fundamentals',
    '/api/questions?limit=100',
  ];
  
  // Each user makes multiple queries
  const queryPromises: Promise<TestResult>[] = [];
  for (let u = 0; u < CONCURRENT_USERS; u++) {
    for (let q = 0; q < queries.length; q++) {
      queryPromises.push(
        api('GET', queries[q]).then(r => ({
          name: `query_${u}_${q}`,
          passed: r.status === 200 && r.duration < MAX_RESPONSE_TIME_MS,
          duration: r.duration,
          statusCode: r.status,
          error: r.status !== 200 ? `Expected 200, got ${r.status}` : 
                 r.duration >= MAX_RESPONSE_TIME_MS ? `Slow: ${r.duration}ms` : undefined,
        }))
      );
    }
  }
  
  const queryResults = await Promise.all(queryPromises);
  results.push(...queryResults);
  
  return results;
}

async function stressInterviewFlow(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const userId = await getDemoUserId();
  
  // Concurrent interview creation
  const createPromises = Array.from({ length: CONCURRENT_USERS }, (_, i) =>
    api('POST', '/api/interview', {
      mode: 'quick_drill',
      targetRole: 'Amazon PPC VA',
    }, { 'x-user-id': userId }).then(r => ({
      name: `create_interview_${i}`,
      passed: r.status === 200,
      duration: r.duration,
      statusCode: r.status,
      error: r.status !== 200 ? `Expected 200, got ${r.status}` : undefined,
    }))
  );
  
  const createResults = await Promise.all(createPromises);
  results.push(...createResults);
  
  return results;
}

async function stressDownloadsEndpoint(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  // Concurrent download listing
  const downloadPromises = Array.from({ length: CONCURRENT_USERS * REQUESTS_PER_USER }, (_, i) =>
    api('GET', '/api/downloads').then(r => ({
      name: `downloads_${i}`,
      passed: r.status === 200 && r.duration < MAX_RESPONSE_TIME_MS,
      duration: r.duration,
      statusCode: r.status,
      error: r.status !== 200 ? `Expected 200, got ${r.status}` : undefined,
    }))
  );
  
  const downloadResults = await Promise.all(downloadPromises);
  results.push(...downloadResults);
  
  return results;
}

async function stressGuidesEndpoint(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  // Concurrent guide listing
  const guidePromises = Array.from({ length: CONCURRENT_USERS * REQUESTS_PER_USER }, (_, i) =>
    api('GET', '/api/guides').then(r => ({
      name: `guides_${i}`,
      passed: r.status === 200 && r.duration < MAX_RESPONSE_TIME_MS,
      duration: r.duration,
      statusCode: r.status,
      error: r.status !== 200 ? `Expected 200, got ${r.status}` : undefined,
    }))
  );
  
  const guideResults = await Promise.all(guidePromises);
  results.push(...guideResults);
  
  return results;
}

async function stressDashboardEndpoint(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const userId = await getDemoUserId();
  
  // Concurrent dashboard requests (tests the N+1 query performance)
  const dashboardPromises = Array.from({ length: CONCURRENT_USERS }, (_, i) =>
    api('GET', '/api/dashboard', undefined, { 'x-user-id': userId }).then(r => ({
      name: `dashboard_${i}`,
      passed: r.status === 200 && r.duration < MAX_RESPONSE_TIME_MS,
      duration: r.duration,
      statusCode: r.status,
      error: r.status !== 200 ? `Expected 200, got ${r.status}` : 
             r.duration >= MAX_RESPONSE_TIME_MS ? `Slow: ${r.duration}ms` : undefined,
    }))
  );
  
  const dashboardResults = await Promise.all(dashboardPromises);
  results.push(...dashboardResults);
  
  return results;
}

// ===== REPORT GENERATION =====

function generateReport(allResults: TestResult[]): StressTestReport {
  const durations = allResults.map(r => r.duration);
  const sorted = [...durations].sort((a, b) => a - b);
  const successful = allResults.filter(r => r.passed);
  const failed = allResults.filter(r => !r.passed);
  const errors = failed.map(r => `${r.name}: ${r.error || 'Unknown error'}`);
  const totalTime = durations.reduce((a, b) => a + b, 0);
  
  const p95Index = Math.ceil(sorted.length * 0.95) - 1;
  const p99Index = Math.ceil(sorted.length * 0.99) - 1;
  
  return {
    timestamp: new Date().toISOString(),
    totalRequests: allResults.length,
    successfulRequests: successful.length,
    failedRequests: failed.length,
    avgResponseTime: totalTime / allResults.length,
    maxResponseTime: Math.max(...durations),
    minResponseTime: Math.min(...durations),
    p95ResponseTime: sorted[p95Index] || 0,
    p99ResponseTime: sorted[p99Index] || 0,
    requestsPerSecond: (allResults.length / (totalTime / 1000)),
    errors: errors.slice(0, 20), // First 20 errors
    results: allResults,
  };
}

function printReport(report: StressTestReport) {
  console.log('\n' + '='.repeat(60));
  console.log('  STRESS TEST REPORT');
  console.log('='.repeat(60));
  console.log(`  Timestamp:           ${report.timestamp}`);
  console.log(`  Total Requests:      ${report.totalRequests}`);
  console.log(`  Successful:          ${report.successfulRequests} (${(report.successfulRequests / report.totalRequests * 100).toFixed(1)}%)`);
  console.log(`  Failed:              ${report.failedRequests} (${(report.failedRequests / report.totalRequests * 100).toFixed(1)}%)`);
  console.log(`  Avg Response Time:   ${report.avgResponseTime.toFixed(1)}ms`);
  console.log(`  Min Response Time:   ${report.minResponseTime.toFixed(1)}ms`);
  console.log(`  Max Response Time:   ${report.maxResponseTime.toFixed(1)}ms`);
  console.log(`  P95 Response Time:   ${report.p95ResponseTime.toFixed(1)}ms`);
  console.log(`  P99 Response Time:   ${report.p99ResponseTime.toFixed(1)}ms`);
  console.log(`  Requests/sec:        ${report.requestsPerSecond.toFixed(1)}`);
  console.log('='.repeat(60));
  
  if (report.errors.length > 0) {
    console.log('\n  ERRORS (first 20):');
    report.errors.forEach(e => console.log(`    - ${e}`));
  }
  
  // Per-suite breakdown
  const suites = ['register', 'login', 'query', 'create_interview', 'downloads', 'guides', 'dashboard'];
  console.log('\n  PER-SUITE BREAKDOWN:');
  suites.forEach(suite => {
    const suiteResults = report.results.filter(r => r.name.startsWith(suite));
    if (suiteResults.length === 0) return;
    const suiteAvg = suiteResults.reduce((a, r) => a + r.duration, 0) / suiteResults.length;
    const suiteFailed = suiteResults.filter(r => !r.passed).length;
    console.log(`    ${suite.padEnd(20)} avg=${suiteAvg.toFixed(1)}ms  failed=${suiteFailed}/${suiteResults.length}`);
  });
  
  console.log('='.repeat(60) + '\n');
}

// ===== MAIN =====

async function main() {
  console.log('Starting stress tests...');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Concurrent users: ${CONCURRENT_USERS}`);
  console.log(`Requests per user: ${REQUESTS_PER_USER}`);
  console.log(`Max acceptable response time: ${MAX_RESPONSE_TIME_MS}ms\n`);

  // Check server availability
  try {
    const { status } = await api('GET', '/api');
    if (status !== 200) throw new Error(`Health check returned ${status}`);
  } catch (e) {
    console.error('Server not available. Start with: node .next/standalone/server.js');
    process.exit(1);
  }

  const allResults: TestResult[] = [];

  console.log('Running auth stress test...');
  allResults.push(...await stressAuthEndpoint());

  console.log('Running questions stress test...');
  allResults.push(...await stressQuestionsEndpoint());

  console.log('Running interview stress test...');
  allResults.push(...await stressInterviewFlow());

  console.log('Running downloads stress test...');
  allResults.push(...await stressDownloadsEndpoint());

  console.log('Running guides stress test...');
  allResults.push(...await stressGuidesEndpoint());

  console.log('Running dashboard stress test...');
  allResults.push(...await stressDashboardEndpoint());

  const report = generateReport(allResults);
  printReport(report);

  // Save report
  const fs = await import('fs/promises');
  const reportPath = '/home/z/my-project/download/stress-test-report.json';
  await fs.mkdir('/home/z/my-project/download', { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`Report saved to ${reportPath}`);

  // Exit with error code if too many failures
  const failureRate = report.failedRequests / report.totalRequests;
  if (failureRate > 0.1) {
    console.error(`FAILURE RATE TOO HIGH: ${(failureRate * 100).toFixed(1)}% (> 10%)`);
    process.exit(1);
  }
  
  console.log('All stress tests completed successfully!');
}

main().catch(e => {
  console.error('Stress test runner error:', e);
  process.exit(1);
});
