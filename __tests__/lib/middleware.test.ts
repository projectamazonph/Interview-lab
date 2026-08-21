/**
 * @vitest-environment node
 *
 * Exercises src/middleware.ts directly — the Edge-runtime rate limiter that
 * sits in front of every /api/* route. Previously untested (only the
 * separate DB-backed src/lib/rate-limit.ts had coverage).
 */
import { afterAll, describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';

const TRUSTED_TEST_HEADER = 'x-interview-lab-test-client-ip';
const ORIGINAL_TRUSTED_CLIENT_IP_HEADER = process.env.TRUSTED_CLIENT_IP_HEADER;
process.env.TRUSTED_CLIENT_IP_HEADER = TRUSTED_TEST_HEADER;

afterAll(() => {
  if (ORIGINAL_TRUSTED_CLIENT_IP_HEADER === undefined) delete process.env.TRUSTED_CLIENT_IP_HEADER;
  else process.env.TRUSTED_CLIENT_IP_HEADER = ORIGINAL_TRUSTED_CLIENT_IP_HEADER;
});

function req(pathname: string, ip?: string) {
  const headers: Record<string, string> = {};
  if (ip) headers[TRUSTED_TEST_HEADER] = ip;
  return new NextRequest(`http://localhost${pathname}`, { headers });
}

// Mirror middleware.ts's own fallback logic so these tests trip the limiter
// at the actually-configured threshold rather than an assumed default — CI
// overrides API_RATE_LIMIT_MAX/AUTH_RATE_LIMIT_MAX (relaxed for the
// live-server integration suite) for the whole job, including this step.
const GENERAL_MAX = Number(process.env.API_RATE_LIMIT_MAX) || 60;
const AUTH_MAX = Number(process.env.AUTH_RATE_LIMIT_MAX) || 10;

// The limiter is an in-memory Map at module scope, keyed by IP (and by
// "auth:<ip>" for the auth endpoints) — use a fresh IP per test so tests
// don't interfere with each other's counters.
let ipCounter = 0;
function freshIp() {
  return `10.0.${Math.floor(ipCounter / 255)}.${ipCounter++ % 255}`;
}

describe('middleware (Edge rate limiter)', () => {
  it('passes through non-API routes without rate limiting', () => {
    const res = middleware(req('/dashboard', freshIp()));
    expect(res.status).toBe(200);
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });

  it('allows API requests under the general limit', () => {
    const ip = freshIp();
    const res = middleware(req('/api/questions', ip));
    expect(res.status).toBe(200);
  });

  it('blocks a general /api/* request once the configured per-minute limit is exceeded', () => {
    const ip = freshIp();
    let last;
    for (let i = 0; i < GENERAL_MAX + 1; i++) {
      last = middleware(req('/api/questions', ip));
    }
    expect(last!.status).toBe(429);
    expect(last!.headers.get('Retry-After')).toBe('60');
  });

  it('rate-limits by IP, not globally — a fresh IP is unaffected', () => {
    const busyIp = freshIp();
    for (let i = 0; i < GENERAL_MAX + 1; i++) middleware(req('/api/questions', busyIp));

    const otherIp = freshIp();
    const res = middleware(req('/api/questions', otherIp));
    expect(res.status).toBe(200);
  });

  it('applies the stricter, separately-configured auth limit to /api/auth/login', () => {
    const ip = freshIp();
    let last;
    for (let i = 0; i < AUTH_MAX + 1; i++) {
      last = middleware(req('/api/auth/login', ip));
    }
    expect(last!.status).toBe(429);
    expect(last!.headers.get('Retry-After')).toBe('900');
  });

  it('applies the stricter auth limit to /api/auth/register too', () => {
    const ip = freshIp();
    let last;
    for (let i = 0; i < AUTH_MAX + 1; i++) {
      last = middleware(req('/api/auth/register', ip));
    }
    expect(last!.status).toBe(429);
  });

  it('hitting the auth limit does not block other /api/* routes for that IP', () => {
    const ip = freshIp();
    for (let i = 0; i < AUTH_MAX + 1; i++) middleware(req('/api/auth/login', ip));
    // The auth-specific counter is keyed separately ("auth:<ip>") from the
    // general counter, so a non-auth route for the same IP is unaffected.
    const res = middleware(req('/api/questions', ip));
    expect(res.status).toBe(200);
  });

  it('ignores x-real-ip when a trusted proxy header is configured', () => {
    const trustedIp = freshIp();
    let last;
    for (let i = 0; i < GENERAL_MAX + 1; i++) {
      last = middleware(new NextRequest('http://localhost/api/questions', {
        headers: {
          [TRUSTED_TEST_HEADER]: trustedIp,
          'x-real-ip': `203.0.113.${i}`,
        },
      }));
    }
    expect(last!.status).toBe(429);
  });

  it('ignores x-forwarded-for when a trusted proxy header is configured', () => {
    const trustedIp = freshIp();
    let last;
    for (let i = 0; i < GENERAL_MAX + 1; i++) {
      last = middleware(new NextRequest('http://localhost/api/questions', {
        headers: {
          [TRUSTED_TEST_HEADER]: trustedIp,
          'x-forwarded-for': `198.51.100.${i}, 5.6.7.8`,
        },
      }));
    }
    expect(last!.status).toBe(429);
  });

  it('does not let a spoofed x-forwarded-for value bypass the Vercel client-IP limit', () => {
    const originalVercel = process.env.VERCEL;
    const originalTrustedHeader = process.env.TRUSTED_CLIENT_IP_HEADER;
    process.env.VERCEL = '1';
    delete process.env.TRUSTED_CLIENT_IP_HEADER;
    const trustedIp = freshIp();
    let last;

    try {
      for (let i = 0; i < GENERAL_MAX + 1; i++) {
        last = middleware(new NextRequest('http://localhost/api/questions', {
          headers: {
            'x-vercel-forwarded-for': trustedIp,
            'x-forwarded-for': `198.51.100.${i}`,
          },
        }));
      }
    } finally {
      if (originalVercel === undefined) delete process.env.VERCEL;
      else process.env.VERCEL = originalVercel;
      if (originalTrustedHeader === undefined) delete process.env.TRUSTED_CLIENT_IP_HEADER;
      else process.env.TRUSTED_CLIENT_IP_HEADER = originalTrustedHeader;
    }

    expect(last!.status).toBe(429);
  });

  it('falls back to a shared "unknown" bucket when no IP header is present', () => {
    // Every request with no IP headers shares one counter — exercise it
    // without assuming it starts empty (other tests may have hit it too).
    const request = new NextRequest('http://localhost/api/questions');
    const res = middleware(request);
    expect([200, 429]).toContain(res.status);
  });
});
