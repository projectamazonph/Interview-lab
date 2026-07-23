import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';

// ─── Postgres-backed rate limiter ──────────────────────────────────────────
// This used to be an in-memory Map, which only rate-limits within a single
// server process. On Vercel/serverless, every concurrent request can land on
// a different isolate — each with its own empty Map — so the real effective
// limit was `configured_max × concurrent_isolates`, and counts reset on
// every cold start. Backing this with Postgres (via the same checkRateLimit
// used by the auth routes) makes the limit correct across instances, at the
// cost of one extra query per request. Requires the Node.js runtime, since
// Prisma isn't supported on the Edge runtime.
//
// Scoped to /api/* only (not page routes) so marketing/static pages keep
// their static prerendering — running this on every page request would
// force those pages into per-request dynamic rendering for no benefit.
export const config = {
  runtime: 'nodejs',
  matcher: ['/api/:path*'],
};

const GENERAL_WINDOW = 60_000; // 1 minute
const GENERAL_MAX = Number(process.env.API_RATE_LIMIT_MAX) || 60; // requests per minute per IP

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown';
  return ip;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply to API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const clientIp = getClientIp(request);

  // Auth endpoints (login/register/forgot-password/reset-password) apply
  // their own, more precise per-route DB-backed limits inside the route
  // handler itself — this is just the general per-IP floor for every route.
  const result = await checkRateLimit(clientIp, 'api-general', GENERAL_MAX, GENERAL_WINDOW);
  if (!result.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  return NextResponse.next();
}
