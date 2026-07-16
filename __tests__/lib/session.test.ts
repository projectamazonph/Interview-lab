/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import {
  createSession,
  verifySession,
  verifyToken,
  clearSession,
  getSession,
  TOKEN_NAME,
  TOKEN_MAX_AGE,
} from '@/lib/session';

const payload = { sub: 'user-1', email: 'demo@interviewlab.com', tier: 'free', isAdmin: false };

function requestWithCookie(cookieValue?: string) {
  const headers = new Headers();
  if (cookieValue) headers.set('cookie', `${TOKEN_NAME}=${cookieValue}`);
  return new NextRequest('http://localhost/api/dashboard', { headers });
}

describe('createSession / verifyToken', () => {
  it('creates a JWT that verifies back to the original payload', async () => {
    const token = await createSession(payload);
    const decoded = await verifyToken(token);
    expect(decoded).toEqual(payload);
  });

  it('sets an HttpOnly session cookie on the response when provided', async () => {
    const response = NextResponse.json({ ok: true });
    await createSession(payload, response);
    const cookie = response.cookies.get(TOKEN_NAME);
    expect(cookie).toBeDefined();
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.maxAge).toBe(TOKEN_MAX_AGE);
  });

  it('does not set a cookie when no response is provided', async () => {
    // Should simply not throw and still return a token
    const token = await createSession(payload);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // header.payload.signature
  });
});

describe('verifyToken', () => {
  it('returns null for a malformed token', async () => {
    expect(await verifyToken('not-a-real-token')).toBeNull();
  });

  it('returns null for a tampered token', async () => {
    const token = await createSession(payload);
    const tampered = token.slice(0, -2) + 'xx';
    expect(await verifyToken(tampered)).toBeNull();
  });

  it('returns null for an empty string', async () => {
    expect(await verifyToken('')).toBeNull();
  });
});

describe('verifySession', () => {
  it('returns the payload for a request with a valid session cookie', async () => {
    const token = await createSession(payload);
    const request = requestWithCookie(token);
    expect(await verifySession(request)).toEqual(payload);
  });

  it('returns null when there is no session cookie', async () => {
    const request = requestWithCookie();
    expect(await verifySession(request)).toBeNull();
  });

  it('returns null for an invalid session cookie', async () => {
    const request = requestWithCookie('garbage-token');
    expect(await verifySession(request)).toBeNull();
  });
});

describe('clearSession', () => {
  it('overwrites the session cookie with an empty value and zero maxAge', () => {
    const response = NextResponse.json({ ok: true });
    clearSession(response);
    const cookie = response.cookies.get(TOKEN_NAME);
    expect(cookie?.value).toBe('');
    expect(cookie?.maxAge).toBe(0);
  });
});

describe('getSession', () => {
  it('returns null when called outside of a request scope', async () => {
    // next/headers' cookies() throws outside a request context;
    // getSession() should swallow that and return null rather than throw.
    await expect(getSession()).resolves.toBeNull();
  });
});
