import { NextRequest, NextResponse } from 'next/server';

// ─── In-memory rate limiter (Edge Runtime compatible) ─────────────────────────
// Note: Edge Runtime does not support fs/path/process.cwd(), so we use in-memory
// rate limiting here. For persistent rate limiting across restarts, see the
// API route-level checks in /api/auth/register and /api/auth/login which use
// file-based storage via the rateLimit utility.

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const GENERAL_WINDOW = 60_000; // 1 minute
const GENERAL_MAX = 60; // 60 requests per minute per IP for general API
const AUTH_WINDOW = 15 * 60_000; // 15 minutes
const AUTH_MAX = 10; // 10 auth attempts per 15 minutes per IP

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown';
  return ip;
}

function isRateLimited(key: string, max: number, window: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + window });
    return false;
  }

  entry.count++;
  if (entry.count > max) {
    return true;
  }
  return false;
}

// Clean up old entries periodically (every 5 minutes)
let lastCleanup = 0;
function cleanupRateLimits(): void {
  const now = Date.now();
  if (now - lastCleanup < 300_000) return;
  lastCleanup = now;

  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply to API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  cleanupRateLimits();

  const clientIp = getClientIp(request);

  // Stricter rate limit on auth endpoints (brute force protection)
  if (pathname === '/api/auth/login' || pathname === '/api/auth/register') {
    const authKey = `auth:${clientIp}`;
    if (isRateLimited(authKey, AUTH_MAX, AUTH_WINDOW)) {
      return NextResponse.json(
        { error: 'Too many authentication attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': '900' } }
      );
    }
  }

  // General rate limiting for all API routes
  if (isRateLimited(clientIp, GENERAL_MAX, GENERAL_WINDOW)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
